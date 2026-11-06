# CVLAB.106 — PURRCEPTION.sheyn

Computer Vision Lab Database for CSST106, presented as a playful editorial laboratory notebook inspired by the supplied Mijonju reference.

## Live website

[Open CVLAB.106 — PURRCEPTION.sheyn](https://macatangay-shaine.github.io/cvlab-106-purrception-sheyn/)

[Open Lab 01 — Pink Pixel Studio](https://macatangay-shaine.github.io/cvlab-106-purrception-sheyn/labs/lab01/)

## Technology

The website uses plain HTML, CSS, JavaScript, and OpenCV.js for live image processing. Lab 01 also supplies equivalent Python/OpenCV code for the required laboratory report. Python is **not** required by the deployed website; it was used only as an optional local static-file preview server during development.

## Local preview

Open `dist/index.html` directly in a browser, or serve the folder locally:

```powershell
python -m http.server 8000 --directory dist
```

Then visit `http://localhost:8000`.

## Deployment

Pushes to the `main` branch automatically deploy the contents of `dist/` to GitHub Pages through `.github/workflows/pages.yml`.

## Project status

- Shared homepage foundation: implemented
- Laboratory 01: implemented and tested; awaiting user approval
- Laboratories 02–07: pending

The instructor-provided laboratory documents remain local and are intentionally excluded from this public repository.
