(function(window, undefined) {
    "use strict";

    /**
     * SODRAW Plugin for OnlyOffice
     * Inserts draw.io diagrams as high-quality PNG with mxfile stored for re-editing
     *
     * Key features:
     * - Uses PutImageDataToSelection API (like Photo Editor) for reliable insertion
     * - PNG format with 4x scale for maximum quality
     * - Stores mxfile XML in localStorage for re-editing capability
     * - To re-edit: select the image, then click SODRAW plugin
     */

    var DEBUG = true;
    var drawioFrame = null;
    var currentXml = null;
    var waitingForExport = false;

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

            if (oResult && oResult.src) {
                log("Found existing image: " + oResult.width + "x" + oResult.height);

                // Try to find stored mxfile for this image
                var imageHash = hashString(oResult.src.substring(0, 1000));
                var storedXml = localStorage.getItem(SODRAW_STORAGE_PREFIX + imageHash);

                if (storedXml) {
                    log("Found stored mxfile for this image");
                    currentXml = storedXml;
                } else {
                    log("No stored mxfile found, starting fresh");
                }
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
            scale: 4,        // 4x resolution for maximum sharpness
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
            var width = img.width;
            var height = img.height;

            // Scale down if too large (max 800px width for display)
            if (width > 800) {
                var ratio = 800 / width;
                width = 800;
                height = Math.round(height * ratio);
            }

            log("Image dimensions: " + width + "x" + height);

            // Store mxfile XML for re-editing (keyed by image hash)
            var imageHash = hashString(imageUrl.substring(0, 1000));
            try {
                localStorage.setItem(SODRAW_STORAGE_PREFIX + imageHash, currentXml);
                log("Stored mxfile with hash: " + imageHash);
            } catch (e) {
                logError("Failed to store mxfile in localStorage", e);
            }

            // Use PutImageDataToSelection API (same as Photo Editor - most reliable method)
            var oImageData = {
                "src": imageUrl,
                "width": width,
                "height": height
            };

            log("Calling PutImageDataToSelection...");
            window.Asc.plugin.executeMethod("PutImageDataToSelection", [oImageData], function(result) {
                log("PutImageDataToSelection result:", result);
                closePlugin();
            });
        };

        img.onerror = function() {
            logError("Failed to load image for dimension calculation");
            // Fallback: use default dimensions
            var oImageData = {
                "src": imageUrl,
                "width": 600,
                "height": 400
            };

            log("Using fallback dimensions, calling PutImageDataToSelection...");
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
