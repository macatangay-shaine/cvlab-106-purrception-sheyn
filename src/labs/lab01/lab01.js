"use strict";

window.Module = window.Module || {};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const elements = {
  engineStatus: $("#engineStatus"),
  fileInput: $("#fileInput"),
  dropSurface: $("#dropSurface"),
  canvasPlaceholder: $("#canvasPlaceholder"),
  canvasStack: $("#canvasStack"),
  workCanvas: $("#workCanvas"),
  overlayCanvas: $("#overlayCanvas"),
  canvasStage: $("#canvasStage"),
  canvasHint: $("#canvasHint"),
  currentOperation: $("#currentOperation"),
  canvasDimensions: $("#canvasDimensions"),
  sourceDimensions: $("#sourceDimensions"),
  shapeValue: $("#shapeValue"),
  resolutionValue: $("#resolutionValue"),
  channelCount: $("#channelCount"),
  resizeWidth: $("#resizeWidth"),
  resizeHeight: $("#resizeHeight"),
  ratioLock: $("#ratioLock"),
  resizeButton: $("#resizeButton"),
  grayscaleButton: $("#grayscaleButton"),
  rotateButton: $("#rotateButton"),
  applyCropButton: $("#applyCropButton"),
  undoButton: $("#undoButton"),
  resetButton: $("#resetButton"),
  pixelCoordinate: $("#pixelCoordinate"),
  pixelSwatch: $("#pixelSwatch"),
  rgbaValue: $("#rgbaValue"),
  bgrValue: $("#bgrValue"),
  pixelGrid: $("#pixelGrid"),
  pixelEditor: $("#pixelEditor"),
  colorPicker: $("#colorPicker"),
  redValue: $("#redValue"),
  greenValue: $("#greenValue"),
  blueValue: $("#blueValue"),
  applyPixelButton: $("#applyPixelButton"),
  historyList: $("#historyList"),
  progressCount: $("#progressCount"),
  progressBar: $("#progressBar"),
  printButton: $("#printButton"),
  downloadStripButton: $("#downloadStripButton"),
  visitorAnswerButton: $("#visitorAnswerButton"),
  restoreAnswersButton: $("#restoreAnswersButton"),
  copyCodeButton: $("#copyCodeButton"),
  pythonCode: $("#pythonCode"),
  toast: $("#toast")
};

const state = {
  ready: false,
  current: null,
  original: null,
  sourceWidth: 0,
  sourceHeight: 0,
  mode: "inspect",
  selectedPixel: null,
  crop: null,
  draggingCrop: false,
  cropStart: null,
  history: [],
  operationLabels: [],
  evidence: new Set(),
  resizeSync: false,
  selfTestStarted: false
};

let toastTimer = 0;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
}

function startVisitorAnswers() {
  $$('[data-owner-field]').forEach((field) => { field.value = ""; });
  $('[data-owner-field]')?.focus();
  showToast("Answer fields cleared. You can now write your own responses.");
}

function restoreOwnerAnswers() {
  $$('[data-owner-field]').forEach((field) => { field.value = field.defaultValue; });
  showToast("Shaine’s completed answers were restored.");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function channelName(count) {
  return count === 1 ? "1 · grayscale" : count === 3 ? "3 · BGR/RGB" : `${count} · RGBA`;
}

function createPixelGrid() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 49; index += 1) fragment.append(document.createElement("i"));
  elements.pixelGrid.replaceChildren(fragment);
}

function setEngineState(kind, message) {
  const holder = elements.engineStatus.closest(".lab-masthead__meta");
  holder?.classList.remove("is-ready", "has-error");
  if (kind) holder?.classList.add(kind);
  elements.engineStatus.textContent = message;
}

function refreshControls() {
  const hasImage = Boolean(state.current);
  $$('[data-needs-image]').forEach((item) => { item.disabled = !hasImage; });
  $$('[data-needs-image-fieldset]').forEach((item) => { item.disabled = !hasImage; });
  elements.undoButton.disabled = !state.history.length;
  elements.resetButton.disabled = !hasImage;
  elements.applyCropButton.disabled = !hasImage || !state.crop || state.crop.w < 2 || state.crop.h < 2;
  elements.pixelEditor.disabled = !hasImage;
  elements.applyPixelButton.disabled = !hasImage || !state.selectedPixel;
  elements.downloadStripButton.disabled = state.evidence.size < 6;
}

function renderHistory() {
  const recent = state.operationLabels.slice(-5);
  elements.historyList.replaceChildren(...recent.map((label) => {
    const item = document.createElement("li");
    item.textContent = label;
    return item;
  }));
}

function renderOverlay() {
  const canvas = elements.overlayCanvas;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!state.current) return;

  if (state.crop) {
    const { x, y, w, h } = state.crop;
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.46)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.clearRect(x, y, w, h);
    context.strokeStyle = "#ffffff";
    context.lineWidth = Math.max(1, canvas.width / 500);
    context.setLineDash([Math.max(4, canvas.width / 100), Math.max(3, canvas.width / 150)]);
    context.strokeRect(x, y, w, h);
    context.fillStyle = "#dc80aa";
    context.font = `700 ${Math.max(11, canvas.width / 55)}px Inter`;
    context.fillText(`${Math.round(w)} × ${Math.round(h)}`, x + 7, Math.max(16, y - 7));
    context.restore();
  } else if (state.selectedPixel && state.mode === "inspect") {
    const { x, y } = state.selectedPixel;
    const size = Math.max(1, elements.overlayCanvas.width / 260);
    context.strokeStyle = "#ffffff";
    context.lineWidth = size;
    context.strokeRect(x - 3, y - 3, 7, 7);
    context.strokeStyle = "#dc80aa";
    context.strokeRect(x - 5, y - 5, 11, 11);
  }
}

function updateProperties() {
  if (!state.current) return;
  const { cols: width, rows: height } = state.current;
  const channels = state.current.channels();
  elements.canvasDimensions.textContent = `${width} × ${height} px`;
  elements.shapeValue.textContent = `(${height}, ${width}${channels > 1 ? `, ${channels}` : ""})`;
  elements.resolutionValue.textContent = `${(width * height).toLocaleString()} pixels`;
  elements.channelCount.textContent = channelName(channels);
  elements.sourceDimensions.textContent = `${state.sourceWidth} × ${state.sourceHeight} px`;
  state.resizeSync = true;
  elements.resizeWidth.value = width;
  elements.resizeHeight.value = height;
  state.resizeSync = false;
}

function render(label = "Ready to inspect") {
  if (!state.current) return;
  cv.imshow(elements.workCanvas, state.current);
  elements.overlayCanvas.width = state.current.cols;
  elements.overlayCanvas.height = state.current.rows;
  elements.canvasPlaceholder.hidden = true;
  elements.canvasStack.hidden = false;
  elements.currentOperation.textContent = label;
  updateProperties();
  renderOverlay();
  renderHistory();
  refreshControls();
}

function getPixelRGBA(mat, x, y) {
  const channels = mat.channels();
  const data = mat.ucharPtr(y, x);
  if (channels === 1) return [data[0], data[0], data[0], 255];
  if (channels === 3) return [data[0], data[1], data[2], 255];
  return [data[0], data[1], data[2], data[3]];
}

function inspectPixel(x, y) {
  if (!state.current) return;
  x = clamp(Math.floor(x), 0, state.current.cols - 1);
  y = clamp(Math.floor(y), 0, state.current.rows - 1);
  state.selectedPixel = { x, y };
  const [r, g, b, a] = getPixelRGBA(state.current, x, y);
  elements.pixelCoordinate.textContent = `x ${x} / y ${y}`;
  elements.rgbaValue.textContent = `${r}, ${g}, ${b}, ${a}`;
  elements.bgrValue.textContent = `${b}, ${g}, ${r}`;
  elements.pixelSwatch.style.backgroundColor = `rgb(${r} ${g} ${b})`;
  elements.redValue.value = r;
  elements.greenValue.value = g;
  elements.blueValue.value = b;
  elements.colorPicker.value = `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;

  const cells = [...elements.pixelGrid.children];
  let index = 0;
  for (let offsetY = -3; offsetY <= 3; offsetY += 1) {
    for (let offsetX = -3; offsetX <= 3; offsetX += 1) {
      const sampleX = clamp(x + offsetX, 0, state.current.cols - 1);
      const sampleY = clamp(y + offsetY, 0, state.current.rows - 1);
      const [sr, sg, sb] = getPixelRGBA(state.current, sampleX, sampleY);
      cells[index].style.backgroundColor = `rgb(${sr} ${sg} ${sb})`;
      cells[index].title = `(${sampleX}, ${sampleY}) · ${sr}, ${sg}, ${sb}`;
      index += 1;
    }
  }
  elements.canvasHint.textContent = `Selected pixel (${x}, ${y}). Browser RGBA maps to Python BGR as ${b}, ${g}, ${r}.`;
  renderOverlay();
  refreshControls();
}

function toImageCoordinates(event) {
  const bounds = elements.overlayCanvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - bounds.left) * (elements.overlayCanvas.width / bounds.width), 0, elements.overlayCanvas.width - 1),
    y: clamp((event.clientY - bounds.top) * (elements.overlayCanvas.height / bounds.height), 0, elements.overlayCanvas.height - 1)
  };
}

function pushHistory(label) {
  if (!state.current) return;
  state.history.push({ mat: state.current.clone(), labels: [...state.operationLabels] });
  if (state.history.length > 10) state.history.shift().mat.delete();
  state.operationLabels.push(label);
}

function replaceCurrent(next, label) {
  const previous = state.current;
  state.current = next;
  previous?.delete();
  state.selectedPixel = null;
  state.crop = null;
  render(label);
}

function canvasSnapshot() {
  return elements.workCanvas.toDataURL("image/png");
}

function captureEvidence(kind, detail) {
  const card = $(`[data-evidence-card="${kind}"]`);
  if (!card || !state.current) return;
  const image = $("img", card);
  const caption = $("small", card);
  image.src = canvasSnapshot();
  card.classList.add("is-captured");
  caption.textContent = detail;
  state.evidence.add(kind);
  elements.progressCount.textContent = state.evidence.size;
  elements.progressBar.style.width = `${(state.evidence.size / 6) * 100}%`;
  refreshControls();
}

function drawImageContained(context, image, x, y, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

async function downloadHorizontalEvidenceStrip() {
  const cards = $$('[data-evidence-card]');
  const images = cards.map((card) => $("img", card));
  if (state.evidence.size < 6 || images.some((image) => !image.src || !image.complete)) {
    showToast("Complete all six evidence shots before downloading the horizontal image set.");
    return;
  }

  try {
    await Promise.all(images.map((image) => image.decode()));
  } catch {
    showToast("The evidence images are still loading. Please try the download again.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 3840;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  const pagePadding = 64;
  const gap = 20;
  const cardWidth = (canvas.width - (pagePadding * 2) - (gap * 5)) / 6;
  const cardTop = 176;
  const cardHeight = 824;

  context.fillStyle = "#171918";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#dc80aa";
  context.fillRect(0, 0, canvas.width, 24);
  context.fillStyle = "#fffaf5";
  context.font = '800 64px "Arial Narrow", Arial, sans-serif';
  context.fillText("LAB 01 · IMAGE MANIPULATION", pagePadding, 98);
  context.fillStyle = "#dc80aa";
  context.font = '700 27px Arial, sans-serif';
  context.fillText("PURRCEPTION.sheyn · Six transformations from pixels to evidence", pagePadding, 140);

  cards.forEach((card, index) => {
    const x = pagePadding + index * (cardWidth + gap);
    const image = images[index];
    const title = $("strong", card).textContent;
    const detail = $("small", card).textContent;

    context.fillStyle = "#f3efe8";
    context.fillRect(x, cardTop, cardWidth, cardHeight);
    context.fillStyle = index % 2 === 0 ? "#dc80aa" : "#f0bd3f";
    context.fillRect(x, cardTop, cardWidth, 16);
    context.fillStyle = "#292e2b";
    context.fillRect(x + 24, cardTop + 48, cardWidth - 48, 610);
    drawImageContained(context, image, x + 24, cardTop + 48, cardWidth - 48, 610);

    context.fillStyle = "#b6386f";
    context.font = '800 28px Arial, sans-serif';
    context.fillText(String(index + 1).padStart(2, "0"), x + 26, cardTop + 710);
    context.fillStyle = "#171918";
    context.font = '800 34px "Arial Narrow", Arial, sans-serif';
    context.fillText(title.toUpperCase(), x + 26, cardTop + 758, cardWidth - 52);
    context.fillStyle = "#68635c";
    context.font = '500 21px Arial, sans-serif';
    context.fillText(detail, x + 26, cardTop + 800, cardWidth - 52);
  });

  canvas.toBlob((blob) => {
    if (!blob) {
      showToast("The horizontal image set could not be created. Please try again.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lab01-horizontal-evidence-3840x1080.png";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast("Horizontal 3840 × 1080 evidence image downloaded.");
  }, "image/png");
}

function setMode(mode) {
  state.mode = mode;
  state.crop = null;
  $$('[data-mode]').forEach((button) => button.classList.toggle("is-active", button.dataset.mode === mode));
  elements.canvasHint.textContent = mode === "crop"
    ? "Drag across the image to select a region of interest."
    : "Move over the image and click a pixel to inspect its values.";
  renderOverlay();
  refreshControls();
}

function disposeImageState() {
  state.current?.delete();
  state.original?.delete();
  state.history.forEach((entry) => entry.mat.delete());
  state.current = null;
  state.original = null;
  state.history = [];
}

function loadCanvasIntoStudio(sourceCanvas, sourceWidth, sourceHeight, sourceName = "Uploaded image") {
  if (!state.ready) {
    showToast("The OpenCV engine is still loading. Please try again in a moment.");
    return;
  }
  disposeImageState();
  const loaded = cv.imread(sourceCanvas);
  state.current = loaded;
  state.original = loaded.clone();
  state.sourceWidth = sourceWidth;
  state.sourceHeight = sourceHeight;
  state.selectedPixel = null;
  state.crop = null;
  state.operationLabels = ["Loaded"];
  state.evidence.clear();
  $$("[data-evidence-card]").forEach((card) => {
    card.classList.remove("is-captured");
    $("img", card).removeAttribute("src");
    $("small", card).textContent = "Not captured";
  });
  elements.progressCount.textContent = "0";
  elements.progressBar.style.width = "0%";
  render("Original color image");
  captureEvidence("original", `${loaded.cols} × ${loaded.rows} · RGBA`);
  setMode("inspect");
  elements.canvasHint.textContent = `${sourceName} loaded. Click any pixel to inspect it.`;
  showToast("Image developed — your original evidence shot is ready.");
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("Please choose a JPG, PNG, or WEBP image.");
    return;
  }
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    const maxSide = 2400;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    sourceCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    sourceCanvas.getContext("2d", { willReadFrequently: true }).drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);
    loadCanvasIntoStudio(sourceCanvas, image.naturalWidth, image.naturalHeight, file.name);
    URL.revokeObjectURL(objectUrl);
    elements.fileInput.value = "";
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    showToast("That image could not be read. Try another file.");
  };
  image.src = objectUrl;
}

function applyGrayscale() {
  if (!state.current) return;
  pushHistory("Grayscale");
  const gray = new cv.Mat();
  const channels = state.current.channels();
  if (channels === 1) state.current.copyTo(gray);
  else cv.cvtColor(state.current, gray, channels === 4 ? cv.COLOR_RGBA2GRAY : cv.COLOR_RGB2GRAY);
  replaceCurrent(gray, "Converted to grayscale");
  captureEvidence("grayscale", `${gray.cols} × ${gray.rows} · 1 channel`);
  showToast("Grayscale evidence captured.");
}

function applyRotate() {
  if (!state.current) return;
  pushHistory("Rotate 90°");
  const rotated = new cv.Mat();
  cv.rotate(state.current, rotated, cv.ROTATE_90_CLOCKWISE);
  replaceCurrent(rotated, "Rotated 90° clockwise");
  captureEvidence("rotate", `${rotated.cols} × ${rotated.rows} · clockwise`);
  showToast("Rotation evidence captured.");
}

function applyResize() {
  if (!state.current) return;
  const width = clamp(Number.parseInt(elements.resizeWidth.value, 10) || 1, 1, 5000);
  const height = clamp(Number.parseInt(elements.resizeHeight.value, 10) || 1, 1, 5000);
  if (width * height > 16000000) {
    showToast("Choose dimensions below 16 million pixels for browser safety.");
    return;
  }
  pushHistory("Resize");
  const resized = new cv.Mat();
  const interpolation = width < state.current.cols || height < state.current.rows ? cv.INTER_AREA : cv.INTER_LINEAR;
  cv.resize(state.current, resized, new cv.Size(width, height), 0, 0, interpolation);
  replaceCurrent(resized, `Resized to ${width} × ${height}`);
  captureEvidence("resize", `${width} × ${height} · ${interpolation === cv.INTER_AREA ? "INTER_AREA" : "INTER_LINEAR"}`);
  showToast("Resize evidence captured.");
}

function applyCrop() {
  if (!state.current || !state.crop) return;
  const x = clamp(Math.round(state.crop.x), 0, state.current.cols - 1);
  const y = clamp(Math.round(state.crop.y), 0, state.current.rows - 1);
  const width = clamp(Math.round(state.crop.w), 1, state.current.cols - x);
  const height = clamp(Math.round(state.crop.h), 1, state.current.rows - y);
  if (width < 2 || height < 2) return;
  pushHistory("Crop ROI");
  const cropped = state.current.roi(new cv.Rect(x, y, width, height)).clone();
  replaceCurrent(cropped, `Cropped ROI · ${width} × ${height}`);
  captureEvidence("crop", `${width} × ${height} · x ${x}, y ${y}`);
  setMode("inspect");
  showToast("Crop evidence captured.");
}

function applyPixelEdit() {
  if (!state.current || !state.selectedPixel) return;
  const red = clamp(Number(elements.redValue.value) || 0, 0, 255);
  const green = clamp(Number(elements.greenValue.value) || 0, 0, 255);
  const blue = clamp(Number(elements.blueValue.value) || 0, 0, 255);
  const { x, y } = state.selectedPixel;
  pushHistory("Pixel edit");
  let edited = state.current.clone();
  if (edited.channels() === 1) {
    const rgba = new cv.Mat();
    cv.cvtColor(edited, rgba, cv.COLOR_GRAY2RGBA);
    edited.delete();
    edited = rgba;
  } else if (edited.channels() === 3) {
    const rgba = new cv.Mat();
    cv.cvtColor(edited, rgba, cv.COLOR_RGB2RGBA);
    edited.delete();
    edited = rgba;
  }
  const pixel = edited.ucharPtr(y, x);
  pixel[0] = red;
  pixel[1] = green;
  pixel[2] = blue;
  pixel[3] = 255;
  replaceCurrent(edited, `Changed pixel (${x}, ${y})`);
  inspectPixel(x, y);
  captureEvidence("pixel", `(${x}, ${y}) · RGB ${red}, ${green}, ${blue}`);
  showToast("Pixel-edit evidence captured.");
}

function undo() {
  const entry = state.history.pop();
  if (!entry) return;
  state.current?.delete();
  state.current = entry.mat;
  state.operationLabels = entry.labels;
  state.selectedPixel = null;
  state.crop = null;
  render("Undid last operation");
  showToast("Last operation undone.");
}

function reset() {
  if (!state.original) return;
  state.current?.delete();
  state.current = state.original.clone();
  state.history.forEach((entry) => entry.mat.delete());
  state.history = [];
  state.operationLabels = ["Loaded"];
  state.selectedPixel = null;
  state.crop = null;
  render("Reset to original image");
  setMode("inspect");
  showToast("Canvas reset. Your captured evidence remains in the photo strip.");
}

function syncColorFromPicker() {
  const value = elements.colorPicker.value;
  elements.redValue.value = Number.parseInt(value.slice(1, 3), 16);
  elements.greenValue.value = Number.parseInt(value.slice(3, 5), 16);
  elements.blueValue.value = Number.parseInt(value.slice(5, 7), 16);
}

function syncPickerFromRGB() {
  const values = [elements.redValue, elements.greenValue, elements.blueValue].map((input) => clamp(Number(input.value) || 0, 0, 255));
  elements.colorPicker.value = `#${values.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function updateResizeFromWidth() {
  if (state.resizeSync || !state.current || !elements.ratioLock.checked) return;
  state.resizeSync = true;
  elements.resizeHeight.value = Math.max(1, Math.round((Number(elements.resizeWidth.value) || 1) * state.current.rows / state.current.cols));
  state.resizeSync = false;
}

function updateResizeFromHeight() {
  if (state.resizeSync || !state.current || !elements.ratioLock.checked) return;
  state.resizeSync = true;
  elements.resizeWidth.value = Math.max(1, Math.round((Number(elements.resizeHeight.value) || 1) * state.current.cols / state.current.rows));
  state.resizeSync = false;
}

function makeSelfTestImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 320;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#dc80aa");
  gradient.addColorStop(.48, "#f0bd3f");
  gradient.addColorStop(1, "#438bc6");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#171918";
  context.fillRect(40, 50, 140, 190);
  context.fillStyle = "white";
  context.font = "700 48px sans-serif";
  context.fillText("CV", 72, 158);
  context.beginPath();
  context.arc(340, 158, 82, 0, Math.PI * 2);
  context.fill();
  return canvas;
}

function runSelfTest() {
  if (state.selfTestStarted || !new URLSearchParams(location.search).has("selftest")) return;
  state.selfTestStarted = true;
  const results = [];
  try {
    loadCanvasIntoStudio(makeSelfTestImage(), 480, 320, "Automated test image");
    results.push(state.current?.cols === 480 && state.current?.rows === 320 ? "load:pass" : "load:fail");
    inspectPixel(40, 50);
    elements.colorPicker.value = "#13a86f";
    syncColorFromPicker();
    applyPixelEdit();
    results.push(state.evidence.has("pixel") ? "pixel:pass" : "pixel:fail");
    applyGrayscale();
    results.push(state.current.channels() === 1 ? "gray:pass" : "gray:fail");
    elements.resizeWidth.value = 240;
    elements.resizeHeight.value = 160;
    applyResize();
    results.push(state.current.cols === 240 && state.current.rows === 160 ? "resize:pass" : "resize:fail");
    applyRotate();
    results.push(state.current.cols === 160 && state.current.rows === 240 ? "rotate:pass" : "rotate:fail");
    state.crop = { x: 10, y: 10, w: 100, h: 100 };
    applyCrop();
    results.push(state.current.cols === 100 && state.current.rows === 100 ? "crop:pass" : "crop:fail");
    const passed = results.every((result) => result.endsWith(":pass"));
    document.documentElement.dataset.selftest = passed ? "passed" : "failed";
    window.__lab01TestResults = results;
    showToast(passed ? "OpenCV self-test passed." : "OpenCV self-test found a problem.");
  } catch (error) {
    document.documentElement.dataset.selftest = "failed";
    window.__lab01TestResults = [...results, `error:${error.message}`];
    console.error(error);
  }
}

async function markOpenCvReady() {
  if (state.ready) return;
  try {
    if (window.cv instanceof Promise) window.cv = await window.cv;
    if (!window.cv?.Mat) return;
    state.ready = true;
    setEngineState("is-ready", "OpenCV.js ready");
    showToast("OpenCV.js is ready — load an image to begin.");
    runSelfTest();
  } catch (error) {
    onOpenCvScriptError(error);
  }
}

window.onOpenCvScriptLoaded = async () => {
  if (window.cv instanceof Promise) window.cv = await window.cv;
  await markOpenCvReady();
};

window.onOpenCvScriptError = () => {
  setEngineState("has-error", "OpenCV.js unavailable");
  showToast("OpenCV.js could not load. Check your internet connection and refresh.");
  document.documentElement.dataset.selftest = "opencv-load-error";
};

window.Module.onRuntimeInitialized = markOpenCvReady;

elements.fileInput.addEventListener("change", () => loadFile(elements.fileInput.files[0]));
elements.grayscaleButton.addEventListener("click", applyGrayscale);
elements.rotateButton.addEventListener("click", applyRotate);
elements.resizeButton.addEventListener("click", applyResize);
elements.applyCropButton.addEventListener("click", applyCrop);
elements.applyPixelButton.addEventListener("click", applyPixelEdit);
elements.undoButton.addEventListener("click", undo);
elements.resetButton.addEventListener("click", reset);
elements.colorPicker.addEventListener("input", syncColorFromPicker);
[elements.redValue, elements.greenValue, elements.blueValue].forEach((input) => input.addEventListener("input", syncPickerFromRGB));
elements.resizeWidth.addEventListener("input", updateResizeFromWidth);
elements.resizeHeight.addEventListener("input", updateResizeFromHeight);
$$('[data-mode]').forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

elements.overlayCanvas.addEventListener("pointerdown", (event) => {
  if (!state.current) return;
  const point = toImageCoordinates(event);
  if (state.mode === "inspect") {
    inspectPixel(point.x, point.y);
    return;
  }
  state.draggingCrop = true;
  state.cropStart = point;
  state.crop = { x: point.x, y: point.y, w: 0, h: 0 };
  elements.overlayCanvas.setPointerCapture(event.pointerId);
  renderOverlay();
});

elements.overlayCanvas.addEventListener("pointermove", (event) => {
  if (!state.current) return;
  const point = toImageCoordinates(event);
  if (state.mode === "inspect") {
    inspectPixel(point.x, point.y);
    return;
  }
  if (!state.draggingCrop) return;
  state.crop = {
    x: Math.min(state.cropStart.x, point.x),
    y: Math.min(state.cropStart.y, point.y),
    w: Math.abs(point.x - state.cropStart.x),
    h: Math.abs(point.y - state.cropStart.y)
  };
  renderOverlay();
  refreshControls();
});

function finishCrop(event) {
  if (!state.draggingCrop) return;
  state.draggingCrop = false;
  if (elements.overlayCanvas.hasPointerCapture(event.pointerId)) elements.overlayCanvas.releasePointerCapture(event.pointerId);
  if (state.crop?.w < 2 || state.crop?.h < 2) state.crop = null;
  elements.canvasHint.textContent = state.crop
    ? `ROI selected: ${Math.round(state.crop.w)} × ${Math.round(state.crop.h)} pixels. Choose “Apply selected crop”.`
    : "Drag across the image to select a larger region of interest.";
  renderOverlay();
  refreshControls();
}
elements.overlayCanvas.addEventListener("pointerup", finishCrop);
elements.overlayCanvas.addEventListener("pointercancel", finishCrop);

let dragDepth = 0;
elements.dropSurface.addEventListener("dragenter", (event) => {
  event.preventDefault();
  dragDepth += 1;
  elements.dropSurface.classList.add("is-dragging");
});
elements.dropSurface.addEventListener("dragover", (event) => event.preventDefault());
elements.dropSurface.addEventListener("dragleave", () => {
  dragDepth -= 1;
  if (dragDepth <= 0) {
    dragDepth = 0;
    elements.dropSurface.classList.remove("is-dragging");
  }
});
elements.dropSurface.addEventListener("drop", (event) => {
  event.preventDefault();
  dragDepth = 0;
  elements.dropSurface.classList.remove("is-dragging");
  loadFile(event.dataTransfer.files[0]);
});

elements.printButton.addEventListener("click", () => window.print());
elements.downloadStripButton.addEventListener("click", downloadHorizontalEvidenceStrip);
elements.visitorAnswerButton.addEventListener("click", startVisitorAnswers);
elements.restoreAnswersButton.addEventListener("click", restoreOwnerAnswers);
elements.copyCodeButton.addEventListener("click", async () => {
  const text = elements.pythonCode.innerText;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  showToast("Python/OpenCV code copied.");
});

window.addEventListener("beforeunload", disposeImageState);
createPixelGrid();
refreshControls();
