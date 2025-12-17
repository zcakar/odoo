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

    // Use popup to avoid iframe/CSP issues
    editorWindow = window.open(`${baseUrl}?${params.toString()}`, "drawio-editor", "width=1200,height=800");
    if (!editorWindow || editorWindow.closed) {
      alert("Please allow pop-ups to open draw.io editor.");
    }
    window.addEventListener("message", handleDrawioMessage);

    // Close plugin container to avoid blank modal behind popup
    if (window.Asc && window.Asc.plugin && window.Asc.plugin.executeCommand) {
      window.Asc.plugin.executeCommand("close", "");
    }
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
  // Disabled selection hook for now; editing flow can be initiated from toolbar button
  window.Asc.plugin.onExternalMouseUp = function () {};

  function closeEditor() {
    if (editorWindow && !editorWindow.closed) {
      editorWindow.close();
    }
    editorWindow = null;
    window.removeEventListener("message", handleDrawioMessage);
  }
})(window, undefined);
