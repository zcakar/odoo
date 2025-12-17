(function(window, undefined) {
    "use strict";

    /**
     * SODRAW Background Plugin
     * Handles context menu integration for SODRAW diagrams
     *
     * When user right-clicks on a SODRAW image, adds "Edit with SODRAW" option
     */

    var DEBUG = true;
    var SODRAW_MARKER = "sodraw-diagram";
    var CONTEXT_MENU_ID = "sodraw-edit";

    function log(message, data) {
        if (DEBUG) {
            var prefix = "[SODRAW-BG] ";
            if (data !== undefined) {
                console.log(prefix + message, data);
            } else {
                console.log(prefix + message);
            }
        }
    }

    // Initialize background plugin
    window.Asc.plugin.init = function() {
        log("Background plugin initialized");
    };

    // Called when context menu is about to show
    window.Asc.plugin.event_onContextMenuShow = function(options) {
        log("Context menu show event", options);

        // Check if an image is selected
        if (!options || options.type !== "Image") {
            log("Not an image selection, skipping");
            return;
        }

        // Get the selected image data to check if it's a SODRAW diagram
        window.Asc.plugin.executeMethod("GetImageDataFromSelection", [], function(imageData) {
            if (!imageData || !imageData.src) {
                log("No image data available");
                return;
            }

            // Check if this is a SODRAW SVG
            var isSodraw = isSodrawImage(imageData.src);
            log("Is SODRAW image: " + isSodraw);

            if (isSodraw) {
                // Add context menu item
                window.Asc.plugin.executeMethod("AddContextMenuItem", [[{
                    id: CONTEXT_MENU_ID,
                    text: getSodrawMenuText(),
                    separator: true  // Add separator before
                }]], function() {
                    log("Context menu item added");
                });
            }
        });
    };

    // Called when a context menu item is clicked
    window.Asc.plugin.event_onContextMenuClick = function(id) {
        log("Context menu click: " + id);

        if (id === CONTEXT_MENU_ID) {
            log("Opening SODRAW editor...");
            // Open the main SODRAW plugin modal
            window.Asc.plugin.executeMethod("StartAction", ["Plugin", {
                guid: "asc.{ZZZZZ-DRAWIO-SVG-PLUGIN-0001}",
                variation: 0  // Main variation (the modal)
            }]);
        }
    };

    // Check if image src contains SODRAW marker or mxfile data
    function isSodrawImage(src) {
        if (!src) return false;

        // Check for SVG with SODRAW marker or mxfile content
        if (src.indexOf("data:image/svg+xml") !== -1) {
            try {
                var svgContent;
                if (src.indexOf("base64,") !== -1) {
                    svgContent = atob(src.split("base64,")[1]);
                } else {
                    svgContent = decodeURIComponent(src.split(",")[1]);
                }

                // Check for SODRAW marker
                if (svgContent.indexOf(SODRAW_MARKER) !== -1) {
                    return true;
                }

                // Check for mxfile (draw.io content)
                if (svgContent.indexOf("content=") !== -1 &&
                    svgContent.indexOf("mxfile") !== -1) {
                    return true;
                }

                // Check for MXFILE comment
                if (svgContent.indexOf("<!--MXFILE:") !== -1) {
                    return true;
                }

            } catch (e) {
                log("Error checking SVG content: " + e);
            }
        }

        return false;
    }

    // Get localized menu text
    function getSodrawMenuText() {
        var lang = window.Asc.plugin.info ? window.Asc.plugin.info.lang : "en-US";

        if (lang && lang.indexOf("tr") === 0) {
            return "SODRAW ile Düzenle";
        }
        return "Edit with SODRAW";
    }

    // Required plugin hooks
    window.Asc.plugin.button = function(id) {};
    window.Asc.plugin.onExternalMouseUp = function() {};
    window.Asc.plugin.onMethodReturn = function() {};

})(window);
