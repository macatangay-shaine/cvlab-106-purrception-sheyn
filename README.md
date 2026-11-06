# CVLAB.106 — PURRCEPTION.sheyn

Computer Vision Lab Database for CSST106, presented as a playful editorial laboratory notebook inspired by the supplied Mijonju reference.

## Technology

The website uses plain HTML, CSS, and JavaScript. Python is **not** part of the website runtime. It was used only as an optional local static-file preview server during development.

## Local preview

Open `dist/index.html` directly in a browser, or serve the folder locally:

```powershell
python -m http.server 8000 --directory dist
```

Then visit `http://localhost:8000`.

## Deployment

Pushes to the `main` branch automatically deploy the contents of `dist/` to GitHub Pages through `.github/workflows/pages.yml`.

## Project status

- Shared homepage foundation: implemented and awaiting final approval
- Laboratory 01: personalization planning pending
- Laboratories 02–07: pending

The instructor-provided laboratory documents remain local and are intentionally excluded from this public repository.

