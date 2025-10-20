document.addEventListener("DOMContentLoaded", () => {
  // Referencias principales
  const canvas = document.getElementById("canvas");
  const addTextBtn = document.getElementById("addTextBtn");
  const deleteBtn = document.getElementById("deleteBtn");
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
  let textZIndex = 100;
  let imageZIndex = 1

  const alignLeftBtn = document.getElementById("alignLeftBtn");
  const alignCenterBtn = document.getElementById("alignCenterBtn");
  const alignRightBtn = document.getElementById("alignRightBtn");

  const bringForwardBtn = document.getElementById("bringForwardBtn");
  const sendBackwardBtn = document.getElementById("sendBackwardBtn");

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

    // Si es un texto editable
    if (selectedElement.classList.contains("text-element")) {
      const content = selectedElement.querySelector(".text-content");

      // Quitar borde al focus
      content.style.outline = "none";

      // Sincronizar controles
      fontFamily.value = content.style.fontFamily || "Montserrat";
      fontSize.value = parseInt(content.style.fontSize) || 48;
      fontSizeValue.textContent = `${fontSize.value}px`;

      const currentLineHeight = parseFloat(content.style.lineHeight) || 1.2;
      document.getElementById("lineHeightValueStepper").value = currentLineHeight.toFixed(1);

      const actualColor = content.dataset.actualColor || rgbToHex(content.style.color) || "#000000";
      textColor.value = actualColor;
      textColorHex.value = actualColor;

      const currentSpacing = parseFloat(content.style.letterSpacing) || 0;
      document.getElementById("letterSpacingValueStepper").value = currentSpacing.toFixed(1);

      selectedImage = null;

    } else if (selectedElement.tagName === "IMG" || selectedElement.classList.contains("canvas-image")) {
      selectedImage = selectedElement;
      currentScale = selectedImage.dataset.scale
        ? parseFloat(selectedImage.dataset.scale)
        : extractScale(selectedElement.style.transform) || 1;
    } else {
      selectedImage = null;
    }

      // Actualizar botones de alineación
      if (selectedElement.classList.contains("text-element")) {
        const content = selectedElement.querySelector(".text-content");
        const align = content.style.textAlign || "center";
        alignLeftBtn.classList.toggle("active", align === "left");
        alignCenterBtn.classList.toggle("active", align === "center");
        alignRightBtn.classList.toggle("active", align === "right");
      }
    }

  // Función para crear un texto
  function createTextElement(x = null, y = null) {
   const div = document.createElement("div");
   div.className = "text-element";
   div.style.position = "absolute";
   if (x !== null && y !== null) {
     div.style.left = `${x}px`;
     div.style.top = `${y}px`;
     div.style.transform = "none";
   } else {
     div.style.left = "50%";
     div.style.top = "50%";
     div.style.transform = "translate(-50%, -50%)";
   }
   div.style.fontSize = "48px";
   div.style.fontFamily = "Montserrat";
   div.style.color = "#000000";
   div.style.zIndex = textZIndex++;
   div.classList.add("canvas-item");

   const content = document.createElement("div");
   content.className = "text-content";
   content.contentEditable = true;
   content.textContent = "Nuevo texto";

   // Crear handle de arrastre
   const dragHandle = document.createElement("div");
   dragHandle.className = "drag-handle";
   dragHandle.innerHTML = `
     <svg viewBox="0 0 24 24">
       <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
       <line x1="12" y1="2" x2="12" y2="22"/>
       <line x1="2" y1="12" x2="22" y2="12"/>
     </svg>
   `;

   div.appendChild(dragHandle);
   div.appendChild(content);
   canvas.appendChild(div);

   selectElement(div);
   actionStack.push({ type: "add", el: div });
   makeDraggable(div);
   makeResizable(div);

   // Permitir edición natural del texto
   content.addEventListener("click", (e) => {
     e.stopPropagation();
     if (!div.classList.contains("selected")) {
       selectElement(div);
     }
   });

   // Evitar que el arrastre se active al hacer clic en el texto para editar
   content.addEventListener("mousedown", (e) => {
     e.stopPropagation();
   });
}

  // Helper: colocar caret al final (solo al crear)
  function placeCaretAtEnd(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Función auxiliar para obtener el valor actual de escala desde transform
  function extractScale(transform) {
    if (!transform) return 1;
    const m = /scale\(([^)]+)\)/.exec(transform);
    return m ? parseFloat(m[1]) : 1;
  }

  function deselect() {
    if (selectedElement) selectedElement.classList.remove("selected");
    selectedElement = null;
    selectedImage = null;
  }

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
      selectedElement.style.color = textColor.value;
      selectedElement.dataset.actualColor = textColor.value;
    }
  });

  textColorHex.addEventListener("input", () => {
    const value = textColorHex.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      textColor.value = value;
      if (selectedElement && selectedElement.tagName === "DIV") {
        selectedElement.style.color = value;
        selectedElement.dataset.actualColor = value;
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

  // === Traer al frente / Enviar atrás ===
  function bringForward(el) {
    if (!el) return;

    // Obtener todos los elementos del canvas que sean canvas-item
    const elements = Array.from(canvas.children).filter(c => c.classList.contains("canvas-item"));

    // Ordenar por z-index actual
    elements.sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0));

    // Encontrar el índice del elemento actual
    const index = elements.indexOf(el);

    // Si no está al final, intercambiar z-index con el siguiente
    if (index < elements.length - 1) {
      const nextEl = elements[index + 1];
      const tempZ = el.style.zIndex;
      el.style.zIndex = nextEl.style.zIndex;
      nextEl.style.zIndex = tempZ;
    }
  }

  function sendBackward(el) {
    if (!el) return;

    const elements = Array.from(canvas.children).filter(c => c.classList.contains("canvas-item"));
    elements.sort((a, b) => (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0));

    const index = elements.indexOf(el);

    // Si no está al inicio, intercambiar z-index con el anterior
    if (index > 0) {
      const prevEl = elements[index - 1];
      const tempZ = el.style.zIndex;
      el.style.zIndex = prevEl.style.zIndex;
      prevEl.style.zIndex = tempZ;
    }
  }

  bringForwardBtn.addEventListener("click", () => bringForward(selectedElement));
  sendBackwardBtn.addEventListener("click", () => sendBackward(selectedElement));

  // === Eliminar elemento ===
  deleteBtn.addEventListener("click", () => {
    if (selectedElement) {
      selectedElement.remove();
      selectedElement = null;
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
           img.classList.add("canvas-item");

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
    // Permitir arrastre SOLO desde el drag-handle o desde imágenes
    const isDragHandle = e.target.classList.contains("drag-handle") ||
                         e.target.closest(".drag-handle");
    const isImage = el.tagName === "IMG" || el.classList.contains("canvas-image");

    // Si es un texto y NO se hizo clic en el drag-handle, ignorar
    if (el.classList.contains("text-element") && !isDragHandle) {
      return;
    }

    // Ignorar clic en el contenido de texto editable
    if (e.target.classList.contains("text-content") ||
        e.target.isContentEditable) {
      return;
    }

    // Ignorar clic en los handles de resize
    if (
      e.target.classList.contains("resize-handle") ||
      e.target.classList.contains("resize-handle-width") ||
      e.target.classList.contains("resize-handle-height")
    ) {
      return;
    }

    e.preventDefault();

    // Seleccionar elemento actual
    selectElement(el);

    // Calcular offset del clic dentro del elemento
    const rect = canvas.getBoundingClientRect();
    offsetX = e.clientX - rect.left - el.offsetLeft;
    offsetY = e.clientY - rect.top - el.offsetTop;

    // Activar arrastre
    isDragging = true;
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
    // Si se hace clic en el contenido editable, no deseleccionar
    if (e.target.classList.contains("text-content") ||
        e.target.isContentEditable) {
      return;
    }

    if (e.target.classList.contains("text-element")) {
        e.stopPropagation();
        selectElement(e.target);
      } else if (e.target === canvas) {
        deselect();
      }
  });

  function  makeResizable(el) {
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
      // calcular font-size proporcional (igual lógica que en otras resizes)
      const scaleFactor = newW / startW;
      const newFontSize = Math.max(6, startFontSize * scaleFactor);

      el.style.width = `${newW}px`;

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

  addTextBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    createTextElement();
  });

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

  // Botón de cuadrícula
  const gridBtn = document.getElementById("gridBtn");
  let gridVisible = false;
  let gridOverlay = null;

  if (gridBtn) {
    gridBtn.addEventListener("click", () => {
      gridVisible = !gridVisible;

      if (gridVisible) {
        // Crear overlay de cuadrícula
        if (!gridOverlay) {
          gridOverlay = document.createElement("div");
          gridOverlay.className = "grid-overlay";
          canvas.appendChild(gridOverlay);
        }
        canvas.classList.add("show-grid");
      } else {
        // Remover overlay
        if (gridOverlay) {
          gridOverlay.remove();
          gridOverlay = null;
        }
        canvas.classList.remove("show-grid");
      }

      gridBtn.classList.toggle("active", gridVisible);
    });
  }

  // FULLSCREEN
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const editorWrapper = document.querySelector(".editor-wrapper");
  const fullscreenIcon = document.getElementById("fullscreenIcon");
  let isFullscreen = false;

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      editorWrapper.requestFullscreen().then(() => {
        editorWrapper.classList.add("fullscreen");
        isFullscreen = true;
        fullscreenIcon.innerHTML = '<path d="M6 6h4V4H4v6h2V6zm12 0v4h2V4h-6v2h4zm0 12h-4v2h6v-6h-2v4zm-12 0v-4H4v6h6v-2H6z"/>';
      });
    } else {
      document.exitFullscreen().then(() => {
        editorWrapper.classList.remove("fullscreen");
        isFullscreen = false;
        fullscreenIcon.innerHTML = '<path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zm6 10v6h-6v-2h4v-4h2zm-10 6H4v-6h2v4h4v2z"/>';
      });
    }
  }

  fullscreenBtn.addEventListener("click", toggleFullscreen);

  // Salir con ESC
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      editorWrapper.classList.remove("fullscreen");
      isFullscreen = false;
      fullscreenIcon.innerHTML = '<path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zm6 10v6h-6v-2h4v-4h2zm-10 6H4v-6h2v4h4v2z"/>';
    }
  });

  // === Crear primera caja de texto por defecto al cargar ===
  createTextElement();
});