"use strict";

window.Module = window.Module || {};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const PYTHON_CODE = `import cv2
import matplotlib.pyplot as plt

def edge_detection(image_path):
    # Load the image in grayscale
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print("Error: Image not found or path is incorrect.")
        return

    # Apply Gaussian blur to reduce noise
    img_blur = cv2.GaussianBlur(img, (3, 3), 0)

    # Sobel gradients in the x and y directions
    sobelx = cv2.Sobel(img_blur, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(img_blur, cv2.CV_64F, 0, 1, ksize=3)
    sobel_combined = cv2.magnitude(sobelx, sobely)

    # Canny edge detection with the required thresholds
    edges_canny = cv2.Canny(img_blur, 100, 200)

    # Display the required results side by side
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 3, 1)
    plt.imshow(img, cmap="gray")
    plt.title("Original Image")
    plt.axis("off")

    plt.subplot(1, 3, 2)
    plt.imshow(sobel_combined, cmap="gray")
    plt.title("Sobel Edge Detection")
    plt.axis("off")

    plt.subplot(1, 3, 3)
    plt.imshow(edges_canny, cmap="gray")
    plt.title("Canny Edge Detection")
    plt.axis("off")

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    edge_detection("input.jpg")`;

const elements = {
  engineStatus: $("#engineStatus"),
  fileInput: $("#fileInput"),
  sampleButton: $("#sampleButton"),
  sourceMeta: $("#sourceMeta"),
  sourceCanvas: $("#sourceCanvas"),
  originalCanvas: $("#originalCanvas"),
  sobelCanvas: $("#sobelCanvas"),
  cannyCanvas: $("#cannyCanvas"),
  blurSize: $("#blurSize"),
  lowThreshold: $("#lowThreshold"),
  highThreshold: $("#highThreshold"),
  lowValue: $("#lowValue"),
  highValue: $("#highValue"),
  overlayToggle: $("#overlayToggle"),
  resetButton: $("#resetButton"),
  originalTitle: $("#originalTitle"),
  originalMeta: $("#originalMeta"),
  sobelModeLabel: $("#sobelModeLabel"),
  sobelMeta: $("#sobelMeta"),
  cannyMeta: $("#cannyMeta"),
  edgeDensity: $("#edgeDensity"),
  methodExplanation: $("#methodExplanation"),
  downloadResultsButton: $("#downloadResultsButton"),
  pythonCode: $("#pythonCode"),
  copyCodeButton: $("#copyCodeButton"),
  comparisonText: $("#comparisonText"),
  conclusionText: $("#conclusionText"),
  printButton: $("#printButton"),
  reportPrintButton: $("#reportPrintButton"),
  printSettings: $("#printSettings"),
  printOriginal: $("#printOriginal"),
  printSobel: $("#printSobel"),
  printCanny: $("#printCanny"),
  printOriginalMeta: $("#printOriginalMeta"),
  printSobelMeta: $("#printSobelMeta"),
  printCannyMeta: $("#printCannyMeta"),
  printComparison: $("#printComparison"),
  printConclusion: $("#printConclusion"),
  printPythonCode: $("#printPythonCode"),
  toast: $("#toast")
};

const state = {
  ready: false,
  source: null,
  gray: null,
  blurred: null,
  sobel: null,
  canny: null,
  overlay: null,
  sourceName: "input.jpg",
  processingFrame: 0,
  selfTestStarted: false
};

let toastTimer = 0;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
}

function setEngineState(className, label) {
  elements.engineStatus.classList.remove("is-ready", "has-error");
  if (className) elements.engineStatus.classList.add(className);
  $("strong", elements.engineStatus).textContent = label;
}

function drawPlaceholder(canvas, title) {
  canvas.width = 720;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  context.fillStyle = "#e7e1d7";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(23,23,22,.18)";
  context.lineWidth = 2;
  for (let position = 0; position <= canvas.width; position += 72) {
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
  context.fillStyle = "#68635c";
  context.font = "600 28px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText(title, canvas.width / 2, canvas.height / 2);
}

function deleteMat(name) {
  if (state[name] && typeof state[name].delete === "function") state[name].delete();
  state[name] = null;
}

function clearDerived() {
  ["gray", "blurred", "sobel", "canny", "overlay"].forEach(deleteMat);
}

function selectedSobelMode() {
  return $("input[name='sobelMode']:checked")?.value || "magnitude";
}

function currentSettings() {
  return {
    blur: Number(elements.blurSize.value),
    mode: selectedSobelMode(),
    low: Number(elements.lowThreshold.value),
    high: Number(elements.highThreshold.value),
    overlay: elements.overlayToggle.checked
  };
}

function syncThresholds(changed) {
  let low = Number(elements.lowThreshold.value);
  let high = Number(elements.highThreshold.value);
  if (low >= high) {
    if (changed === "low") {
      high = Math.min(255, low + 1);
      elements.highThreshold.value = String(high);
    } else {
      low = Math.max(0, high - 1);
      elements.lowThreshold.value = String(low);
    }
  }
  elements.lowValue.value = String(low);
  elements.lowValue.textContent = String(low);
  elements.highValue.value = String(high);
  elements.highValue.textContent = String(high);
}

function createOverlay(source, edges) {
  const overlay = source.clone();
  if (overlay.channels() !== 4) {
    const rgba = new cv.Mat();
    cv.cvtColor(overlay, rgba, overlay.channels() === 1 ? cv.COLOR_GRAY2RGBA : cv.COLOR_RGB2RGBA);
    overlay.delete();
    for (let index = 0; index < edges.rows * edges.cols; index += 1) {
      if (edges.data[index] > 0) {
        rgba.data[index * 4] = 242;
        rgba.data[index * 4 + 1] = 189;
        rgba.data[index * 4 + 2] = 47;
        rgba.data[index * 4 + 3] = 255;
      }
    }
    return rgba;
  }
  for (let index = 0; index < edges.rows * edges.cols; index += 1) {
    if (edges.data[index] > 0) {
      overlay.data[index * 4] = 242;
      overlay.data[index * 4 + 1] = 189;
      overlay.data[index * 4 + 2] = 47;
      overlay.data[index * 4 + 3] = 255;
    }
  }
  return overlay;
}

function updateExplanation(density, settings) {
  const modeText = settings.mode === "magnitude"
    ? "The Sobel magnitude combines horizontal and vertical gradients"
    : `The Sobel ${settings.mode.toUpperCase()} view isolates ${settings.mode === "x" ? "vertical" : "horizontal"} boundaries`;
  let thresholdText = "The instructor thresholds keep a balanced set of strong and connected weak contours.";
  if (settings.low < 70) thresholdText = "The lower threshold admits more weak responses, so fine detail and noise may both increase.";
  if (settings.high > 220) thresholdText = "The high threshold is strict, leaving fewer contours supported by strong gradient evidence.";
  elements.methodExplanation.textContent = `${modeText}. Canny thins and links its binary contours. ${thresholdText}`;
  elements.edgeDensity.textContent = `${density.toFixed(2)}% edge pixels`;
}

function renderResults(settings) {
  cv.imshow(elements.originalCanvas, settings.overlay ? state.overlay : state.gray);
  cv.imshow(elements.sobelCanvas, state.sobel);
  cv.imshow(elements.cannyCanvas, state.canny);

  const dimensions = `${state.gray.cols} × ${state.gray.rows}`;
  const modeLabel = settings.mode === "magnitude" ? "magnitude" : `${settings.mode.toUpperCase()} direction`;
  elements.originalTitle.textContent = settings.overlay ? "Original + Canny overlay" : "Original grayscale";
  elements.originalMeta.textContent = `${dimensions} · ${state.sourceName}`;
  elements.sobelModeLabel.textContent = modeLabel;
  elements.sobelMeta.textContent = `3 × 3 derivative · ${modeLabel}`;
  elements.cannyMeta.textContent = `Thresholds ${settings.low} / ${settings.high}`;
  const density = (cv.countNonZero(state.canny) / (state.canny.rows * state.canny.cols)) * 100;
  updateExplanation(density, settings);
}

function processEdges() {
  if (!state.ready || !state.source) return;
  const settings = currentSettings();
  clearDerived();
  try {
    state.gray = new cv.Mat();
    if (state.source.channels() === 4) cv.cvtColor(state.source, state.gray, cv.COLOR_RGBA2GRAY);
    else if (state.source.channels() === 3) cv.cvtColor(state.source, state.gray, cv.COLOR_RGB2GRAY);
    else state.gray = state.source.clone();

    state.blurred = new cv.Mat();
    cv.GaussianBlur(state.gray, state.blurred, new cv.Size(settings.blur, settings.blur), 0, 0, cv.BORDER_DEFAULT);

    const sobelX = new cv.Mat();
    const sobelY = new cv.Mat();
    cv.Sobel(state.blurred, sobelX, cv.CV_64F, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
    cv.Sobel(state.blurred, sobelY, cv.CV_64F, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);
    state.sobel = new cv.Mat();
    if (settings.mode === "x") {
      cv.convertScaleAbs(sobelX, state.sobel);
    } else if (settings.mode === "y") {
      cv.convertScaleAbs(sobelY, state.sobel);
    } else {
      const magnitude = new cv.Mat();
      cv.magnitude(sobelX, sobelY, magnitude);
      cv.normalize(magnitude, state.sobel, 0, 255, cv.NORM_MINMAX, cv.CV_8U);
      magnitude.delete();
    }
    sobelX.delete();
    sobelY.delete();

    state.canny = new cv.Mat();
    cv.Canny(state.blurred, state.canny, settings.low, settings.high, 3, false);
    state.overlay = createOverlay(state.source, state.canny);
    renderResults(settings);
    document.documentElement.dataset.processing = "ready";
  } catch (error) {
    document.documentElement.dataset.processing = "failed";
    console.error(error);
    showToast(`Processing error: ${error.message}`);
  }
}

function scheduleProcessing() {
  cancelAnimationFrame(state.processingFrame);
  state.processingFrame = requestAnimationFrame(processEdges);
}

function setSourceFromImage(image, name) {
  const maxDimension = 1000;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  elements.sourceCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  elements.sourceCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = elements.sourceCanvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, elements.sourceCanvas.width, elements.sourceCanvas.height);
  context.drawImage(image, 0, 0, elements.sourceCanvas.width, elements.sourceCanvas.height);
  deleteMat("source");
  state.source = cv.imread(elements.sourceCanvas);
  state.sourceName = name;
  elements.sourceMeta.textContent = `${name} · ${image.naturalWidth} × ${image.naturalHeight}px`;
  processEdges();
}

function loadImageSource(source, name) {
  if (!state.ready) {
    showToast("OpenCV.js is still loading.");
    return;
  }
  const image = new Image();
  image.onload = () => setSourceFromImage(image, name);
  image.onerror = () => showToast(`Could not load ${name}.`);
  image.src = source;
}

function loadDefaultImage() {
  loadImageSource("input.jpg", "input.jpg · provided university seal");
}

function loadFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Choose a JPG, PNG, or another image file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => loadImageSource(reader.result, file.name);
  reader.onerror = () => showToast("The selected image could not be read.");
  reader.readAsDataURL(file);
}

function resetDefaults() {
  elements.blurSize.value = "3";
  elements.lowThreshold.value = "100";
  elements.highThreshold.value = "200";
  elements.overlayToggle.checked = false;
  const magnitude = $("input[name='sobelMode'][value='magnitude']");
  if (magnitude) magnitude.checked = true;
  syncThresholds();
  processEdges();
  showToast("Required settings restored: Gaussian 3 × 3, Canny 100 / 200.");
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function downloadComparison() {
  if (!state.gray) return showToast("Wait for an image to finish processing.");
  const cards = [elements.originalCanvas, elements.sobelCanvas, elements.cannyCanvas];
  const titles = ["Original grayscale", `Sobel ${selectedSobelMode()}`, `Canny ${elements.lowThreshold.value}/${elements.highThreshold.value}`];
  const width = 1800;
  const panelWidth = width / 3;
  const imageHeight = 560;
  const output = document.createElement("canvas");
  output.width = width;
  output.height = 680;
  const context = output.getContext("2d");
  context.fillStyle = "#f3efe7";
  context.fillRect(0, 0, output.width, output.height);
  context.fillStyle = "#f2bd2f";
  context.fillRect(0, 0, output.width, 18);
  context.fillStyle = "#171716";
  context.font = "700 30px Arial";
  context.textAlign = "center";
  cards.forEach((canvas, index) => {
    const availableWidth = panelWidth - 50;
    const scale = Math.min(availableWidth / canvas.width, imageHeight / canvas.height);
    const drawWidth = canvas.width * scale;
    const drawHeight = canvas.height * scale;
    const x = index * panelWidth + (panelWidth - drawWidth) / 2;
    const y = 70 + (imageHeight - drawHeight) / 2;
    context.drawImage(canvas, x, y, drawWidth, drawHeight);
    context.fillText(titles[index], index * panelWidth + panelWidth / 2, 650);
  });
  downloadCanvas(output, "lab02-edge-comparison.png");
}

function matDataUrl(mat) {
  const canvas = document.createElement("canvas");
  cv.imshow(canvas, mat);
  return canvas.toDataURL("image/png");
}

function syncPrintReport() {
  if (!state.gray || !state.sobel || !state.canny) return false;
  const settings = currentSettings();
  elements.printOriginal.src = matDataUrl(state.gray);
  elements.printSobel.src = matDataUrl(state.sobel);
  elements.printCanny.src = matDataUrl(state.canny);
  elements.printSettings.textContent = `Gaussian ${settings.blur} × ${settings.blur} · Sobel ${settings.mode} · Canny ${settings.low} / ${settings.high}`;
  elements.printOriginalMeta.textContent = `${state.gray.cols} × ${state.gray.rows}px · ${state.sourceName}`;
  elements.printSobelMeta.textContent = `${settings.mode} response · 3 × 3 derivative`;
  elements.printCannyMeta.textContent = `Low ${settings.low} · High ${settings.high}`;
  elements.printComparison.textContent = elements.comparisonText.value.trim();
  elements.printConclusion.textContent = elements.conclusionText.value.trim();
  elements.printPythonCode.textContent = PYTHON_CODE;
  return true;
}

function printReport() {
  if (!syncPrintReport()) {
    showToast("Wait for the provided image to finish processing before saving the report.");
    return;
  }
  window.print();
}

async function copyPythonCode() {
  try {
    await navigator.clipboard.writeText(PYTHON_CODE);
    showToast("Python code copied.");
  } catch {
    showToast("Select the code and copy it manually.");
  }
}

function runSelfTest() {
  if (state.selfTestStarted) return;
  state.selfTestStarted = true;
  const mats = [];
  try {
    const test = new cv.Mat(96, 128, cv.CV_8UC1, new cv.Scalar(0));
    mats.push(test);
    for (let y = 24; y < 72; y += 1) {
      for (let x = 32; x < 96; x += 1) test.ucharPtr(y, x)[0] = 255;
    }
    const blur = new cv.Mat();
    const sx = new cv.Mat();
    const sy = new cv.Mat();
    const magnitude = new cv.Mat();
    const normalized = new cv.Mat();
    const canny = new cv.Mat();
    mats.push(blur, sx, sy, magnitude, normalized, canny);
    cv.GaussianBlur(test, blur, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);
    cv.Sobel(blur, sx, cv.CV_64F, 1, 0, 3);
    cv.Sobel(blur, sy, cv.CV_64F, 0, 1, 3);
    cv.magnitude(sx, sy, magnitude);
    cv.normalize(magnitude, normalized, 0, 255, cv.NORM_MINMAX, cv.CV_8U);
    cv.Canny(blur, canny, 100, 200, 3, false);
    const passed = cv.countNonZero(normalized) > 0 && cv.countNonZero(canny) > 0;
    document.documentElement.dataset.selftest = passed ? "passed" : "failed";
    window.__lab02TestResults = {
      gaussian: blur.rows === 96 && blur.cols === 128,
      sobelPixels: cv.countNonZero(normalized),
      cannyPixels: cv.countNonZero(canny),
      passed
    };
  } catch (error) {
    document.documentElement.dataset.selftest = "failed";
    window.__lab02TestResults = { passed: false, error: error.message };
    console.error(error);
  } finally {
    mats.forEach((mat) => mat.delete());
  }
}

async function markOpenCvReady() {
  if (state.ready) return;
  try {
    if (window.cv instanceof Promise) window.cv = await window.cv;
    if (!window.cv?.Mat) return;
    state.ready = true;
    setEngineState("is-ready", "OpenCV.js ready");
    runSelfTest();
    loadDefaultImage();
  } catch (error) {
    window.onOpenCvScriptError(error);
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

elements.pythonCode.textContent = PYTHON_CODE;
elements.printPythonCode.textContent = PYTHON_CODE;
[elements.originalCanvas, elements.sobelCanvas, elements.cannyCanvas].forEach((canvas, index) => {
  drawPlaceholder(canvas, ["Original image", "Sobel response", "Canny edges"][index]);
});

elements.fileInput.addEventListener("change", () => loadFile(elements.fileInput.files[0]));
elements.sampleButton.addEventListener("click", loadDefaultImage);
elements.blurSize.addEventListener("change", processEdges);
$$('input[name="sobelMode"]').forEach((radio) => radio.addEventListener("change", processEdges));
elements.lowThreshold.addEventListener("input", () => {
  syncThresholds("low");
  scheduleProcessing();
});
elements.highThreshold.addEventListener("input", () => {
  syncThresholds("high");
  scheduleProcessing();
});
elements.overlayToggle.addEventListener("change", processEdges);
elements.resetButton.addEventListener("click", resetDefaults);
elements.copyCodeButton.addEventListener("click", copyPythonCode);
elements.downloadResultsButton.addEventListener("click", downloadComparison);
elements.printButton.addEventListener("click", printReport);
elements.reportPrintButton.addEventListener("click", printReport);
$$('[data-download]').forEach((button) => button.addEventListener("click", () => {
  const canvas = elements[`${button.dataset.download}Canvas`];
  if (canvas) downloadCanvas(canvas, `lab02-${button.dataset.download}.png`);
}));
window.addEventListener("beforeprint", syncPrintReport);
window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(state.processingFrame);
  ["source", "gray", "blurred", "sobel", "canny", "overlay"].forEach(deleteMat);
});

syncThresholds();
