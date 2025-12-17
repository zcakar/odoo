(function(window, undefined) {
    "use strict";

    /**
     * SODRAW Plugin for OnlyOffice
     * Inserts draw.io diagrams as SVG with embedded mxfile for re-editing
     */

    var DEBUG = true;
    var drawioFrame = null;
    var currentXml = null;
    var waitingForExport = false;
    var isEditingExisting = false;

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
        log("Init data:", data);

        drawioFrame = document.getElementById("drawio-frame");
        if (!drawioFrame) {
            logError("Cannot find iframe element!");
            return;
        }

        // Listen for messages from draw.io
        window.addEventListener("message", onDrawioMessage, false);

        // Check if we have existing diagram data (re-edit scenario)
        if (data && typeof data === "string" && data.trim().length > 0) {
            log("Received existing data for re-edit");
            // Try to extract mxfile from SVG or use as-is if it's XML
            var extractedXml = extractMxfileFromData(data);
            if (extractedXml) {
                currentXml = extractedXml;
                isEditingExisting = true;
                log("Extracted mxfile for editing");
            }
        }

        // Load draw.io editor
        loadEditor();
    };

    window.Asc.plugin.button = function(id) {
        log("Button clicked: " + id);
        // Cancel button or X button
        if (id === -1 || id === 0) {
            closePlugin();
        }
    };

    // ========== MXFILE EXTRACTION ==========

    function extractMxfileFromData(data) {
        // If it's already an mxfile XML
        if (data.indexOf("<mxfile") !== -1) {
            log("Data is already mxfile XML");
            return data;
        }

        // If it's a data URL (base64 SVG)
        if (data.indexOf("data:image/svg+xml;base64,") === 0) {
            try {
                var base64 = data.replace("data:image/svg+xml;base64,", "");
                var svgContent = atob(base64);
                return extractMxfileFromSvg(svgContent);
            } catch (e) {
                logError("Failed to decode base64 SVG", e);
            }
        }

        // If it's raw SVG
        if (data.indexOf("<svg") !== -1) {
            return extractMxfileFromSvg(data);
        }

        return null;
    }

    function extractMxfileFromSvg(svgContent) {
        // draw.io embeds mxfile in SVG as "content" attribute or in a special comment/element
        // Method 1: Look for content attribute with URL-encoded mxfile
        var contentMatch = svgContent.match(/content="([^"]+)"/);
        if (contentMatch) {
            try {
                var decoded = decodeURIComponent(contentMatch[1]);
                if (decoded.indexOf("<mxfile") !== -1) {
                    log("Extracted mxfile from content attribute");
                    return decoded;
                }
            } catch (e) {
                logError("Failed to decode content attribute", e);
            }
        }

        // Method 2: Look for mxfile in a CDATA or comment section
        var mxfileMatch = svgContent.match(/<mxfile[^>]*>[\s\S]*?<\/mxfile>/);
        if (mxfileMatch) {
            log("Extracted mxfile from SVG body");
            return mxfileMatch[0];
        }

        // Method 3: Check for data in xlink:href or similar
        var xlinkMatch = svgContent.match(/xlink:href="data:application\/vnd\.mxfile\+xml;base64,([^"]+)"/);
        if (xlinkMatch) {
            try {
                var decoded = atob(xlinkMatch[1]);
                if (decoded.indexOf("<mxfile") !== -1) {
                    log("Extracted mxfile from xlink:href");
                    return decoded;
                }
            } catch (e) {
                logError("Failed to decode xlink data", e);
            }
        }

        log("No mxfile found in SVG");
        return null;
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

        log("Message received: " + msg.event, msg);

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
        log("Sending to draw.io: " + message.action, message);
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

        // Request PNG export (more reliable than SVG in OnlyOffice)
        sendToDrawio({
            action: "export",
            format: "png",
            xml: currentXml,
            scale: 2,        // Higher resolution
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
        log("Export data preview: " + msg.data.substring(0, 100));

        insertImageIntoDocument(msg.data, msg.format);
    }

    // ========== DOCUMENT INSERTION ==========

    function insertImageIntoDocument(imageData, format) {
        log("Inserting " + format + " into document...");

        // Build proper data URL based on format
        var imageUrl;
        var mimeType = format === "png" ? "image/png" : "image/svg+xml";

        if (imageData.indexOf("data:") === 0) {
            // Already a data URL
            imageUrl = imageData;
            log("Using data URL as-is");
        } else {
            // Raw base64, need to add data URL prefix
            imageUrl = "data:" + mimeType + ";base64," + imageData;
            log("Added data URL prefix: " + mimeType);
        }

        log("Final image URL length: " + imageUrl.length);
        log("Image URL prefix: " + imageUrl.substring(0, 50));

        // Store data in Asc.scope for use in callCommand (same names as Photo Editor)
        Asc.scope.dataURL = imageUrl;

        // Calculate dimensions in EMUs (same formula as Photo Editor)
        // Default: 600x400 pixels at 96 DPI
        var pixelWidth = 600;
        var pixelHeight = 400;
        Asc.scope.nEmuWidth = ((pixelWidth / 96) * 914400 + 0.5) >> 0;
        Asc.scope.nEmuHeight = ((pixelHeight / 96) * 914400 + 0.5) >> 0;

        log("EMU dimensions: " + Asc.scope.nEmuWidth + " x " + Asc.scope.nEmuHeight);

        // Use the correct editor type
        var editorType = window.Asc.plugin.info.editorType;
        log("Editor type: " + editorType);

        switch (editorType) {
            case "word":
                insertIntoWord();
                break;
            case "cell":
                insertIntoCell();
                break;
            case "slide":
                insertIntoSlide();
                break;
            default:
                log("Unknown editor type, using word method");
                insertIntoWord();
        }
    }

    function insertIntoWord() {
        log("Inserting into Word document...");

        // Use exact same pattern as Photo Editor plugin
        window.Asc.plugin.callCommand(function() {
            var oDocument = Api.GetDocument();
            var oParagraph, arrInsertResult = [], oImage;

            // Create image with data URL
            oImage = Api.CreateImage(Asc.scope.dataURL, Asc.scope.nEmuWidth, Asc.scope.nEmuHeight);

            // Check if there's a selected image to replace
            var aSelectedImgs = oDocument.GetSelectedDrawings ? oDocument.GetSelectedDrawings() : [];
            var oSourceImg = aSelectedImgs[0] ? aSelectedImgs[0] : null;

            if (oSourceImg) {
                // Replace the selected image
                oDocument.ReplaceDrawing(oSourceImg, oImage, true);
            } else {
                // Insert new image (same as Photo Editor)
                oParagraph = Api.CreateParagraph();
                arrInsertResult.push(oParagraph);
                oParagraph.AddDrawing(oImage);
                oDocument.InsertContent(arrInsertResult);
            }
        }, true);

        // Close plugin after command (Photo Editor style)
        setTimeout(function() {
            closePlugin();
        }, 500);
    }

    function insertIntoCell() {
        log("Inserting into Spreadsheet...");

        window.Asc.plugin.callCommand(function() {
            var oWorksheet = Api.GetActiveSheet();
            oWorksheet.ReplaceCurrentImage(Asc.scope.dataURL, Asc.scope.nEmuWidth, Asc.scope.nEmuHeight);
        }, true);

        setTimeout(function() {
            closePlugin();
        }, 500);
    }

    function insertIntoSlide() {
        log("Inserting into Presentation...");

        window.Asc.plugin.callCommand(function() {
            var oPresentation = Api.GetPresentation();
            oPresentation.ReplaceCurrentImage(Asc.scope.dataURL, Asc.scope.nEmuWidth, Asc.scope.nEmuHeight);
        }, true);

        setTimeout(function() {
            closePlugin();
        }, 500);
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
