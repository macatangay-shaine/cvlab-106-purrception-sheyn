# CVLAB.106 — PURRCEPTION.sheyn

An interactive computer vision laboratory portfolio for CSST106. The project presents each activity as a focused browser-based experiment with academic context, live image processing, and exportable evidence.

[View the live portfolio](https://macatangay-shaine.github.io/cvlab-106-purrception-sheyn/) · [Read the design rationale](docs/DESIGN.md)

![GitHub Pages deployment](https://github.com/macatangay-shaine/cvlab-106-purrception-sheyn/actions/workflows/pages.yml/badge.svg)

## Laboratory progress

| Laboratory | Interactive experience | Status |
| --- | --- | --- |
| 01 — Image Manipulation | [Pink Pixel Studio](https://macatangay-shaine.github.io/cvlab-106-purrception-sheyn/labs/lab01/) | Complete |
| 02 — Edge Detection | [Bee-Line Edge Explorer](https://macatangay-shaine.github.io/cvlab-106-purrception-sheyn/labs/lab02/) | Complete |
| 03–07 | Planned activities | In progress |

## Highlights

- Live image processing in the browser with OpenCV.js
- Responsive, accessible interfaces built with semantic HTML
- Downloadable results and print-ready laboratory evidence
- No framework, build step, or backend required
- Automatic deployment to GitHub Pages

## Project structure

```text
.
├── .github/workflows/   # GitHub Pages automation
├── docs/                # Project and design documentation
├── src/                 # Deployable website source
│   ├── labs/
│   │   ├── lab01/
│   │   └── lab02/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── .editorconfig
├── .gitignore
└── README.md
```

The repository is intentionally compact because this is a static website. It does not need separate `frontend`, `backend`, or infrastructure folders.

## Run locally

You can open `src/index.html` directly, or serve the site from the repository root:

```powershell
python -m http.server 8000 --directory src
```

Then open <http://localhost:8000>.

## Deployment

Every push to `main` deploys `src/` through the [GitHub Pages workflow](.github/workflows/pages.yml). Instructor-provided documents and local QA artifacts are excluded from the public repository.

## Technology

HTML5, CSS3, JavaScript, OpenCV.js, GitHub Actions, and GitHub Pages.
