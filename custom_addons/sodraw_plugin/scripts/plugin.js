(function(window, undefined) {
    "use strict";

    /**
     * SODRAW Plugin for OnlyOffice
     * Inserts draw.io diagrams as high-quality PNG with mxfile stored for re-editing
     *
     * Key features:
     * - Uses PutImageDataToSelection API (like Photo Editor) for reliable insertion
     * - PNG format with 10x scale for maximum quality
     * - Stores mxfile XML in localStorage for re-editing capability
     * - To re-edit: select the image, then click SODRAW plugin
     *
     * IMPORTANT: On re-edit, we MUST preserve the original document dimensions
     * The high-quality PNG (10x scale) is for pixel density, NOT for display size
     */

    var DEBUG = true;
    var drawioFrame = null;
    var currentXml = null;
    var waitingForExport = false;

    // Export scale factor (10x for maximum quality - this is pixel density, not display size)
    var EXPORT_SCALE = 10;

    // Store original document dimensions for re-edit (to preserve size)
    // These are the dimensions shown in the document, NOT the PNG pixel dimensions
    var originalDocWidth = null;
    var originalDocHeight = null;

    // Flag to track if we're editing an existing image
    var isReEdit = false;

    // Marker to identify SODRAW images (stored in local storage keyed by image hash)
    var SODRAW_STORAGE_PREFIX = "sodraw_mxfile_";

    // Empty diagram template
    var BLANK_DIAGRAM = '<mxfile host="embed.diagrams.net" modified="' + new Date().toISOString() + '">' +
        '<diagram id="d1" name="Page-1">' +
        '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>' +
        '</diagram></mxfile>';

    function log(message, data) {
        if (DEBUG) {
            var prefix = "[SODRAW] ";
            if (data !== undefined) {
                console.log(prefix + message, data);
            } else {
                console.log(prefix + message);
            }
        }
    }

    function logError(message, error) {
        console.error("[SODRAW] " + message, error || "");
    }

    // ========== PLUGIN LIFECYCLE ==========

    window.Asc.plugin.init = function(data) {
        log("=== Plugin Initialized ===");
        log("Init data type: " + typeof data);

        drawioFrame = document.getElementById("drawio-frame");
        if (!drawioFrame) {
            logError("Cannot find iframe element!");
            return;
        }

        // Listen for messages from draw.io
        window.addEventListener("message", onDrawioMessage, false);

        // Try to get selected image data (for re-edit scenario)
        window.Asc.plugin.executeMethod("GetImageDataFromSelection", [], function(oResult) {
            log("GetImageDataFromSelection result:", oResult);

            if (oResult && oResult.src && oResult.width > 0 && oResult.height > 0) {
                log("Found existing image: " + oResult.width + "x" + oResult.height);

                // This is a RE-EDIT scenario
                isReEdit = true;

                // CRITICAL: Store original document dimensions to preserve size on re-edit
                // These dimensions come directly from the document - they are AUTHORITATIVE
                originalDocWidth = oResult.width;
                originalDocHeight = oResult.height;
                log("RE-EDIT MODE: Will preserve document dimensions: " + originalDocWidth + "x" + originalDocHeight);

                // Try to find stored mxfile for this image (for diagram XML, NOT dimensions)
                var imageHash = hashString(oResult.src.substring(0, 1000));
                var storedData = localStorage.getItem(SODRAW_STORAGE_PREFIX + imageHash);

                if (storedData) {
                    try {
                        var parsed = JSON.parse(storedData);
                        if (parsed.xml) {
                            log("Found stored mxfile for this image");
                            currentXml = parsed.xml;
                            // NOTE: We intentionally do NOT override dimensions from localStorage
                            // The document dimensions (oResult.width/height) are authoritative
                        }
                    } catch (e) {
                        // Old format (just XML string), use it directly
                        log("Found stored mxfile (old format)");
                        currentXml = storedData;
                    }
                } else {
                    log("No stored mxfile found - will start with blank diagram but preserve image size");
                }
            } else {
                log("No existing image selected - NEW diagram mode");
                isReEdit = false;
            }

            // Load draw.io editor
            loadEditor();
        });
    };

    window.Asc.plugin.button = function(id) {
        log("Button clicked: " + id);
        // Cancel button (id=0 in our config) or X button (id=-1)
        if (id === -1 || id === 0) {
            closePlugin();
        }
    };

    // ========== UTILITY FUNCTIONS ==========

    // Simple hash function for image identification
    function hashString(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // ========== DRAW.IO EDITOR ==========

    function loadEditor() {
        log("Loading draw.io editor...");

        if (!currentXml) {
            currentXml = BLANK_DIAGRAM;
        }

        var params = new URLSearchParams({
            embed: "1",
            proto: "json",
            spin: "1",
            ui: "kennedy",
            modified: "unsavedChanges",
            noSaveBtn: "0",
            saveAndExit: "1",
            noExitBtn: "0"
        });

        var url = "https://embed.diagrams.net/?" + params.toString();
        log("Editor URL: " + url);

        drawioFrame.onload = function() {
            log("Iframe loaded, waiting for init event...");
            hideLoading();
        };

        drawioFrame.onerror = function(e) {
            logError("Iframe load error", e);
            showError();
        };

        drawioFrame.src = url;
    }

    function hideLoading() {
        var el = document.getElementById("loading");
        if (el) el.style.display = "none";
        if (drawioFrame) drawioFrame.style.display = "block";
    }

    function showError() {
        var el = document.getElementById("error");
        if (el) el.style.display = "block";
        var ld = document.getElementById("loading");
        if (ld) ld.style.display = "none";
    }

    // ========== POSTMESSAGE HANDLING ==========

    function onDrawioMessage(evt) {
        if (evt.origin !== "https://embed.diagrams.net") {
            return;
        }

        if (typeof evt.data !== "string") {
            return;
        }

        var msg;
        try {
            msg = JSON.parse(evt.data);
        } catch (e) {
            return; // Not JSON
        }

        log("Message received: " + msg.event);

        switch (msg.event) {
            case "init":
                onEditorReady();
                break;
            case "save":
                onSave(msg.xml);
                break;
            case "export":
                onExport(msg);
                break;
            case "exit":
                closePlugin();
                break;
            case "autosave":
                if (msg.xml) currentXml = msg.xml;
                break;
        }
    }

    function sendToDrawio(message) {
        if (!drawioFrame || !drawioFrame.contentWindow) {
            logError("Cannot send - iframe not ready");
            return false;
        }
        var str = JSON.stringify(message);
        log("Sending to draw.io: " + message.action);
        drawioFrame.contentWindow.postMessage(str, "https://embed.diagrams.net");
        return true;
    }

    // ========== EVENT HANDLERS ==========

    function onEditorReady() {
        log("Editor ready, loading diagram...");
        sendToDrawio({
            action: "load",
            xml: currentXml,
            autosave: 1
        });
    }

    function onSave(xml) {
        log("Save triggered, requesting PNG export...");

        if (xml) {
            currentXml = xml;
        }

        waitingForExport = true;

        // Request PNG export with maximum quality
        sendToDrawio({
            action: "export",
            format: "png",
            xml: currentXml,
            scale: EXPORT_SCALE,  // 8x resolution for maximum sharpness
            border: 10,
            transparent: false,
            spin: "Exporting..."
        });
    }

    function onExport(msg) {
        log("Export received, format: " + msg.format);

        if (!waitingForExport) {
            log("Unexpected export, ignoring");
            return;
        }
        waitingForExport = false;

        if (!msg.data) {
            logError("Export failed - no data!");
            alert("Export failed. Please try again.");
            return;
        }

        log("Export data length: " + msg.data.length);

        insertImageIntoDocument(msg.data, msg.format);
    }

    // ========== DOCUMENT INSERTION ==========

    function insertImageIntoDocument(imageData, format) {
        log("Inserting " + format + " into document...");
        log("isReEdit: " + isReEdit);
        log("originalDocWidth: " + originalDocWidth + ", originalDocHeight: " + originalDocHeight);

        // Build proper data URL
        var imageUrl;
        if (imageData.indexOf("data:") === 0) {
            imageUrl = imageData;
        } else {
            imageUrl = "data:image/png;base64," + imageData;
        }

        // Get image dimensions from the data URL
        var img = new Image();
        img.onload = function() {
            log("PNG loaded - actual pixel dimensions: " + img.width + "x" + img.height);

            var width, height;

            // CRITICAL: If re-editing, preserve original document dimensions EXACTLY
            // The PNG is high-resolution (10x scale) but document display size must stay the same
            if (isReEdit && originalDocWidth > 0 && originalDocHeight > 0) {
                // Re-edit: Use the EXACT same dimensions as the original image in document
                // DO NOT divide by scale - these are already the correct display dimensions
                width = originalDocWidth;
                height = originalDocHeight;
                log("RE-EDIT: Preserving EXACT document dimensions: " + width + "x" + height);
            } else {
                // New image: Calculate display size from export
                // The PNG is EXPORT_SCALE times larger than intended display size
                width = Math.round(img.width / EXPORT_SCALE);
                height = Math.round(img.height / EXPORT_SCALE);
                log("NEW: Calculated display dimensions: " + width + "x" + height + " (from " + img.width + "x" + img.height + " PNG at " + EXPORT_SCALE + "x scale)");
            }

            // Store mxfile XML for re-editing (keyed by NEW image hash)
            // Also store dimensions as backup, but oResult.width is authoritative on re-edit
            var imageHash = hashString(imageUrl.substring(0, 1000));
            try {
                var dataToStore = JSON.stringify({
                    xml: currentXml,
                    width: width,
                    height: height
                });
                localStorage.setItem(SODRAW_STORAGE_PREFIX + imageHash, dataToStore);
                log("Stored mxfile with hash: " + imageHash + " (backup dimensions: " + width + "x" + height + ")");
            } catch (e) {
                logError("Failed to store data in localStorage", e);
            }

            // Use PutImageDataToSelection API (same as Photo Editor - most reliable method)
            // width/height here are DISPLAY dimensions, not PNG pixel dimensions
            var oImageData = {
                "src": imageUrl,
                "width": width,
                "height": height
            };

            log("Calling PutImageDataToSelection with display size: " + width + "x" + height);
            window.Asc.plugin.executeMethod("PutImageDataToSelection", [oImageData], function(result) {
                log("PutImageDataToSelection result:", result);
                closePlugin();
            });
        };

        img.onerror = function() {
            logError("Failed to load image for dimension calculation");

            // Fallback: try to use original dimensions if available
            var width = (isReEdit && originalDocWidth > 0) ? originalDocWidth : 600;
            var height = (isReEdit && originalDocHeight > 0) ? originalDocHeight : 400;

            var oImageData = {
                "src": imageUrl,
                "width": width,
                "height": height
            };

            log("Using fallback dimensions: " + width + "x" + height);
            window.Asc.plugin.executeMethod("PutImageDataToSelection", [oImageData], function(result) {
                log("PutImageDataToSelection result:", result);
                closePlugin();
            });
        };

        img.src = imageUrl;
    }

    // ========== UTILITIES ==========

    function closePlugin() {
        log("Closing plugin...");
        window.removeEventListener("message", onDrawioMessage);
        window.Asc.plugin.executeCommand("close", "");
    }

    // Required plugin hooks
    window.Asc.plugin.onExternalMouseUp = function() {};

    window.Asc.plugin.onMethodReturn = function(result) {
        log("Method return:", result);
    };

})(window);
