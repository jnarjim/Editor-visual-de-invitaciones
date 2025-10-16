document.addEventListener("DOMContentLoaded", () => {
  // Referencias principales
  const canvas = document.getElementById("canvas");
  const addTextBtn = document.getElementById("addTextBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const textContent = document.getElementById("textContent");
  const fontFamily = document.getElementById("fontFamily");
  const fontSize = document.getElementById("fontSize");
  const fontSizeValue = document.getElementById("fontSizeValue");
  const textColor = document.getElementById("textColor");
  const textColorHex = document.getElementById("textColorHex");
  const uploadImage = document.getElementById("uploadImage");

  const actionStack = [];
  let selectedImage = null;
  let currentScale = 1;
  let selectedElement = null;
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let textZIndex = 100; // z-index para textos (siempre encima)
  let imageZIndex = 1; // z-index para imágenes (siempre detrás)

  const alignLeftBtn = document.getElementById("alignLeftBtn");
  const alignCenterBtn = document.getElementById("alignCenterBtn");
  const alignRightBtn = document.getElementById("alignRightBtn");

  // === Funciones utilitarias ===
  function rgbToHex(rgb) {
    if (!rgb) return "#000000";
    const res = rgb.match(/\d+/g);
    if (!res) return rgb;
    return (
      "#" +
      res
        .map((x) => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  function selectElement(el) {
    if (selectedElement) selectedElement.classList.remove("selected");
    selectedElement = el;
    selectedElement.classList.add("selected");

    // Si es texto (DIV)
    if (selectedElement.tagName === "DIV") {
        const currentText = selectedElement.textContent;
        textContent.value = currentText === "Añadir texto" ? "" : currentText;

        fontFamily.value = selectedElement.style.fontFamily || "Montserrat";
        fontSize.value = parseInt(selectedElement.style.fontSize) || 48;
        fontSizeValue.textContent = `${fontSize.value}px`;

        const currentLineHeight = parseFloat(selectedElement.style.lineHeight) || 1.2;
        document.getElementById("lineHeightValueStepper").textContent = currentLineHeight.toFixed(1);

        const actualColor =
          selectedElement.dataset.actualColor ||
          rgbToHex(selectedElement.style.color) ||
          "#000000";
        textColor.value = actualColor;
        textColorHex.value = actualColor;

        const currentSpacing = parseFloat(selectedElement.style.letterSpacing) || 0;
        document.getElementById("letterSpacingValueStepper").textContent = currentSpacing.toFixed(1);

        // No hay imagen seleccionada
        selectedImage = null;

      } else if (selectedElement.tagName === "IMG" || selectedElement.classList.contains("canvas-image")) {
        // Si se selecciona una imagen
        selectedImage = selectedElement;
        // recuperar escala guardada o extraer de transform
        currentScale = selectedImage.dataset.scale ? parseFloat(selectedImage.dataset.scale) : extractScale(selectedImage.style.transform) || 1;
        // si no tiene scale en transform, dejar 1
        textContent.value = "";
      } else {
        // cualquier otro caso
        textContent.value = "";
        selectedImage = null;
    }
    // === Actualizar botones de alineación según el texto seleccionado ===
    if (selectedElement && selectedElement.tagName === "DIV") {
      const align = selectedElement.style.textAlign || "center";
      alignLeftBtn.classList.toggle("active", align === "left");
      alignCenterBtn.classList.toggle("active", align === "center");
      alignRightBtn.classList.toggle("active", align === "right");
    }
  }

  //Función auxiliar para obtener el valor actual de escala desde transform
  function extractScale(transform) {
    if(!transform) return 1;
    const m = /scale\(([^)]+)\)/.exec(transform);
    return m ? parseFloat(m[1]) : 1;
  }

  function deselect() {
    if (selectedElement) selectedElement.classList.remove("selected");
    selectedElement = null;
    selectedImage = null;
  }

  // === Añadir texto ===
  function createTextElement() {
    const textEl = document.createElement("div");
    textEl.classList.add("text-element");

    // Crea el span que contendrá el texto
    const textSpan = document.createElement("span");
    textSpan.className = "text-content";
    textSpan.textContent = "Añadir texto";
    textEl.appendChild(textSpan);

    // Configuración inicial de estilos
    textEl.style.fontFamily = fontFamily.value;
    textEl.style.fontSize = `${fontSize.value}px`;
    textEl.style.color = "#999999"; // color placeholder
    textEl.dataset.actualColor = textColor.value;
    textEl.dataset.isPlaceholder = "true";
    textEl.style.left = "50%";
    textEl.style.top = "50%";
    textEl.style.whiteSpace = "pre-wrap";
    textEl.style.wordBreak = "break-word";
    textEl.style.maxWidth = "90%";
    textEl.style.textAlign = "center";
    textEl.style.zIndex = textZIndex++;

    makeDraggable(textEl);
    makeResizable(textEl);
    canvas.appendChild(textEl);
    selectElement(textEl);

    textEl.dataset.scale = 1;
    textEl.dataset.isCentered = "true";
    actionStack.push({ type: "add", el: textEl });
    textContent.value = "";

    return textEl;
  }

  addTextBtn.addEventListener("click", () => {
    createTextElement();
  });

  // === Actualizar texto en tiempo real SOLO del elemento seleccionado ===
  textContent.addEventListener("input", () => {
      if (selectedElement && selectedElement.classList.contains("text-element")) {
        const inputValue = textContent.value;

        // Busca (o crea) el span interno
        let textSpan = selectedElement.querySelector(".text-content");
        if (!textSpan) {
          textSpan = document.createElement("span");
          textSpan.className = "text-content";
          selectedElement.prepend(textSpan);
        }

        if (inputValue) {
          textSpan.textContent = inputValue;
          selectedElement.style.color = selectedElement.dataset.actualColor || textColor.value;
          selectedElement.dataset.isPlaceholder = "false";
        } else {
          textSpan.textContent = "Añadir texto";
          selectedElement.style.color = "#999999";
          selectedElement.dataset.isPlaceholder = "true";
        }
      }
  });

  // === Cambiar fuente ===
  fontFamily.addEventListener("change", () => {
    if (selectedElement && selectedElement.tagName === "DIV") {
      selectedElement.style.fontFamily = fontFamily.value;
    }
  });

  // === Cambiar tamaño ===
  fontSize.addEventListener("input", () => {
    fontSizeValue.textContent = `${fontSize.value}px`;
    if (selectedElement && selectedElement.tagName === "DIV") {
      selectedElement.style.fontSize = `${fontSize.value}px`;
    }
  });

  // === Cambiar color ===
  textColor.addEventListener("input", () => {
    textColorHex.value = textColor.value;
    if (selectedElement && selectedElement.tagName === "DIV") {
      selectedElement.dataset.actualColor = textColor.value;
      // Solo cambiar el color visible si no es placeholder
      if (selectedElement.dataset.isPlaceholder !== "true") {
        selectedElement.style.color = textColor.value;
      }
    }
  });

  textColorHex.addEventListener("input", () => {
    const value = textColorHex.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      textColor.value = value;
      if (selectedElement && selectedElement.tagName === "DIV") {
        selectedElement.dataset.actualColor = value;
        // Solo cambiar el color visible si no es placeholder
        if (selectedElement.dataset.isPlaceholder !== "true") {
          selectedElement.style.color = value;
        }
      }
    }
  });

  // === Alineación ===
  alignLeftBtn.addEventListener("click", () => {
    if (selectedElement && selectedElement.classList.contains("text-element")) {
      selectedElement.style.textAlign = "left";
    }
  });

  alignCenterBtn.addEventListener("click", () => {
    if (selectedElement && selectedElement.classList.contains("text-element")) {
      selectedElement.style.textAlign = "center";
    }
  });

  alignRightBtn.addEventListener("click", () => {
    if (selectedElement && selectedElement.classList.contains("text-element")) {
      selectedElement.style.textAlign = "right";
    }
  });

  // === Eliminar elemento ===
  deleteBtn.addEventListener("click", () => {
    if (selectedElement) {
      selectedElement.remove();
      selectedElement = null;
      textContent.value = "";
    }
  });

  // === Subir imagen ===
  if (uploadImage) {
    uploadImage.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
           img.classList.add("canvas-image");
           img.style.position = "absolute";
           img.style.cursor = "move";
           img.style.zIndex = imageZIndex++;

           const maxW = canvas.clientWidth * 0.8;
           const maxH = canvas.clientHeight * 0.8;
           let w = img.naturalWidth;
           let h = img.naturalHeight;
           const ratio = Math.min(maxW / w, maxH / h, 1);
           img.width = w * ratio;
           img.height = h * ratio;

           img.style.left = "50%";
           img.style.top = "50%";
           img.style.transform = "translate(-50%, -50%)";

           makeDraggable(img);
           canvas.appendChild(img);
           selectElement(img);

           img.dataset.scale = 1;
           img.dataset.isCentered = "true";
           actionStack.push({ type: "add", el: img });

           img.addEventListener("click", (ev) => {
             ev.stopPropagation();
             selectElement(img);
          });
        };
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    });
  }

  function setupStepper(idInput, min, max, step, callback) {
  const container = document.getElementById(idInput).parentElement;
  const input = document.getElementById(idInput);

  // Asegurar que el input tiene los atributos adecuados
  input.min = min;
  input.max = max;
  input.step = step;

  // Botones + y −
  container.querySelectorAll(".stepper-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      let stepValue = parseFloat(btn.dataset.step);
      let currentValue = parseFloat(input.value);
      let newValue = currentValue + stepValue;

      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;

      input.value = parseFloat(newValue.toFixed(2));
      callback(parseFloat(input.value));
    });
  });

  // Edición manual directa
  input.addEventListener("input", () => {
    let value = parseFloat(input.value);
    if (isNaN(value)) return;
    if (value < min) value = min;
    if (value > max) value = max;
    input.value = parseFloat(value.toFixed(2));
    callback(value);
  });
}

  // Interlineado
  setupStepper("lineHeightValueStepper", 0.5, 3, 0.1, (value) => {
  if (selectedElement && selectedElement.classList.contains("text-element")) {
    selectedElement.style.lineHeight = value;
  }
});

  // Interletrado
  setupStepper("letterSpacingValueStepper", 0, 20, 0.5, (value) => {
  if (selectedElement && selectedElement.classList.contains("text-element")) {
    selectedElement.style.letterSpacing = value + "px";
  }
});

  // === Arrastrar elementos ===
  function makeDraggable(el) {
    el.addEventListener("mousedown", (e) => {
        e.preventDefault();

    if (e.target.classList.contains("resize-handle")) {
      return;
    }

    // Si hace clic en la esquina inferior derecha (zona de resize), no arrastrar
    if (
      e.offsetX > el.clientWidth - 16 &&
      e.offsetY > el.clientHeight - 16
    ) {
      return; // se permite solo redimensionar
    }

    // Seleccionar elemento
    selectElement(el);

    // Si el elemento tiene left/top en % (centrado), convertir a px para evitar salto
    const rect = canvas.getBoundingClientRect();
    const computedLeft = el.offsetLeft;
    const computedTop = el.offsetTop;

    // Recuperar escala actual para no perderla
    const scale = el.dataset.scale
      ? parseFloat(el.dataset.scale)
      : extractScale(el.style.transform) || 1;

    // Asegurar que esté dentro de los límites del canvas
    const elWidth = el.offsetWidth;
    const elHeight = el.offsetHeight;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    const safeLeft = Math.max(0, Math.min(computedLeft, canvasWidth - elWidth));
    const safeTop = Math.max(0, Math.min(computedTop, canvasHeight - elHeight));

    el.style.left = `${safeLeft}px`;
    el.style.top = `${safeTop}px`;
    el.dataset.isCentered = "false";
    el.style.transform = `translate(0, 0) scale(${scale})`;
    el.dataset.scale = scale;

    isDragging = true;
    const rectCanvas = canvas.getBoundingClientRect();
    offsetX = e.clientX - rectCanvas.left - el.offsetLeft;
    offsetY = e.clientY - rectCanvas.top - el.offsetTop;
  });
}

  document.addEventListener("mousemove", (e) => {
    if (!isDragging || !selectedElement) return;
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left - offsetX;
    let y = e.clientY - rect.top - offsetY;

    // Obtener dimensiones del elemento
    const elWidth = selectedElement.offsetWidth;
    const elHeight = selectedElement.offsetHeight;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    // Limitar el movimiento dentro del canvas
    x = Math.max(0, Math.min(x, canvasWidth - elWidth));
    y = Math.max(0, Math.min(y, canvasHeight - elHeight));

    selectedElement.style.left = `${x}px`;
    selectedElement.style.top = `${y}px`;

    const scale = selectedElement.dataset.scale ?  parseFloat(selectedElement.dataset.scale) : 1;
    selectedElement.style.transform = `scale(${scale})`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // === Click en elementos de texto para seleccionar ===
  canvas.addEventListener("click", (e) => {
    if (e.target.classList.contains("text-element")) {
        e.stopPropagation();
        selectElement(e.target);
      } else if (e.target === canvas) {
        deselect();
      }
  });

  function makeResizable(el) {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle");
    el.appendChild(handle);

    let isResizing = false;
    let startX, startY, startWidth, startHeight, startFontSize;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;

      startX = e.clientX;
      startY = e.clientY;

      startWidth = parseFloat(getComputedStyle(el, null).getPropertyValue("width").replace("px", ""));
      startHeight = parseFloat(getComputedStyle(el, null).getPropertyValue("height").replace("px", ""));
      startFontSize = parseFloat(getComputedStyle(el, null).getPropertyValue("font-size").replace("px", ""));

      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResize);
    });

    function resize(e) {
      if (!isResizing) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Escalado proporcional según el movimiento diagonal
      const scaleFactor = Math.max(0.3, 1 + Math.max(dx, dy) / 100);

      const newWidth = Math.max(50, startWidth * scaleFactor);
      const newHeight = Math.max(30, startHeight * scaleFactor);
      const newFontSize = Math.max(6, startFontSize * scaleFactor);

      el.style.width = `${newWidth}px`;
      el.style.height = `${newHeight}px`;
      el.style.fontSize = `${newFontSize}px`;

      // Actualiza los controles si está seleccionado
      if (selectedElement === el) {
        fontSize.value = Math.round(newFontSize);
        fontSizeValue.textContent = `${Math.round(newFontSize)}px`;
      }
    }

    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    }

    // Handle de altura
    const heightHandle = document.createElement("div");
    heightHandle.classList.add("resize-handle-height");
    el.appendChild(heightHandle);

    let isResizingHeight = false;
    let startHeightY, startHeightValue, startFontSizeHeight;

    heightHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingHeight = true;

      startHeightY = e.clientY;
      startHeightValue = el.offsetHeight;
      startFontSizeHeight = parseFloat(getComputedStyle(el).fontSize);

      document.addEventListener("mousemove", resizeHeight);
      document.addEventListener("mouseup", stopResizeHeight);
    });

    function resizeHeight(e) {
      if (!isResizingHeight) return;

      const dy = e.clientY - startHeightY;
      const newHeight = Math.max(30, startHeightValue + dy);
      el.style.height = `${newHeight}px`;

      // Ajustar font-size proporcional a la altura
      const scaleFactor = newHeight / startHeightValue;
      const newFontSize = Math.max(6, startFontSizeHeight * scaleFactor);
      el.style.fontSize = `${newFontSize}px`;

      // Actualizar panel si este elemento está seleccionado
      if (selectedElement === el) {
        fontSize.value = Math.round(newFontSize);
        fontSizeValue.textContent = `${Math.round(newFontSize)}px`;
      }
    }

    function stopResizeHeight() {
      isResizingHeight = false;
      document.removeEventListener("mousemove", resizeHeight);
      document.removeEventListener("mouseup", stopResizeHeight);
    }

    // Handle lateral derecho (solo ancho)
    const handleWidth = document.createElement("div");
    handleWidth.className = "resize-handle-width";
    el.appendChild(handleWidth);

    handleWidth.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      isResizing = true;
      selectElement(el);
      startX = e.clientX;
      startW = el.getBoundingClientRect().width;
      startFontSize = parseFloat(window.getComputedStyle(el).fontSize);

      document.addEventListener("mousemove", onResizeWidth);
      document.addEventListener("mouseup", stopResizeWidth);
    });

    function onResizeWidth(e) {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const newW = Math.max(40, startW + dx);
      el.style.width = `${newW}px`;

      // Si quieres ajustar font-size proporcionalmente:
      const scaleFactor = newW / startW;
      const newFontSize = Math.max(6, startFontSize * scaleFactor);
      el.style.fontSize = `${newFontSize}px`;

      if (selectedElement === el) {
        fontSize.value = Math.round(newFontSize);
        fontSizeValue.textContent = `${Math.round(newFontSize)}px`;
      }
    }

    function stopResizeWidth() {
      isResizing = false;
      document.removeEventListener("mousemove", onResizeWidth);
      document.removeEventListener("mouseup", stopResizeWidth);
    }
}

  // === Descargar la invitación ===
  const downloadBtn = document.getElementById("downloadBtn");

  downloadBtn.addEventListener("click", async () => {
    if (!canvas) return;

  // Asegurar que todas las imágenes estén cargadas completamente
  const imgs = canvas.querySelectorAll("img");
  await Promise.all(
    Array.from(imgs).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve();
          else img.onload = resolve;
        })
    )
  );

  // Capturar canvas con fondo e imágenes
  html2canvas(canvas, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    imageTimeout: 0,
    logging: false,
  }).then((canvasImg) => {
    const link = document.createElement("a");
    link.download = "invitacion.png";
    link.href = canvasImg.toDataURL("image/png");
    link.click();
  });
});

  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const undoBtn = document.getElementById("undoBtn");
  const zoomDisplay = document.getElementById("zoomDisplay");
  const zoomValue = document.getElementById("zoomValue");

  console.log("Verificando botones de zoom...");
  console.log("Canvas:", canvas);
  console.log("Zoom In Button:", zoomInBtn);
  console.log("Zoom Out Button:", zoomOutBtn);

  // Zoom del canvas completo
  let canvasScale = 1;

  function updateZoom() {
    canvas.style.transform = `scale(${canvasScale})`;
    canvas.style.transformOrigin = "center center";
    zoomValue.textContent = `${Math.round(canvasScale * 100)}%`;
  }

  // Zoom In
  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasScale = Math.min(3, canvasScale + 0.2);
      updateZoom();
    });
  }

  // Zoom Out
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvasScale = Math.max(0.5, canvasScale - 0.2);
      updateZoom();
    });
  }

  // Clic en la lupa → reset a 100%
  if (zoomDisplay) {
    zoomDisplay.addEventListener("click", () => {
      canvasScale = 1;
      updateZoom();
    });
  }

  updateZoom();

  // Deshacer (remover último añadido)
  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      const last = actionStack.pop();
      if (!last) return;
      if (last.type === "add" && last.el && last.el.parentNode) {
        // si el elemento eliminado era el seleccionado, limpiar selección
        if (selectedElement === last.el) deselect();
        last.el.parentNode.removeChild(last.el);
      }
    });
  }

  // === Crear primera caja de texto por defecto al cargar ===
  createTextElement();
});