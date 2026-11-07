# Computer Vision Laboratory — Design Decisions

Last updated: 2026-11-06

## Decision Rules

- Preserve every instructor-required laboratory feature.
- Discuss optional creative enhancements before implementation.
- Implement and test one laboratory at a time.
- Proceed to the next laboratory only after the current activity is approved.
- Do not treat proposals or recommended defaults as approved decisions.

## Overall Website Design

Status: Shared foundation implemented and tested; awaiting user approval

- Website name: `CVLAB.106 — PURRCEPTION.sheyn`
- Subtitle: `Computer Vision Lab Database`
- Overall color palette: Warm paper background, black ink, and seven lab-specific colors: pink, yellow, orange, green, purple, blue, and teal.
- Typography: Barlow Condensed for bold headings, Inter for interface text, and Caveat for handwritten notes.
- Homepage layout: Grid-lined masthead, manifesto hero, floating computer-vision illustrations, featured laboratory carousel, seven large colored laboratory panels, notebook/manifesto section, and compact course footer.
- Illustration style: Flat object illustrations mixed with hand-drawn technical sketches.
- Navigation structure: Masthead navigation with Index and Menu, plus direct access to the homepage laboratory catalog.
- Shared design direction: An original Computer Vision Laboratory adaptation of Mijonju's playful editorial public-notebook system.

### Reference Image Observations

Reference received: 2026-11-06

- Warm off-white, paper-like background with thin black editorial grid lines.
- Bold condensed uppercase display headings paired with small utilitarian labels and handwritten accents.
- A modular public-notebook layout: masthead, manifesto hero, featured entries, category blocks, notes, and compact footer.
- Flat, playful object illustrations mixed with simple geometric and technical symbols.
- Saturated pink, mustard, orange-red, blue, and neutral category panels.
- Mostly square corners, restrained shadows, and small circular controls.
- Proposed adaptation to the Computer Vision Laboratory remains pending user approval.

## Laboratory Status

| Laboratory | Theme | Selected features | Rejected suggestions | Approved layout | Additional functionality | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Lab 01 — Image Manipulation | Pink Pixel Studio + retro photo booth | OpenCV image exploration and manipulation, pixel inspector, print-ready evidence sheet | Unselected alternatives: simple playground, standalone before/after workspace | Editor toolbar + center canvas + right inspector + photo strip | Undo/reset, OpenCV/Python mapping, printable contact sheet | Implemented and tested; awaiting user approval |
| Lab 02 — Edge Detection | Pending | Pending | None yet | Pending | Pending | Not started |
| Lab 03 — Histogram Equalization | Pending | Pending | None yet | Pending | Pending | Not started |
| Lab 04 — Feature Detection | Pending | Pending | None yet | Pending | Pending | Not started |
| Lab 05 — PCA & Eigenfaces | Pending | Pending | None yet | Pending | Pending | Not started |
| Lab 06 — Object Detection | Pending | Pending | None yet | Pending | Pending | Not started |
| Lab 07 — Image Segmentation | Pending | Pending | None yet | Pending | Pending | Not started |

## Approval Log

- 2026-11-06: Interactive approval workflow established. Overall website direction is the current decision stage.
- 2026-11-06: User approved the website name, subtitle, palette, typography, homepage structure, navigation direction, and illustration style. Shared homepage foundation authorized; Lab 01 remains pending separate planning and approval.
- 2026-11-07: Shared homepage foundation implemented as a responsive static site in `dist/`. Structural checks, JavaScript syntax checks, local HTTP checks, and desktop browser visual QA passed. Awaiting user approval before Lab 01 requirement analysis and personalization planning.
- 2026-11-07: Lab 01 instructor document analyzed. Required functionality recorded; visual theme, workspace layout, interactions, optional enhancements, and results presentation await user selection.
- 2026-11-07: User approved all recommended Lab 01 choices and combined the Pink Pixel Studio editor with the retro photo-booth concept.
- 2026-11-07: Lab 01 implemented and browser-tested. The OpenCV self-test passed image loading, pixel editing, grayscale conversion, resizing, 90-degree rotation, cropping, and the complete 6/6 evidence workflow. Awaiting user review before any Lab 02 work.
- 2026-11-07: At the user's request, the Lab 01 export was revised to A4 portrait with explicit “Save as PDF” instructions, and the unwanted visible skip-workspace shortcut was removed from the lab page.
- 2026-11-07: The user requested a strict two-page export. Print QA confirmed exactly two A4 portrait pages: evidence on page 1 and the code/report responses on page 2.
- 2026-11-07: The user refined the print composition to a compact vertical evidence rail on the left and code plus written answers on the right. Print QA confirmed the complete report now fits on one A4 portrait page.
- 2026-11-07: Print refinement requested: the black evidence rail now hugs the six image cards, the narrative footer is removed, the complete code is preserved, and the Q&A uses simple ruled essay areas instead of boxed containers. PDF text extraction confirmed the final Python line and all three response sections are present on one page.
- 2026-11-07: Lab 01 display name revised to “Image Manipulation: Pixel Studio.” Activity heroes will use the lab topic plus a personalized activity title and explicitly summarize what students will learn.

## Lab 01 — Image Manipulation

### Required Laboratory Features

- Explain digital images as pixel arrays, including resolution, intensity, channels, grayscale versus color, and OpenCV's BGR channel order.
- Load and display a color image and report its height, width, channels, and shape.
- Convert the image to grayscale and display the result.
- Inspect a pixel at selected coordinates and display its values.
- Change a selected pixel's color and visibly show the result.
- Crop a region of interest.
- Resize the image to smaller or larger dimensions.
- Rotate the image by 90 degrees.
- Provide original, grayscale, and manipulated-image evidence suitable for the required hardcopy report.
- Reinforce what was learned and relate basic image processing to real computer-vision applications.

### Suggested Creative Enhancements

Approved:

- Magnified pixel grid with coordinate and RGB/BGR values.
- Print-ready laboratory evidence sheet.
- Undo and reset controls supporting the approved editor interaction model.
- Retro photo-booth evidence strip integrated into the Pink Pixel Studio.

### My Personalization Choices

Approved on 2026-11-07:

- Visual concept: Hybrid of a Photoshop-inspired Pink Pixel Studio and a retro photo booth.
- Workspace: Left operation toolbar, large center canvas, right pixel/properties inspector, and bottom result strip.
- Interactions: Drag-and-drop/upload, clickable pixel inspection, draggable crop box, resize controls, grayscale, 90-degree rotation, undo, and reset.
- Results: Printable contact sheet showing original, grayscale, pixel edit, crop, resize, and rotation, with dimensions and equivalent Python/OpenCV code.
- Print format: One compact A4 portrait page, opened through a clearly labeled “Save as PDF” action. Six smaller evidence cards form a fitted vertical rail on the left; complete Python code and three minimal ruled essay areas occupy the right side.
- Technical approach: OpenCV.js for live browser processing, with explicit explanations of the RGBA browser representation and Python OpenCV's BGR ordering.
