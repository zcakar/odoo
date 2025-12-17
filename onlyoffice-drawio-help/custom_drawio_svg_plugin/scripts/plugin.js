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
        log("Save triggered, requesting SVG export...");

        if (xml) {
            currentXml = xml;
        }

        waitingForExport = true;

        // Request SVG with embedded XML (mxfile)
        sendToDrawio({
            action: "export",
            format: "svg",
            xml: currentXml,
            embedXml: true,
            embedImages: true,
            scale: 1,
            border: 10,
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

        insertSvgIntoDocument(msg.data);
    }

    // ========== DOCUMENT INSERTION ==========

    function insertSvgIntoDocument(svgData) {
        log("Inserting SVG into document...");

        // msg.data from draw.io is already base64 when format is svg with embedXml
        // It should be just the base64 string, not a data URL
        var imageUrl;

        if (svgData.indexOf("data:") === 0) {
            // Already a data URL
            imageUrl = svgData;
            log("Using data URL as-is");
        } else {
            // Raw base64, need to add data URL prefix
            imageUrl = "data:image/svg+xml;base64," + svgData;
            log("Added data URL prefix to base64");
        }

        log("Final image URL length: " + imageUrl.length);

        // Store data in Asc.scope for use in callCommand
        Asc.scope.imageUrl = imageUrl;
        Asc.scope.isEditingExisting = isEditingExisting;

        // Estimate dimensions (default to reasonable size)
        // 180mm x 120mm in EMUs (1 inch = 914400 EMUs, 1 mm = 36000 EMUs)
        Asc.scope.width = 180 * 36000;  // ~180mm
        Asc.scope.height = 120 * 36000; // ~120mm

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

        window.Asc.plugin.callCommand(function() {
            var oDocument = Api.GetDocument();
            var oImage = Api.CreateImage(Asc.scope.imageUrl, Asc.scope.width, Asc.scope.height);

            // Check if there's a selected image to replace
            var aSelectedImgs = oDocument.GetSelectedDrawings ? oDocument.GetSelectedDrawings() : [];
            var oSourceImg = aSelectedImgs[0] ? aSelectedImgs[0] : null;

            if (oSourceImg && Asc.scope.isEditingExisting) {
                // Replace the selected image
                oDocument.ReplaceDrawing(oSourceImg, oImage, true);
            } else {
                // Insert new image
                var oParagraph = Api.CreateParagraph();
                oParagraph.AddDrawing(oImage);
                oDocument.InsertContent([oParagraph], true);
            }
        }, true, false, function(result) {
            log("callCommand completed, result:", result);
            closePlugin();
        });
    }

    function insertIntoCell() {
        log("Inserting into Spreadsheet...");

        window.Asc.plugin.callCommand(function() {
            var oWorksheet = Api.GetActiveSheet();
            oWorksheet.AddImage(Asc.scope.imageUrl, Asc.scope.width, Asc.scope.height);
        }, true, false, function(result) {
            log("callCommand completed, result:", result);
            closePlugin();
        });
    }

    function insertIntoSlide() {
        log("Inserting into Presentation...");

        window.Asc.plugin.callCommand(function() {
            var oPresentation = Api.GetPresentation();
            var oSlide = oPresentation.GetCurrentSlide();
            var oImage = Api.CreateImage(Asc.scope.imageUrl, Asc.scope.width, Asc.scope.height);
            oSlide.AddObject(oImage);
        }, true, false, function(result) {
            log("callCommand completed, result:", result);
            closePlugin();
        });
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
