const openers = document.querySelectorAll("[data-open-dialog]");
const closers = document.querySelectorAll("[data-close-dialog]");

openers.forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.openDialog);
    if (!(dialog instanceof HTMLDialogElement)) return;

    dialog.dataset.triggerId = button.dataset.openDialog;
    dialog.showModal();
    document.body.style.overflow = "hidden";
  });
});

closers.forEach((button) => {
  button.addEventListener("click", () => {
    button.closest("dialog")?.close();
  });
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) dialog.close();
  });

  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    const trigger = document.querySelector(`[data-open-dialog="${dialog.id}"]`);
    trigger?.focus();
  });

  dialog.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => dialog.close());
  });
});

const carousel = document.querySelector("[data-carousel]");
const previousButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");

function scrollCarousel(direction) {
  if (!carousel) return;
  const card = carousel.querySelector(".featured-card");
  const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
  const distance = card ? card.getBoundingClientRect().width + gap : carousel.clientWidth * 0.8;
  carousel.scrollBy({ left: distance * direction, behavior: "smooth" });
}

previousButton?.addEventListener("click", () => scrollCarousel(-1));
nextButton?.addEventListener("click", () => scrollCarousel(1));

const revealItems = document.querySelectorAll(".reveal");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const objectStage = document.querySelector(".hero__objects");
const collageDuplicates = [
  [".pixel-sprite--frog", "collage--frog-2"],
  [".pixel-sprite--bee", "collage--bee-2"],
  [".pixel-sprite--bee", "collage--bee-3"],
  [".pixel-sprite--mushroom", "collage--mushroom-2"],
  [".object--eye", "collage--eye-2"],
  [".object--pixels", "collage--pixels-2"],
  [".object--matrix", "collage--matrix-2"],
];

if (objectStage) {
  collageDuplicates.forEach(([selector, className]) => {
    const source = objectStage.querySelector(selector);
    if (!source) return;

    const duplicate = source.cloneNode(true);
    duplicate.classList.add("object--duplicate", className);
    objectStage.append(duplicate);
  });
}

const movableObjects = objectStage ? [...objectStage.querySelectorAll(".object:not(.pixel-girl)")] : [];
const objectNames = [
  ["pixel-sprite--frog", "Pixel frog"],
  ["pixel-sprite--bee", "Pixel bee"],
  ["pixel-sprite--mushroom", "Pixel mushroom"],
  ["pixel-sprite--cat", "Pixel cat"],
  ["object--asterisk", "Asterisk"],
  ["object--eye", "Computer vision eye"],
  ["object--pixels", "Pixel cube"],
  ["object--camera", "Camera"],
  ["object--magnifier", "Magnifier"],
  ["object--matrix", "Pixel matrix"],
];

function getObjectName(object) {
  return objectNames.find(([className]) => object.classList.contains(className))?.[1] || "Visual object";
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function anchorObject(object) {
  if (!objectStage) return { x: 0, y: 0 };
  if (object.classList.contains("is-moved")) {
    return {
      x: Number.parseFloat(object.style.left) || 0,
      y: Number.parseFloat(object.style.top) || 0,
    };
  }

  const stageBounds = objectStage.getBoundingClientRect();
  const objectBounds = object.getBoundingClientRect();
  const position = {
    x: objectBounds.left - stageBounds.left,
    y: objectBounds.top - stageBounds.top,
  };

  object.style.left = `${position.x}px`;
  object.style.top = `${position.y}px`;
  object.style.right = "auto";
  object.style.bottom = "auto";
  object.classList.add("is-moved");
  return position;
}

function moveObject(object, x, y) {
  if (!objectStage) return;
  const maximumX = objectStage.clientWidth - object.offsetWidth;
  const maximumY = objectStage.clientHeight - object.offsetHeight;
  object.style.left = `${clamp(x, 0, maximumX)}px`;
  object.style.top = `${clamp(y, 0, maximumY)}px`;
}

function resetObject(object) {
  object.classList.remove("is-moved", "is-dragging");
  object.style.removeProperty("left");
  object.style.removeProperty("top");
  object.style.removeProperty("right");
  object.style.removeProperty("bottom");
}

movableObjects.forEach((object) => {
  const objectName = getObjectName(object);
  object.draggable = false;
  object.tabIndex = 0;
  object.setAttribute("role", "button");
  object.setAttribute("aria-label", `${objectName}. Draggable visual object.`);
  object.setAttribute("aria-describedby", "object-move-instructions");
  object.removeAttribute("aria-hidden");

  object.addEventListener("dragstart", (event) => event.preventDefault());

  object.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    object.classList.add("is-dragging");
    const objectBounds = object.getBoundingClientRect();
    anchorObject(object);
    object.dataset.dragOffsetX = String(event.clientX - objectBounds.left);
    object.dataset.dragOffsetY = String(event.clientY - objectBounds.top);
    object.setPointerCapture(event.pointerId);
    object.focus({ preventScroll: true });
  });

  object.addEventListener("pointermove", (event) => {
    if (!object.classList.contains("is-dragging") || !objectStage) return;
    const stageBounds = objectStage.getBoundingClientRect();
    const offsetX = Number.parseFloat(object.dataset.dragOffsetX) || 0;
    const offsetY = Number.parseFloat(object.dataset.dragOffsetY) || 0;
    moveObject(object, event.clientX - stageBounds.left - offsetX, event.clientY - stageBounds.top - offsetY);
  });

  const finishDrag = (event) => {
    if (!object.classList.contains("is-dragging")) return;
    object.classList.remove("is-dragging");
    if (object.hasPointerCapture(event.pointerId)) object.releasePointerCapture(event.pointerId);
  };

  object.addEventListener("pointerup", finishDrag);
  object.addEventListener("pointercancel", finishDrag);
  object.addEventListener("dblclick", () => resetObject(object));

  object.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      resetObject(object);
      return;
    }

    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (!direction) return;

    event.preventDefault();
    const position = anchorObject(object);
    const step = event.shiftKey ? 24 : 8;
    moveObject(object, position.x + direction[0] * step, position.y + direction[1] * step);
  });
});

let resizeFrame;
window.addEventListener("resize", () => {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    movableObjects.filter((object) => object.classList.contains("is-moved")).forEach((object) => {
      moveObject(
        object,
        Number.parseFloat(object.style.left) || 0,
        Number.parseFloat(object.style.top) || 0,
      );
    });
  });
});
