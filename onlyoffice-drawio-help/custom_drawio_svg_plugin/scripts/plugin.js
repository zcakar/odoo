(function (window, undefined) {
  // Global editor window reference
  let editorWindow = null;

  // Config flags
  const USE_SVG = true;
  const GENERATE_PNG_FALLBACK = false;

  window.Asc.plugin.init = function () {
    console.log("Draw.io SVG plugin initialized");
  };

  // Primary button
  window.Asc.plugin.button = function (id) {
    if (id === 0) {
      openDrawioEditor();
    }
  };

  // Open draw.io (embed.diagrams.net) with optional XML payload
  function openDrawioEditor(existingXml) {
    const baseUrl = "https://embed.diagrams.net/";
    const params = new URLSearchParams({
      embed: "1",
      spin: "1",
      proto: "json",
      ui: "kennedy",
    });

    if (existingXml) {
      params.append("xml", existingXml);
    }

    // Create iframe in modal instead of popup
    ensureIframe();
    const iframe = document.getElementById("drawio-iframe");
    iframe.src = `${baseUrl}?${params.toString()}`;
    editorWindow = iframe.contentWindow;
    window.addEventListener("message", handleDrawioMessage);
  }

  // Listen for draw.io postMessages
  function handleDrawioMessage(event) {
    if (!event.data || typeof event.data !== "string") return;
    try {
      const msg = JSON.parse(event.data);
      switch (msg.event) {
        case "init":
          // Once editor loads, request export on save
          break;
        case "save":
          requestDiagramExport(USE_SVG ? "svg" : "png", USE_SVG);
          break;
        case "export":
          if (USE_SVG) {
            handleSvgExport(msg.data, msg.xml);
          } else {
            handlePngExport(msg.data);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Failed to parse draw.io message", err);
    }
  }

  // Ask draw.io to export current diagram
  function requestDiagramExport(format, embedXml) {
    if (!editorWindow) return;
    const payload = {
      action: "export",
      format: format,
      embedXml: embedXml,
      embedImages: true,
      base64: true,
      scale: 1,
      border: 0,
    };
    if (format === "png") {
      payload.quality = 90;
    }
    editorWindow.postMessage(JSON.stringify(payload), "*");
  }

  // Insert SVG with embedded mxfile
  function handleSvgExport(svgBase64, mxfileXml) {
    console.log("Processing SVG export with embedded mxfile");
    let svgString = atob(svgBase64);

    if (svgString.indexOf("<metadata") === -1 || svgString.indexOf("mxfile") === -1) {
      svgString = embedMxfileInSvg(svgString, mxfileXml);
      svgBase64 = btoa(svgString);
    }

    window.Asc.plugin.callCommand(
      function () {
        const doc = Api.GetDocument();
        const paragraph = doc.GetElement(0);
        const image = Api.CreateImage(svgBase64, null, null, true);
        if (image.SetImageType) {
          image.SetImageType("image/svg+xml");
        }
        if (image.SetTag && mxfileXml) {
          image.SetTag(mxfileXml);
        }
        paragraph.AddDrawing(image);
      },
      true,
      true
    );

    if (!GENERATE_PNG_FALLBACK) {
      closeEditor();
    }
  }

  // Legacy PNG insertion (kept for completeness)
  function handlePngExport(pngBase64) {
    window.Asc.plugin.callCommand(
      function () {
        const doc = Api.GetDocument();
        const paragraph = doc.GetElement(0);
        const image = Api.CreateImage(pngBase64, null, null, true);
        paragraph.AddDrawing(image);
      },
      true,
      true
    );
    closeEditor();
  }

  // Embed mxfile block into SVG metadata
  function embedMxfileInSvg(svgString, mxfileXml) {
    const closingTagIndex = svgString.lastIndexOf("</svg>");
    if (closingTagIndex === -1) return svgString;
    const metadata =
      "\n  <metadata>\n" +
      '    <mxfile modified="' +
      new Date().toISOString() +
      '">\n' +
      "      " +
      mxfileXml +
      "\n" +
      "    </mxfile>\n" +
      "  </metadata>\n";
    return svgString.slice(0, closingTagIndex) + metadata + svgString.slice(closingTagIndex);
  }

  // Extract mxfile from selected SVG for editing
  function extractMxfileFromSvg(svgUrl, callback) {
    fetch(svgUrl)
      .then((res) => res.text())
      .then((svgContent) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        const node = doc.querySelector("metadata mxfile");
        if (node) {
          const data = node.textContent || node.innerHTML;
          callback(data);
        } else {
          callback(null);
        }
      })
      .catch((err) => {
        console.error("extractMxfileFromSvg error", err);
        callback(null);
      });
  }

  // Hook selection: on selecting an image, allow edit via mxfile
  window.Asc.plugin.onExternalMouseUp = function () {
    window.Asc.plugin.callCommand(
      function () {
        const doc = Api.GetDocument();
        return doc.GetSelectedObject();
      },
      false,
      false,
      function (selectedObject) {
        if (!selectedObject || selectedObject.GetClassType() !== "drawing") return;
        const imageType = selectedObject.GetImageType ? selectedObject.GetImageType() : "";
        const imageUrl = selectedObject.GetImageUrl ? selectedObject.GetImageUrl() : "";

        if (imageType === "image/svg+xml" || (imageUrl && imageUrl.indexOf(".svg") > -1)) {
          extractMxfileFromSvg(imageUrl, function (mxfile) {
            if (mxfile) {
              openDrawioEditor(mxfile);
            } else {
              const fallback = selectedObject.GetTag ? selectedObject.GetTag() : null;
              if (fallback) {
                openDrawioEditor(fallback);
              }
            }
          });
        } else if (imageType === "image/png" || (imageUrl && imageUrl.indexOf(".png") > -1)) {
          const fallback = selectedObject.GetTag ? selectedObject.GetTag() : null;
          if (fallback) {
            openDrawioEditor(fallback);
          }
        }
      }
    );
  };

  function closeEditor() {
    editorWindow = null;
    window.removeEventListener("message", handleDrawioMessage);
    const iframe = document.getElementById("drawio-iframe");
    if (iframe) {
      iframe.src = "about:blank";
    }
  }

  // Create iframe once to render draw.io inside modal content
  function ensureIframe() {
    if (document.getElementById("drawio-iframe")) return;
    const iframe = document.createElement("iframe");
    iframe.id = "drawio-iframe";
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
  }
})(window, undefined);
