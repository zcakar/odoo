(function(window, undefined) {
    "use strict";

    /**
     * SODRAW Plugin for OnlyOffice
     * Inserts draw.io diagrams as SVG with embedded mxfile XML for re-editing
     *
     * Key features:
     * - SVG format for infinite zoom quality (vector graphics)
     * - mxfile XML embedded in SVG for re-editing
     * - Uses PutImageDataToSelection API for reliable insertion
     * - Context menu integration for "Edit with SODRAW" on right-click
     */

    var DEBUG = true;
    var drawioFrame = null;
    var currentXml = null;
    var waitingForExport = false;

    // SODRAW marker - used to identify SODRAW images
    var SODRAW_MARKER = "sodraw-diagram";

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

                // Try to extract mxfile from SVG data
                var extractedXml = extractMxfileFromSrc(oResult.src);
                if (extractedXml) {
                    log("Extracted mxfile from SVG!");
                    currentXml = extractedXml;
                } else {
                    log("No mxfile found in image, starting fresh");
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

    // ========== MXFILE EXTRACTION FROM SVG ==========

    function extractMxfileFromSrc(src) {
        // Check if it's a data URL
        if (!src || src.indexOf("data:image/svg+xml") === -1) {
            log("Not an SVG data URL");
            return null;
        }

        try {
            var svgContent;

            // Decode the SVG content
            if (src.indexOf("base64,") !== -1) {
                // Base64 encoded
                var base64 = src.split("base64,")[1];
                svgContent = atob(base64);
            } else {
                // URL encoded
                var encoded = src.split(",")[1];
                svgContent = decodeURIComponent(encoded);
            }

            log("SVG content length: " + svgContent.length);

            // Method 1: Look for content attribute (draw.io standard)
            var contentMatch = svgContent.match(/content="([^"]+)"/);
            if (contentMatch) {
                var decoded = decodeURIComponent(contentMatch[1]);
                if (decoded.indexOf("<mxfile") !== -1) {
                    log("Found mxfile in content attribute");
                    return decoded;
                }
            }

            // Method 2: Look for mxfile directly in SVG
            var mxfileMatch = svgContent.match(/<mxfile[^>]*>[\s\S]*?<\/mxfile>/);
            if (mxfileMatch) {
                log("Found mxfile directly in SVG");
                return mxfileMatch[0];
            }

            // Method 3: Check for SODRAW marker and look for embedded data
            if (svgContent.indexOf(SODRAW_MARKER) !== -1) {
                // Look for data in a special element or comment
                var dataMatch = svgContent.match(/<!--MXFILE:([\s\S]*?)-->/);
                if (dataMatch) {
                    try {
                        var decoded = atob(dataMatch[1]);
                        if (decoded.indexOf("<mxfile") !== -1) {
                            log("Found mxfile in SODRAW comment");
                            return decoded;
                        }
                    } catch (e) {
                        logError("Failed to decode SODRAW comment", e);
                    }
                }
            }

            log("No mxfile found in SVG");
            return null;

        } catch (e) {
            logError("Failed to extract mxfile from SVG", e);
            return null;
        }
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
        log("Save triggered, requesting SVG export...");

        if (xml) {
            currentXml = xml;
        }

        waitingForExport = true;

        // Request SVG export with embedded XML (vector graphics + re-editable)
        sendToDrawio({
            action: "export",
            format: "svg",
            xml: currentXml,
            embedXml: true,      // Embed mxfile in SVG for re-editing
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

        insertSvgIntoDocument(msg.data);
    }

    // ========== DOCUMENT INSERTION ==========

    function insertSvgIntoDocument(svgData) {
        log("Inserting SVG into document...");

        // Build proper data URL for SVG
        var imageUrl;
        if (svgData.indexOf("data:") === 0) {
            imageUrl = svgData;
        } else {
            // Raw SVG or base64
            if (svgData.indexOf("<svg") !== -1) {
                // Raw SVG - add SODRAW marker and encode
                var markedSvg = addSodrawMarker(svgData);
                imageUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(markedSvg)));
            } else {
                // Already base64
                imageUrl = "data:image/svg+xml;base64," + svgData;
            }
        }

        log("SVG data URL created, length: " + imageUrl.length);

        // Parse SVG to get dimensions
        var dimensions = getSvgDimensions(svgData);
        var width = dimensions.width || 600;
        var height = dimensions.height || 400;

        // Scale if needed (max 800px width for display)
        if (width > 800) {
            var ratio = 800 / width;
            width = 800;
            height = Math.round(height * ratio);
        }

        log("SVG dimensions: " + width + "x" + height);

        // Use PutImageDataToSelection API
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
    }

    function addSodrawMarker(svgContent) {
        // Add SODRAW marker class to SVG for identification
        if (svgContent.indexOf(SODRAW_MARKER) === -1) {
            // Add class to svg element
            svgContent = svgContent.replace(/<svg/, '<svg class="' + SODRAW_MARKER + '"');

            // Also add mxfile as a comment for backup (in case content attribute is stripped)
            if (currentXml) {
                var encodedXml = btoa(unescape(encodeURIComponent(currentXml)));
                var comment = "<!--MXFILE:" + encodedXml + "-->";
                // Insert after opening svg tag
                var svgTagEnd = svgContent.indexOf(">") + 1;
                svgContent = svgContent.slice(0, svgTagEnd) + comment + svgContent.slice(svgTagEnd);
            }
        }
        return svgContent;
    }

    function getSvgDimensions(svgData) {
        var width = 600, height = 400;

        try {
            // Try to parse width/height from SVG
            var widthMatch = svgData.match(/width="([^"]+)"/);
            var heightMatch = svgData.match(/height="([^"]+)"/);

            if (widthMatch) {
                var w = parseFloat(widthMatch[1]);
                if (!isNaN(w)) width = w;
            }
            if (heightMatch) {
                var h = parseFloat(heightMatch[1]);
                if (!isNaN(h)) height = h;
            }

            // Also check viewBox
            var viewBoxMatch = svgData.match(/viewBox="([^"]+)"/);
            if (viewBoxMatch) {
                var parts = viewBoxMatch[1].split(/\s+/);
                if (parts.length >= 4) {
                    var vbWidth = parseFloat(parts[2]);
                    var vbHeight = parseFloat(parts[3]);
                    if (!isNaN(vbWidth) && !isNaN(vbHeight)) {
                        // Use viewBox dimensions if width/height weren't explicit
                        if (!widthMatch) width = vbWidth;
                        if (!heightMatch) height = vbHeight;
                    }
                }
            }
        } catch (e) {
            logError("Failed to parse SVG dimensions", e);
        }

        return { width: width, height: height };
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
