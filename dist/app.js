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
