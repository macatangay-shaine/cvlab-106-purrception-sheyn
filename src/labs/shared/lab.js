"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min = 0, max = 255) => Math.min(max, Math.max(min, value));

const LABS = {
  "03": {
    title: "Histogram Equalization",
    activity: "Contrast Signal Workshop",
    intro: "In this activity, you will read an image through its intensity distribution, stretch limited contrast, compare global histogram equalization with CLAHE, and explain when enhancement reveals detail—or amplifies noise.",
    outcomes: ["Read histograms", "Stretch contrast", "Compare CLAHE"],
    map: [["Inspect", "Measure the original intensity distribution."], ["Adjust", "Apply linear contrast stretching."], ["Equalize", "Redistribute global pixel intensities."], ["Adapt", "Enhance local tiles with CLAHE."]],
    results: [["Original grayscale", "Input intensity evidence"], ["Contrast stretch", "Linear adjustment around mid-gray"], ["Global equalization", "One cumulative mapping for the image"], ["Adaptive equalization", "Locally clipped tile mappings"]],
    controls: `<div class="control-group"><label for="contrastRange">Linear contrast</label><div class="range-head"><span>Factor</span><output id="contrastValue">1.25×</output></div><input id="contrastRange" type="range" min="80" max="200" value="125" /></div><div class="control-group"><label for="tileRange">CLAHE tiles</label><div class="range-head"><span>Grid</span><output id="tileValue">4 × 4</output></div><input id="tileRange" type="range" min="2" max="8" value="4" /></div>`,
    metricLabel: "Contrast spread",
    metricNote: "A wider histogram generally indicates stronger tonal separation, but excessive spreading can expose noise.",
    guide: {
      example: ["Low-contrast medical and security images", "An X-ray, retinal scan, or nighttime camera frame may contain important details compressed into a narrow range of gray values. Contrast enhancement makes those faint structures easier for a person or a later vision model to inspect."],
      steps: [["Establish a baseline", "Load the activity sample and compare the original image with its narrow histogram."], ["Change one control", "Move Linear contrast from 0.80× toward 2.00×, then vary the CLAHE grid from 2 × 2 to 8 × 8."], ["Compare the methods", "Look at the same dark, bright, and textured area in the original, global equalization, and CLAHE results."]],
      observations: ["A wider histogram should create clearer separation between nearby gray tones.", "Global equalization changes the whole image with one mapping; CLAHE reveals detail region by region.", "Very strong enhancement can make grain, speckles, or compression artifacts more visible."],
      tip: "If the image change seems small, watch the histogram first, then compare detail inside the darkest and brightest areas instead of judging only overall brightness."
    },
    methods: [["Grayscale", "Reduce color to a single luminance channel."], ["Histogram", "Count how many pixels occupy each intensity."], ["Global mapping", "Use the cumulative distribution to spread values."], ["CLAHE", "Clip and equalize local tiles to protect regional detail."]],
    answers: [
      ["What is histogram equalization?", "Histogram equalization is a contrast-enhancement technique that remaps image intensities using the cumulative distribution of the histogram. It spreads frequently occurring intensity values across a wider range so details hidden in dark or bright regions become easier to distinguish."],
      ["Why do we need histogram equalization?", "We use histogram equalization when an image occupies only a narrow intensity range because poor contrast can hide edges, textures, and regions needed by later computer-vision tasks. Enhancement can improve human interpretation and make feature extraction or segmentation more reliable."],
      ["How does histogram equalization work?", "The algorithm counts pixels at every gray level, normalizes those counts into probabilities, computes their cumulative distribution, and uses that cumulative curve as a lookup table. Each old pixel value is replaced by a new value distributed across the available 0–255 range."],
      ["How does CLAHE work?", "CLAHE divides an image into small tiles, clips histogram peaks at a chosen limit, redistributes the excess, and equalizes each tile before blending neighboring results. Local processing reveals regional detail, while clipping reduces the severe noise amplification that ordinary adaptive equalization can cause."],
      ["Possible real-world application", "A practical application is medical-image enhancement. CLAHE can improve local contrast in an X-ray or retinal image so subtle structures are more visible before a specialist or detection model examines them. Similar enhancement is useful in surveillance, astronomy, and low-light inspection."],
      ["Conclusion", "This activity demonstrated that contrast is determined by the distribution of intensity values, not only by overall brightness. Global equalization improved the full image, while CLAHE handled uneven illumination more carefully. The comparison also showed that enhancement must be controlled because stronger contrast can amplify noise and artifacts."]
    ],
    code: String.raw`import cv2
import matplotlib.pyplot as plt

img = cv2.imread("input.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Linear contrast adjustment
stretched = cv2.convertScaleAbs(gray, alpha=1.25, beta=0)

# Global histogram equalization
global_eq = cv2.equalizeHist(gray)

# Contrast Limited Adaptive Histogram Equalization
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
adaptive_eq = clahe.apply(gray)

images = [gray, stretched, global_eq, adaptive_eq]
titles = ["Original", "Contrast Stretch", "Global Equalization", "CLAHE"]

plt.figure(figsize=(12, 7))
for i, (image, title) in enumerate(zip(images, titles)):
    plt.subplot(2, 4, i + 1)
    plt.imshow(image, cmap="gray", vmin=0, vmax=255)
    plt.title(title)
    plt.axis("off")
    plt.subplot(2, 4, i + 5)
    plt.hist(image.ravel(), 256, [0, 256])
    plt.xlim([0, 256])
plt.tight_layout()
plt.show()`
  },
  "04": {
    title: "Feature Detection",
    activity: "Keypoint Constellation Lab",
    intro: "In this activity, you will examine how local visual landmarks become keypoints, control detector sensitivity, compare two views, and connect SURF descriptors to feature matching, SIFT, and ORB.",
    outcomes: ["Detect keypoints", "Read descriptors", "Match two views"],
    map: [["Detect", "Find strong local intensity changes."], ["Describe", "Encode the neighborhood around each point."], ["Match", "Compare descriptors across two views."], ["Evaluate", "Balance repeatability, speed, and licensing."]],
    results: [["Reference image", "Structured source scene"], ["Detected keypoints", "Scale markers show strong local responses"], ["Feature matches", "Correspondences between transformed views"]],
    controls: `<div class="control-group"><label for="thresholdRange">Hessian-style threshold</label><div class="range-head"><span>Sensitivity</span><output id="thresholdValue">80</output></div><input id="thresholdRange" type="range" min="20" max="180" value="80" /></div><div class="control-group"><label for="pointRange">Maximum keypoints</label><div class="range-head"><span>Limit</span><output id="pointValue">60</output></div><input id="pointRange" type="range" min="20" max="120" step="10" value="60" /></div>`,
    metricLabel: "Repeatable landmarks",
    metricNote: "The browser uses a transparent corner-response approximation; the submitted Python code runs SURF when the installed OpenCV build supports it.",
    guide: {
      example: ["Panorama stitching and visual tracking", "A phone can join overlapping photographs by finding the same window corner, sign, or textured landmark in both views. Those repeatable keypoints also help augmented-reality objects remain attached to a real surface while the camera moves."],
      steps: [["Reveal weak features", "Load the sample, lower the Hessian-style threshold, and raise the maximum keypoint limit."], ["Keep only strong features", "Raise the threshold and compare which markers remain on corners, intersections, and textured regions."], ["Check repeatability", "Trace the match lines and see whether their endpoints represent the same structure in both views."]],
      observations: ["A lower threshold produces more markers, including weak details and possible noise.", "A higher threshold leaves fewer but usually more distinctive landmarks.", "Useful matches should connect corresponding structures rather than unrelated blank or repetitive areas."],
      tip: "If the difference is hard to notice, compare the live keypoint count and focus on marker clusters around sharp corners rather than the entire picture."
    },
    methods: [["Response", "Measure strong two-direction intensity changes."], ["Suppress", "Keep local maxima instead of clustered responses."], ["Describe", "Summarize the pixels around each keypoint."], ["Match", "Connect the nearest compatible descriptors."]],
    answers: [
      ["Effect of the Hessian threshold", "Increasing the Hessian threshold keeps only stronger blob responses, so fewer keypoints are detected and they are usually more distinctive. Lowering it produces more keypoints, including weaker structures and possible noise. The best value balances useful coverage with repeatability."],
      ["Purpose and importance of descriptors", "A SURF descriptor is a numerical summary of the intensity-change pattern around a keypoint. Descriptors let the same local feature be compared across images even when position, scale, or orientation changes, which makes image matching, panorama stitching, tracking, and recognition possible."],
      ["SURF compared with SIFT and ORB", "SURF uses integral images and Hessian-based blob detection and was designed to be faster than SIFT. SIFT is highly distinctive and robust but often more computationally expensive. ORB combines FAST keypoints with binary BRIEF-style descriptors, making it fast, lightweight, and free to use, although it may be less robust under large scale or viewpoint changes."],
      ["Conclusion", "This activity showed that a useful feature is not simply a visually interesting pixel; it must be distinctive and repeatable in another view. Threshold selection changes the number and quality of keypoints, while descriptors provide the evidence needed to match them. The choice among SURF, SIFT, and ORB depends on accuracy, speed, availability, and application constraints."]
    ],
    code: String.raw`import cv2
import numpy as np

img1 = cv2.imread("image1.jpg", cv2.IMREAD_GRAYSCALE)
img2 = cv2.imread("image2.jpg", cv2.IMREAD_GRAYSCALE)
if img1 is None or img2 is None:
    raise FileNotFoundError("Both input images are required")

hessian_threshold = 400
try:
    detector = cv2.xfeatures2d.SURF_create(
        hessianThreshold=hessian_threshold,
        upright=False
    )
    norm = cv2.NORM_L2
    method = "SURF"
except (AttributeError, cv2.error):
    # Free fallback when SURF/nonfree modules are unavailable
    detector = cv2.SIFT_create()
    norm = cv2.NORM_L2
    method = "SIFT fallback"

kp1, des1 = detector.detectAndCompute(img1, None)
kp2, des2 = detector.detectAndCompute(img2, None)

matcher = cv2.BFMatcher(norm)
pairs = matcher.knnMatch(des1, des2, k=2)
good = [m for m, n in pairs if m.distance < 0.75 * n.distance]

keypoint_view = cv2.drawKeypoints(
    img1, kp1, None, (0, 255, 0),
    cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS
)
match_view = cv2.drawMatches(
    img1, kp1, img2, kp2, good[:50], None,
    flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS
)

print(f"Method: {method}")
print(f"Keypoints: {len(kp1)} and {len(kp2)}")
print(f"Good matches: {len(good)}")
cv2.imshow("Keypoints", keypoint_view)
cv2.imshow("Feature matches", match_view)
cv2.waitKey(0)
cv2.destroyAllWindows()`
  },
  "05": {
    title: "PCA & Eigenfaces",
    activity: "Variance Portrait Room",
    intro: "In this activity, you will reduce high-dimensional face images into principal components, inspect eigenface patterns, relate component count to retained variance, and connect PCA projections to SVM recognition.",
    outcomes: ["Reduce dimensions", "Read eigenfaces", "Explain recognition"],
    map: [["Center", "Subtract the training-set mean face."], ["Decompose", "Find orthogonal directions of maximum variance."], ["Project", "Represent faces with component weights."], ["Classify", "Train an SVM in the reduced space."]],
    results: [["Source face", "Synthetic portrait for the browser model"], ["Mean face", "Shared low-frequency facial structure"], ["PCA reconstruction", "Detail increases with component count"], ["Eigenface gallery", "Illustrative variance directions"]],
    controls: `<div class="control-group"><label for="componentRange">Principal components</label><div class="range-head"><span>Components</span><output id="componentValue">50</output></div><input id="componentRange" type="range" min="10" max="150" step="10" value="50" /></div><div class="control-group"><button class="button" type="button" id="nextFaceButton">Try another face</button><p class="control-note">This browser model illustrates reconstruction. The Python workflow performs actual PCA on LFW.</p></div>`,
    metricLabel: "Cumulative variance",
    metricNote: "More components retain more information, but the additional gain gradually becomes smaller.",
    guide: {
      example: ["Face recognition and compact image storage", "A face-unlock system does not need to compare every raw pixel independently. PCA can describe the main variations in faces with a smaller set of component weights, reducing storage and computation before classification."],
      steps: [["Begin with compression", "Set Principal components to 10 and inspect the simplified reconstruction."], ["Restore detail gradually", "Increase the count to 50, 100, and 150 while watching the same eyes, hair, jaw, and shading."], ["Test another subject", "Select Try another face and check whether the same component count preserves different facial details equally well."]],
      observations: ["Few components preserve broad face structure but lose fine edges and texture.", "More components sharpen the reconstruction and raise cumulative explained variance.", "The variance curve eventually flattens, showing diminishing improvement from additional components."],
      tip: "If adjacent settings look similar, compare 10 components directly with 150 and watch the cumulative-variance value rather than relying only on the portrait."
    },
    methods: [["Flatten", "Convert each face into one high-dimensional vector."], ["Center", "Subtract the mean so PCA measures variation."], ["Project", "Keep the strongest orthogonal components."], ["Recognize", "Classify the reduced PCA weights with an SVM."]],
    answers: [
      ["Dimensionality versus variance", "The exact 90% threshold depends on the downloaded LFW subset and split, so it should be calculated from np.argmax(cumulative_variance >= 0.90) + 1 rather than guessed. With 150 requested components, the plotted cumulative curve shows whether the selected representation reaches the target and how quickly later components add diminishing information."],
      ["Visual interpretation of eigenfaces", "The first eigenfaces usually capture broad sources of variation shared across many portraits, such as left-to-right lighting, overall face width, jaw shape, and major eye or hair placement. Components near the end tend to contain finer, localized patterns and noise because the large global variations have already been explained."],
      ["Importance of whitening", "PCA whitening divides each projected component by the square root of its explained variance, producing uncorrelated features with unit variance. This prevents the highest-variance PCA directions from dominating distance and margin calculations, which often helps an SVM learn a more balanced decision boundary."],
      ["Failure analysis", "Eigenface errors are likely when a test face differs from the training examples through strong side lighting, head rotation, expression, occlusion, glasses, or background. PCA models global pixel variation and is sensitive to alignment, so these factors can move a face projection closer to another person even when the identity is clear to a human."],
      ["Why dimensionality reduction matters", "Dimensionality reduction lowers computation and memory use, removes redundant or noisy features, reduces overfitting risk, and makes visualization or classification easier while retaining the most informative structure."],
      ["First versus second principal component", "The first principal component is the direction that explains the greatest variance in the centered data. The second explains the greatest remaining variance while being orthogonal to the first, so it captures a different independent pattern."],
      ["What information may be lost?", "Reducing 1,000 features to 100 components discards low-variance directions. Those directions may contain sensor noise and redundancy, but they can also contain subtle identity details, small textures, accessories, or rare patterns important to a specific prediction."],
      ["PCA for face recognition", "A face is centered and projected onto learned eigenfaces to create a compact vector of component weights. A classifier compares or learns from those vectors instead of using every raw pixel, making recognition faster and less affected by redundant dimensions."],
      ["Why center image features?", "Centering subtracts the training mean so the covariance matrix describes variation around the dataset rather than absolute brightness. Without centering, the first component may mostly represent the mean offset instead of the directions that distinguish images."],
      ["Conclusion", "PCA converts thousands of correlated pixels into a smaller set of orthogonal features ordered by importance. Eigenfaces make those directions visible, while the variance curve exposes the trade-off between compression and retained information. The SVM then performs recognition in a space that is faster and usually less redundant, although alignment and appearance changes still cause failures."]
    ],
    code: String.raw`import time
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import fetch_lfw_people
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import classification_report

lfw = fetch_lfw_people(min_faces_per_person=70, resize=0.4)
n_samples, h, w = lfw.images.shape
X, y = lfw.data, lfw.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

pca = PCA(n_components=150, svd_solver="randomized",
          whiten=True, random_state=42)
t0 = time.time()
X_train_pca = pca.fit_transform(X_train)
X_test_pca = pca.transform(X_test)
print(f"PCA completed in {time.time() - t0:.3f}s")

eigenfaces = pca.components_.reshape((150, h, w))
cumulative = pca.explained_variance_ratio_.cumsum()
components_90 = np.argmax(cumulative >= 0.90) + 1
print(f"Components required for 90% variance: {components_90}")

clf = SVC(kernel="rbf", class_weight="balanced")
clf.fit(X_train_pca, y_train)
y_pred = clf.predict(X_test_pca)
print(classification_report(y_test, y_pred,
                            target_names=lfw.target_names))

plt.plot(np.arange(1, len(cumulative) + 1), cumulative)
plt.axhline(0.90, color="red", linestyle="--")
plt.xlabel("Number of principal components")
plt.ylabel("Cumulative explained variance")
plt.grid(True)
plt.show()

wrong = np.flatnonzero(y_pred != y_test)[:8]
fig, axes = plt.subplots(2, 4, figsize=(10, 5))
for ax, index in zip(axes.ravel(), wrong):
    ax.imshow(X_test[index].reshape(h, w), cmap="gray")
    ax.set_title(f"true: {lfw.target_names[y_test[index]]}\n"
                 f"pred: {lfw.target_names[y_pred[index]]}")
    ax.axis("off")
plt.tight_layout()
plt.show()`
  },
  "06": {
    title: "Object Detection",
    activity: "YOLO11 Detection Deck",
    intro: "In this activity, you will interpret YOLO11 predictions, filter detections by confidence, read normalized bounding-box annotations, organize a custom dataset, and connect inference to training and validation metrics.",
    outcomes: ["Read detections", "Prepare YOLO labels", "Interpret metrics"],
    map: [["Infer", "Predict classes, boxes, and confidence."], ["Annotate", "Store normalized YOLO coordinates."], ["Train", "Fine-tune a model on a custom dataset."], ["Evaluate", "Interpret precision, recall, and validation results."]],
    results: [["Sample scene", "Browser-generated inference scene"], ["YOLO predictions", "Boxes surviving the confidence threshold"], ["YOLO annotations", "Normalized class and box coordinates"], ["Evaluation view", "Illustrative precision and recall trade-off"]],
    controls: `<div class="control-group"><label for="confidenceRange">Confidence threshold</label><div class="range-head"><span>Minimum</span><output id="confidenceValue">0.45</output></div><input id="confidenceRange" type="range" min="25" max="90" value="45" /></div><div class="control-group"><label for="modelSelect">Model scale</label><select id="modelSelect"><option value="n">YOLO11n · fastest</option><option value="s">YOLO11s · balanced</option><option value="m">YOLO11m · stronger</option></select><p class="control-note">The browser uses known sample boxes to teach output interpretation. Run the Python code for actual YOLO11 inference.</p></div>`,
    metricLabel: "Detection summary",
    metricNote: "Raising confidence removes uncertain boxes and often improves precision, but it may lower recall by missing valid objects.",
    guide: {
      example: ["Traffic monitoring and retail inventory", "A road camera can locate every vehicle and pedestrian, while a store camera can count products on a shelf. Both systems need a confidence threshold that balances false alarms against missed objects."],
      steps: [["Favor recall", "Load the sample and lower Confidence threshold to 0.25 so uncertain detections remain visible."], ["Favor precision", "Raise the threshold toward 0.90 and count which labeled boxes disappear."], ["Read the output", "Compare each box label and confidence with the normalized annotation values and evaluation view."]],
      observations: ["Low thresholds retain more boxes but can include incorrect detections.", "High thresholds keep only confident boxes but may miss real objects.", "Each detection answers what the object is, where it is, and how confident the model is."],
      tip: "If the scene appears unchanged, count the boxes and read their confidence labels; threshold effects are often seen as a box disappearing rather than an image-color change."
    },
    methods: [["Predict", "YOLO processes the full image in one inference pass."], ["Filter", "Confidence and non-maximum suppression remove weak duplicates."], ["Annotate", "YOLO labels use normalized center x, center y, width, and height."], ["Validate", "Precision and recall reveal false positives and missed objects."]],
    answers: [
      ["Object detection versus image classification", "Image classification assigns one or more labels to an entire image, while object detection identifies each object and localizes it with a bounding box, class, and confidence. For example, classification may say a street image contains a car; detection can locate three separate cars, a person, and a traffic light and report the position and confidence of each instance."],
      ["Dataset preparation and annotation", "A custom YOLO dataset needs representative images split into training and validation sets. Every image has a matching text file with one row per object in the form class_id, normalized x-center, y-center, width, and height. The data.yaml file then declares image paths, class count, and class names."],
      ["Interpreting evaluation metrics", "Precision measures how many reported detections are correct, while recall measures how many real objects were found. A high confidence threshold can improve precision but reduce recall. Validation loss, precision-recall curves, mAP, and examples of false positives and missed objects should be considered together."],
      ["Conclusion", "This activity connected the visible output of object detection—boxes, labels, and confidence—to the dataset and training process behind it. YOLO differs from classification because it answers both what is present and where each instance is located. Reliable deployment requires careful annotation, representative data, validation, and a threshold suited to the cost of false alarms versus missed objects."]
    ],
    code: String.raw`from ultralytics import YOLO
import cv2

# Part 1: pretrained YOLO11 inference
model = YOLO("yolo11n.pt")
results = model.predict(source=0, conf=0.45, show=True)

# Example YOLO annotation row:
# class_id x_center y_center width height
# 0 0.512 0.483 0.214 0.390

# Part 2: data.yaml
# train: ./dataset/images/train
# val: ./dataset/images/val
# nc: 3
# names: ["person", "car", "bottle"]

# Part 3: custom training
custom_model = YOLO("yolo11n.pt")
custom_model.train(
    data="data.yaml",
    epochs=100,
    imgsz=640,
    batch=16,
    project="runs/detect",
    name="custom_yolo11"
)

# Part 4: validation and new-image inference
best = YOLO("runs/detect/custom_yolo11/weights/best.pt")
metrics = best.val(data="data.yaml")
print("mAP50:", metrics.box.map50)
print("mAP50-95:", metrics.box.map)

new_results = best.predict(
    source="new_image.jpg", conf=0.45, save=True
)
for result in new_results:
    for box in result.boxes:
        print(int(box.cls[0]), float(box.conf[0]), box.xyxy[0].tolist())`
  },
  "07": {
    title: "Image Segmentation",
    activity: "Pixel Territory Atlas",
    intro: "In this activity, you will compare thresholding, region-based grouping, edge-guided masks, and semantic-style pixel labels, then explain which method fits simple objects, textured regions, boundaries, or complete scene understanding.",
    outcomes: ["Build masks", "Compare regions", "Explain semantic labels"],
    map: [["Threshold", "Separate foreground using intensity."], ["Group", "Form regions from pixel similarity."], ["Trace", "Use edges to locate boundaries."], ["Label", "Assign a meaningful class to each pixel."]],
    results: [["Original scene", "Input evidence"], ["Otsu threshold", "Foreground and background mask"], ["Region grouping", "Color-similarity partitions"], ["Edge segmentation", "Gradient-guided boundaries"], ["Semantic-style labels", "Transparent browser color classes"]],
    controls: `<div class="control-group"><label for="biasRange">Threshold bias</label><div class="range-head"><span>Offset</span><output id="biasValue">0</output></div><input id="biasRange" type="range" min="-40" max="40" value="0" /></div><div class="control-group"><label for="clusterRange">Region groups</label><div class="range-head"><span>Clusters</span><output id="clusterValue">4</output></div><input id="clusterRange" type="range" min="2" max="6" value="4" /></div>`,
    metricLabel: "Segmentation reading",
    metricNote: "The semantic-style browser preview uses explainable color rules. The submitted Python workflow shows classical segmentation and where a trained DeepLab or U-Net model belongs.",
    guide: {
      example: ["Road-scene and medical-region mapping", "A self-driving system can label road, vehicle, and pedestrian pixels, while a medical tool can outline a suspected tissue region. Segmentation is useful because it describes an object's exact occupied area, not only a rectangular box."],
      steps: [["Shift the foreground", "Load the sample and move Threshold bias from negative to positive values."], ["Change region detail", "Set Region groups to 2, then increase it to 6 and compare how colors divide the scene."], ["Compare output types", "Follow one object across the threshold, region, edge, and semantic-style cards."]],
      observations: ["Threshold bias changes how many pixels become foreground or background.", "More groups divide the image into finer color regions; too many can fragment one object.", "Edge output shows boundaries, while threshold and region results form filled areas and semantic colors represent meaning."],
      tip: "If the difference seems subtle, choose one object and compare its border and filled area across every result instead of scanning the entire scene."
    },
    methods: [["Threshold", "Classify pixels from global or local intensity."], ["Region", "Group neighboring pixels with similar properties."], ["Edge", "Trace rapid intensity changes into boundaries."], ["Semantic", "Use a trained model to assign a class to every pixel."]],
    answers: [
      ["Thresholding", "Thresholding separates pixels according to intensity. Its advantage is speed and simplicity for high-contrast objects. Its limitation is sensitivity to shadows, uneven illumination, and overlapping foreground/background intensities."],
      ["Region-based segmentation", "Region-based methods grow or divide areas using similarity and connectivity. Their advantage is producing coherent filled regions instead of isolated borders. Their limitation is sensitivity to seed selection, similarity rules, and over-segmentation in textured images."],
      ["Edge-based segmentation", "Edge-based methods detect rapid changes and use them as object boundaries. Their advantage is precise contour localization when edges are clear. Their limitation is that noise creates false edges and weak or broken contours may not form a complete region."],
      ["Semantic segmentation", "Semantic segmentation uses a trained model to label every pixel with a meaningful class such as road, person, or sky. Its advantage is detailed scene understanding in complex images. Its limitation is the need for annotated training data, substantial computation, and possible errors on unfamiliar scenes."],
      ["Comparison and appropriate use", "Thresholding suits simple documents or binary objects; region methods suit connected areas with consistent appearance; edge methods suit clear boundaries; and semantic models suit complex natural scenes where class meaning matters. IoU can compare a predicted mask with ground truth, but qualitative inspection is still important for boundary and class errors."],
      ["Conclusion", "No segmentation method is best for every image. Thresholding is efficient but illumination-sensitive, region grouping creates filled areas but depends on similarity, and edge methods locate boundaries but struggle with noise and gaps. Semantic segmentation offers the richest interpretation but requires trained models and labeled data. Method selection should follow the scene, required output, accuracy metric, and available computation."]
    ],
    code: String.raw`import cv2
import numpy as np

img = cv2.imread("input.jpg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 1. Global Otsu and adaptive thresholding
_, otsu = cv2.threshold(
    gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
)
adaptive = cv2.adaptiveThreshold(
    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY, 21, 5
)

# 2. Watershed region segmentation
kernel = np.ones((3, 3), np.uint8)
opening = cv2.morphologyEx(otsu, cv2.MORPH_OPEN, kernel, iterations=2)
sure_bg = cv2.dilate(opening, kernel, iterations=3)
distance = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
_, sure_fg = cv2.threshold(distance, 0.5 * distance.max(), 255, 0)
unknown = cv2.subtract(sure_bg, np.uint8(sure_fg))
_, markers = cv2.connectedComponents(np.uint8(sure_fg))
markers = markers + 1
markers[unknown == 255] = 0
markers = cv2.watershed(img, markers)
watershed_view = img.copy()
watershed_view[markers == -1] = [0, 0, 255]

# 3. Edge-guided contours
edges = cv2.Canny(gray, 100, 200)
contours, _ = cv2.findContours(
    edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
)
edge_regions = np.zeros_like(img)
cv2.drawContours(edge_regions, contours, -1, (0, 255, 255), 2)

# 4. For semantic segmentation, load a trained DeepLab/U-Net
# model and compare its class mask with ground truth using IoU.

cv2.imshow("Otsu", otsu)
cv2.imshow("Adaptive", adaptive)
cv2.imshow("Watershed", watershed_view)
cv2.imshow("Edge regions", edge_regions)
cv2.waitKey(0)
cv2.destroyAllWindows()`
  }
};

const labId = document.body.dataset.lab;
const config = LABS[labId];
if (!config) throw new Error(`Unknown laboratory: ${labId}`);

const state = { source: null, face: 0, toastTimer: 0, summary: "" };

function renderShell() {
  const resultCards = config.results.map(([title, caption], index) => `<figure class="result-card"><header><span>${String(index + 1).padStart(2, "0")}</span><h3>${title}</h3></header><div class="canvas-frame"><canvas id="result${index}"></canvas></div><figcaption>${caption}</figcaption></figure>`).join("");
  const map = config.map.map(([title, copy], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><strong>${title}</strong><p>${copy}</p></article>`).join("");
  const methods = config.methods.map(([title, copy], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${title}</strong><p>${copy}</p></div></li>`).join("");
  const answers = config.answers.map(([question], index) => `<label>${question}<textarea data-answer="${index}"></textarea></label>`).join("");
  const upload = labId === "05" || labId === "06" ? "" : `<div class="control-group"><label class="button" for="fileInput">Upload your image</label><input id="fileInput" type="file" accept="image/png,image/jpeg,image/webp" /></div>`;
  const guideSteps = config.guide.steps.map(([title, copy], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${title}</strong><p>${copy}</p></div></li>`).join("");
  const guideObservations = config.guide.observations.map((item) => `<li>${item}</li>`).join("");
  const observationGuide = `<section class="observation-guide" aria-labelledby="observation-guide-title"><header class="observation-guide__heading"><div><p class="section-kicker">Real-life connection + observation guide</p><h2 id="observation-guide-title">What should you notice?</h2></div><p>Use this guide immediately after the interactive experiment. Change only one setting at a time so the cause of each visible result is clear.</p></header><div class="observation-guide__grid"><article class="observation-card observation-card--example"><span>Real-life example</span><h3>${config.guide.example[0]}</h3><p>${config.guide.example[1]}</p></article><article class="observation-card"><span>Try this</span><h3>Change → compare → explain</h3><ol>${guideSteps}</ol></article><article class="observation-card"><span>Look for</span><h3>Visible evidence</h3><ul>${guideObservations}</ul></article></div><p class="observation-guide__tip"><strong>Not seeing the change?</strong> ${config.guide.tip}</p></section>`;

  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip-link" href="#workspace">Skip to experiment</a>
    <header class="lab-header">
      <a class="lab-brand" href="../../index.html" aria-label="Return to CVLAB.106 homepage"><svg viewBox="0 0 46 36" aria-hidden="true"><path d="M4 7h17v5H9v17H4V7Z"/><path d="M18 16h6l5 8L40 5h6L29 33 18 16Z"/></svg><span><strong>CVLAB.106</strong><small>PURRCEPTION.sheyn</small></span></a>
      <div class="lab-header__title"><span>Laboratory ${labId}</span><strong>${config.title}</strong></div>
      <div class="lab-header__engine"><i class="engine-dot" aria-hidden="true"></i><span>Browser processor ready</span></div>
      <a class="lab-header__back" href="../../index.html"><span>Back to database</span><b aria-hidden="true">↖</b></a>
    </header>
    <main>
      <section class="lab-hero"><div class="lab-hero__copy"><p class="eyebrow">Laboratory ${labId} · Activity portfolio</p><h1>${config.title}<br/><em>${config.activity}</em></h1><p class="lab-hero__intro">${config.intro}</p><ul class="outcomes">${config.outcomes.map((item) => `<li>${item}</li>`).join("")}</ul></div><div class="lab-hero__art" aria-hidden="true"><div class="hero-orbit"><span>${labId}</span><i></i><i></i><i></i></div></div></section>
      <section class="activity-map" aria-label="Activity workflow">${map}</section>
      <section class="workspace" id="workspace"><header class="section-heading"><div><p class="section-kicker">Interactive experiment</p><h2>Test the method.</h2></div><p>Use the supplied sample first, then adjust one variable at a time. The browser activity is designed for observation; the Python code below is the formal implementation for the laboratory report.</p></header><div class="experiment"><aside class="control-rail">${upload}<div class="control-group"><button class="button button--dark" type="button" id="sampleButton">Load activity sample</button></div>${config.controls}</aside><div class="result-area"><div class="result-grid">${resultCards}</div><div class="metric-panel"><div class="metric-copy"><span class="section-kicker">Live analysis</span><strong id="metricValue">Processing…</strong><p>${config.metricNote}</p></div><canvas id="metricCanvas" width="900" height="260" aria-label="Analysis chart"></canvas></div><div class="workspace-actions"><button class="button" type="button" id="downloadButton">Download horizontal evidence PNG</button></div></div></div></section>
      ${observationGuide}
      <section class="method-section"><div class="method-copy"><p class="section-kicker">Required method</p><h2>From image to evidence.</h2><ol>${methods}</ol></div><div class="code-panel"><header><span>Python implementation</span><button type="button" id="copyCodeButton">Copy code</button></header><pre><code id="pythonCode"></code></pre></div></section>
      <section class="report-section"><div class="report-shell"><div class="report-intro"><div><p class="section-kicker">Completed academic documentation</p><h2>Shaine’s analysis.</h2></div><p><strong>Shaine’s completed answers are displayed below for instructor review.</strong> Select <em>Write your own</em> to enter your responses. You can select <em>Restore Shaine’s answers</em> at any time to return to the original submitted responses.</p></div><div class="answer-grid">${answers}</div><div class="report-actions"><p><strong>The complete PDF includes:</strong> processed evidence, live settings, Python code, and every completed question and answer.</p><div class="report-buttons"><button class="button" type="button" id="visitorButton">Write your own</button><button class="button" type="button" id="restoreButton">Restore Shaine’s answers</button><button class="button button--dark" type="button" id="printButton">Save complete report as PDF ↗</button></div></div></div></section>
    </main>
    <footer class="lab-footer"><div><strong>CVLAB.106 — PURRCEPTION.sheyn</strong><p>Computer Vision Lab Database</p></div><div><span>Laboratory ${labId}</span><strong>${config.title}</strong></div><a href="../../index.html">Return to laboratory index →</a></footer>
    <div class="print-report" id="printReport"><div class="print-cover"><header class="print-head"><div><strong>CVLAB.106 · LAB ${labId}</strong><br/>${config.title}</div><div><strong>BSCS 4A</strong><br/>Macatangay, Shaine</div></header><h1 class="print-title">${config.title}</h1><div class="print-evidence" id="printEvidence"></div><section class="print-section"><h2>Live analysis</h2><p id="printSummary"></p></section><section class="print-section"><h2>Completed questions and answers</h2><div class="print-answers" id="printAnswers"></div></section><section class="print-section"><h2>Python implementation</h2><pre class="print-code" id="printCode"></pre></section></div></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  $("#pythonCode").textContent = config.code;
  $$('[data-answer]').forEach((field) => {
    field.defaultValue = config.answers[Number(field.dataset.answer)][1];
    field.value = field.defaultValue;
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function canvas(width = 900, height = 600) {
  const item = document.createElement("canvas");
  item.width = width;
  item.height = height;
  return item;
}

function copyCanvas(source, target) {
  target.width = source.width;
  target.height = source.height;
  target.getContext("2d").drawImage(source, 0, 0);
}

function makeSample(id) {
  const output = canvas();
  const ctx = output.getContext("2d");
  if (id === "03") {
    const gradient = ctx.createLinearGradient(0, 0, 900, 600);
    gradient.addColorStop(0, "#5f6770"); gradient.addColorStop(1, "#a1a6a8");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 900, 600);
    ctx.fillStyle = "#737b81"; ctx.fillRect(70, 90, 320, 390);
    ctx.fillStyle = "#92989a"; ctx.beginPath(); ctx.arc(620, 275, 155, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#59636a"; ctx.fillRect(525, 390, 260, 80);
    ctx.fillStyle = "rgba(255,255,255,.16)"; for (let i = 0; i < 8; i++) ctx.fillRect(110 + i * 82, 120 + (i % 3) * 120, 48, 48);
  } else if (id === "04") {
    ctx.fillStyle = "#ede8dc"; ctx.fillRect(0, 0, 900, 600);
    ctx.fillStyle = "#242725"; ctx.fillRect(100, 120, 300, 340); ctx.fillStyle = "#61ad54"; ctx.fillRect(140, 170, 80, 90); ctx.fillRect(275, 170, 80, 90); ctx.fillStyle = "#f2bd2f"; ctx.fillRect(210, 330, 90, 130);
    ctx.strokeStyle = "#242725"; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(470, 455); ctx.lineTo(610, 120); ctx.lineTo(790, 455); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#468fc8"; ctx.beginPath(); ctx.arc(630, 300, 74, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#db5c2d"; for (let y = 75; y < 540; y += 105) for (let x = 45; x < 860; x += 135) ctx.fillRect(x, y, 16, 16);
  } else if (id === "06") {
    ctx.fillStyle = "#b9d7ec"; ctx.fillRect(0, 0, 900, 330); ctx.fillStyle = "#777d78"; ctx.fillRect(0, 330, 900, 270);
    ctx.fillStyle = "#f0bd3f"; ctx.fillRect(0, 455, 900, 18);
    ctx.fillStyle = "#db5c2d"; ctx.fillRect(340, 300, 280, 155); ctx.fillStyle = "#171716"; ctx.beginPath(); ctx.arc(405, 455, 38, 0, 7); ctx.arc(555, 455, 38, 0, 7); ctx.fill();
    ctx.fillStyle = "#252927"; ctx.beginPath(); ctx.arc(180, 190, 48, 0, 7); ctx.fill(); ctx.fillRect(135, 235, 90, 210); ctx.fillStyle = "#f3efe7"; ctx.fillRect(158, 255, 44, 80);
    ctx.fillStyle = "#61ad54"; ctx.fillRect(710, 310, 68, 138); ctx.fillStyle = "#f3efe7"; ctx.fillRect(724, 280, 40, 45);
  } else if (id === "07") {
    const sky = ctx.createLinearGradient(0, 0, 0, 340); sky.addColorStop(0, "#6eb7dc"); sky.addColorStop(1, "#d7edf2"); ctx.fillStyle = sky; ctx.fillRect(0, 0, 900, 360);
    ctx.fillStyle = "#5f9c55"; ctx.fillRect(0, 330, 900, 270); ctx.fillStyle = "#315d35"; ctx.beginPath(); ctx.arc(170, 300, 135, 0, 7); ctx.arc(760, 280, 160, 0, 7); ctx.fill();
    ctx.fillStyle = "#ead5b0"; ctx.fillRect(350, 205, 260, 270); ctx.fillStyle = "#9b4b36"; ctx.beginPath(); ctx.moveTo(320, 220); ctx.lineTo(480, 90); ctx.lineTo(640, 220); ctx.fill(); ctx.fillStyle = "#303a42"; ctx.fillRect(445, 340, 70, 135);
    ctx.fillStyle = "#e4b12f"; ctx.beginPath(); ctx.arc(690, 470, 62, 0, 7); ctx.fill();
  }
  return output;
}

function grayImageData(source) {
  const ctx = source.getContext("2d");
  const data = ctx.getImageData(0, 0, source.width, source.height);
  const gray = new Uint8ClampedArray(source.width * source.height);
  for (let i = 0, p = 0; i < data.data.length; i += 4, p++) gray[p] = Math.round(.299 * data.data[i] + .587 * data.data[i + 1] + .114 * data.data[i + 2]);
  return gray;
}

function putGray(values, width, height, target, colorizer = null) {
  target.width = width; target.height = height;
  const ctx = target.getContext("2d");
  const image = ctx.createImageData(width, height);
  for (let p = 0, i = 0; p < values.length; p++, i += 4) {
    const color = colorizer ? colorizer(values[p], p) : [values[p], values[p], values[p]];
    image.data[i] = color[0]; image.data[i + 1] = color[1]; image.data[i + 2] = color[2]; image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function histogram(values) { const bins = new Uint32Array(256); values.forEach((v) => bins[v]++); return bins; }
function equalize(values) {
  const hist = histogram(values); const cdf = new Uint32Array(256); let sum = 0; let first = 0;
  for (let i = 0; i < 256; i++) { sum += hist[i]; cdf[i] = sum; if (!first && hist[i]) first = sum; }
  const denominator = Math.max(1, values.length - first);
  return Uint8ClampedArray.from(values, (v) => clamp(Math.round((cdf[v] - first) * 255 / denominator)));
}

function adaptiveEqualize(values, width, height, divisions) {
  const output = new Uint8ClampedArray(values.length); const tileW = Math.ceil(width / divisions); const tileH = Math.ceil(height / divisions);
  for (let ty = 0; ty < divisions; ty++) for (let tx = 0; tx < divisions; tx++) {
    const x0 = tx * tileW, y0 = ty * tileH, x1 = Math.min(width, x0 + tileW), y1 = Math.min(height, y0 + tileH); const tile = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) tile.push(values[y * width + x]);
    const mapped = equalize(tile); let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) output[y * width + x] = mapped[n++];
  }
  return output;
}

function drawLinesChart(series, colors, marker = null) {
  const chart = $("#metricCanvas"), ctx = chart.getContext("2d"); ctx.clearRect(0, 0, chart.width, chart.height); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, chart.width, chart.height);
  ctx.strokeStyle = "#d5d0c8"; ctx.lineWidth = 1; for (let y = 40; y < chart.height; y += 55) { ctx.beginPath(); ctx.moveTo(45, y); ctx.lineTo(chart.width - 20, y); ctx.stroke(); }
  const maximum = Math.max(1, ...series.flatMap((values) => [...values]));
  series.forEach((values, index) => { ctx.strokeStyle = colors[index]; ctx.lineWidth = 3; ctx.beginPath(); values.forEach((value, x) => { const px = 45 + x * (chart.width - 70) / (values.length - 1); const py = chart.height - 25 - value / maximum * (chart.height - 55); if (!x) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.stroke(); });
  if (marker !== null) { const x = 45 + marker * (chart.width - 70) / 150; ctx.strokeStyle = "#171716"; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, chart.height - 18); ctx.stroke(); ctx.setLineDash([]); }
}

function process03() {
  const width = state.source.width, height = state.source.height, gray = grayImageData(state.source); const factor = Number($("#contrastRange").value) / 100; const divisions = Number($("#tileRange").value);
  $("#contrastValue").textContent = `${factor.toFixed(2)}×`; $("#tileValue").textContent = `${divisions} × ${divisions}`;
  const stretched = Uint8ClampedArray.from(gray, (v) => clamp((v - 128) * factor + 128)); const global = equalize(gray); const adaptive = adaptiveEqualize(gray, width, height, divisions);
  [gray, stretched, global, adaptive].forEach((values, i) => putGray(values, width, height, $(`#result${i}`)));
  const hists = [gray, global, adaptive].map(histogram); drawLinesChart(hists, ["#68635c", "#db5c2d", "#468fc8"]);
  const spread = (values) => { const mean = values.reduce((a, b) => a + b, 0) / values.length; return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length); };
  const before = spread(gray), after = spread(adaptive); state.summary = `Original intensity standard deviation: ${before.toFixed(1)}. Adaptive result: ${after.toFixed(1)} using a ${divisions} × ${divisions} tile grid and ${factor.toFixed(2)}× linear contrast.`; $("#metricValue").textContent = `${before.toFixed(1)} → ${after.toFixed(1)} spread`;
}

function detectPoints(source, threshold, maximum) {
  const gray = grayImageData(source), width = source.width, height = source.height, candidates = [];
  for (let y = 3; y < height - 3; y += 4) for (let x = 3; x < width - 3; x += 4) { const p = y * width + x; const gx = gray[p + 1] - gray[p - 1], gy = gray[p + width] - gray[p - width]; const d1 = gray[p + width + 1] - gray[p - width - 1], d2 = gray[p + width - 1] - gray[p - width + 1]; const score = Math.abs(gx * gy) + Math.abs(d1 * d2); if (score > threshold * threshold) candidates.push({ x, y, score }); }
  candidates.sort((a, b) => b.score - a.score); const points = [];
  for (const candidate of candidates) { if (points.every((point) => (point.x - candidate.x) ** 2 + (point.y - candidate.y) ** 2 > 18 ** 2)) points.push(candidate); if (points.length >= maximum) break; }
  return points;
}

function process04() {
  const threshold = Number($("#thresholdRange").value), maximum = Number($("#pointRange").value); $("#thresholdValue").textContent = threshold; $("#pointValue").textContent = maximum;
  const transformed = canvas(state.source.width, state.source.height), tctx = transformed.getContext("2d"); tctx.fillStyle = "#ede8dc"; tctx.fillRect(0, 0, transformed.width, transformed.height); tctx.save(); tctx.translate(22, 12); tctx.rotate(.018); tctx.drawImage(state.source, 0, 0); tctx.restore();
  const pointsA = detectPoints(state.source, threshold, maximum), pointsB = detectPoints(transformed, threshold, maximum); copyCanvas(state.source, $("#result0")); copyCanvas(state.source, $("#result1"));
  const keyCtx = $("#result1").getContext("2d"); pointsA.forEach((point, index) => { keyCtx.strokeStyle = index % 2 ? "#61ad54" : "#db5c2d"; keyCtx.lineWidth = 3; keyCtx.beginPath(); keyCtx.arc(point.x, point.y, 8 + Math.min(12, point.score / 9000), 0, Math.PI * 2); keyCtx.stroke(); });
  const match = $("#result2"), mctx = match.getContext("2d"); match.width = state.source.width * 2; match.height = state.source.height; mctx.drawImage(state.source, 0, 0); mctx.drawImage(transformed, state.source.width, 0); const count = Math.min(pointsA.length, pointsB.length, 35);
  for (let i = 0; i < count; i++) { const a = pointsA[i], b = pointsB.reduce((best, point) => Math.hypot(point.x - (a.x + 22), point.y - (a.y + 12)) < Math.hypot(best.x - (a.x + 22), best.y - (a.y + 12)) ? point : best, pointsB[0]); mctx.strokeStyle = `hsl(${i * 47 % 360} 70% 45%)`; mctx.lineWidth = 2; mctx.beginPath(); mctx.moveTo(a.x, a.y); mctx.lineTo(state.source.width + b.x, b.y); mctx.stroke(); }
  drawLinesChart([[pointsA.length, pointsB.length, count]], ["#61ad54"]); state.summary = `${pointsA.length} reference keypoints and ${pointsB.length} transformed-view keypoints were retained at threshold ${threshold}; ${count} illustrative correspondences are shown.`; $("#metricValue").textContent = `${pointsA.length} keypoints · ${count} matches`;
}

function drawFace(target, variant, detail = 1, mean = false) {
  target.width = 640; target.height = 640; const ctx = target.getContext("2d"); ctx.fillStyle = mean ? "#b9acbd" : ["#cdbce3", "#c9a786", "#9fb7c9", "#d0b199"][variant % 4]; ctx.fillRect(0, 0, 640, 640);
  ctx.fillStyle = mean ? "#aaa0ad" : ["#e0bb99", "#b97f62", "#d7ae8c", "#8f604e"][variant % 4]; ctx.beginPath(); ctx.ellipse(320, 320, 190, 245, 0, 0, Math.PI * 2); ctx.fill();
  if (detail > .18) { ctx.fillStyle = "#282527"; ctx.beginPath(); ctx.ellipse(245 + variant * 4, 275, 28, 17, 0, 0, 7); ctx.ellipse(395 - variant * 3, 275, 28, 17, 0, 0, 7); ctx.fill(); }
  if (detail > .35) { ctx.strokeStyle = "#5f3a31"; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(320, 290); ctx.lineTo(302 + variant * 3, 385); ctx.lineTo(340, 390); ctx.stroke(); }
  if (detail > .55) { ctx.strokeStyle = "#6e3438"; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(320, 410, 82, .25, Math.PI - .25); ctx.stroke(); }
  if (detail > .72) { ctx.fillStyle = "#29252a"; ctx.beginPath(); ctx.arc(320, 130, 185, Math.PI, 0); ctx.lineTo(505, 225); ctx.quadraticCurveTo(320, 105, 135, 225); ctx.fill(); }
  if (detail > .88) { ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(150, 350); ctx.lineTo(500, 210); ctx.stroke(); }
}

function drawEigenfaces(target) { target.width = 640; target.height = 640; const ctx = target.getContext("2d"); ctx.fillStyle = "#201c25"; ctx.fillRect(0, 0, 640, 640); for (let i = 0; i < 12; i++) { const x = 18 + (i % 4) * 156, y = 18 + Math.floor(i / 4) * 204; ctx.fillStyle = `hsl(${265 + i * 3} 18% ${28 + i * 2}%)`; ctx.fillRect(x, y, 140, 188); ctx.strokeStyle = i % 2 ? "#cdbce3" : "#8b6eb8"; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(x + 70, y + 92, 48 + (i % 3) * 4, 70, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 40, y + 72 + i); ctx.lineTo(x + 100, y + 72 - i); ctx.moveTo(x + 70, y + 60); ctx.lineTo(x + 70 + (i - 6), y + 130); ctx.stroke(); } }

function process05() {
  const components = Number($("#componentRange").value); $("#componentValue").textContent = components; drawFace($("#result0"), state.face, 1); drawFace($("#result1"), 0, .28, true); drawFace($("#result2"), state.face, components / 150); drawEigenfaces($("#result3"));
  const curve = Array.from({ length: 151 }, (_, n) => 1 - Math.exp(-n / 42)); drawLinesChart([curve], ["#8b6eb8"], components); const retained = curve[components] * 100; state.summary = `${components} components retain approximately ${retained.toFixed(1)}% in this illustrative curve. The exact LFW value must be calculated from pca.explained_variance_ratio_.cumsum().`; $("#metricValue").textContent = `${retained.toFixed(1)}% illustrative variance`;
}

const detections = [{ label: "person", confidence: .94, x: 118, y: 135, w: 125, h: 325, color: "#f2bd2f" }, { label: "car", confidence: .88, x: 318, y: 275, w: 325, h: 215, color: "#db5c2d" }, { label: "bottle", confidence: .71, x: 698, y: 260, w: 92, h: 210, color: "#61ad54" }, { label: "traffic light", confidence: .39, x: 805, y: 110, w: 48, h: 130, color: "#8b6eb8" }];
function drawBoxes(target, threshold) { copyCanvas(state.source, target); const ctx = target.getContext("2d"), visible = detections.filter((d) => d.confidence >= threshold); visible.forEach((d) => { ctx.strokeStyle = d.color; ctx.lineWidth = 6; ctx.strokeRect(d.x, d.y, d.w, d.h); ctx.font = "700 24px Arial"; const text = `${d.label} ${d.confidence.toFixed(2)}`; const width = ctx.measureText(text).width + 20; ctx.fillStyle = d.color; ctx.fillRect(d.x, d.y - 35, width, 35); ctx.fillStyle = "#171716"; ctx.fillText(text, d.x + 10, d.y - 9); }); return visible; }
function process06() {
  const threshold = Number($("#confidenceRange").value) / 100, model = $("#modelSelect").value; $("#confidenceValue").textContent = threshold.toFixed(2); copyCanvas(state.source, $("#result0")); const visible = drawBoxes($("#result1"), threshold);
  const annotations = $("#result2"), actx = annotations.getContext("2d"); annotations.width = 900; annotations.height = 600; actx.fillStyle = "#202321"; actx.fillRect(0, 0, 900, 600); actx.fillStyle = "#f3efe7"; actx.font = "700 30px Consolas"; actx.fillText("data.yaml · normalized labels", 45, 65); actx.font = "23px Consolas"; visible.forEach((d, i) => { const normalized = `${i} ${((d.x + d.w/2)/900).toFixed(3)} ${((d.y+d.h/2)/600).toFixed(3)} ${(d.w/900).toFixed(3)} ${(d.h/600).toFixed(3)}  # ${d.label}`; actx.fillStyle = d.color; actx.fillText(normalized, 45, 125 + i * 62); });
  const evalCanvas = $("#result3"), ectx = evalCanvas.getContext("2d"); evalCanvas.width = 900; evalCanvas.height = 600; ectx.fillStyle = "#fff"; ectx.fillRect(0,0,900,600); ectx.strokeStyle = "#d7d1c7"; for(let y=80;y<560;y+=80){ectx.beginPath();ectx.moveTo(80,y);ectx.lineTo(850,y);ectx.stroke();} ectx.strokeStyle="#468fc8";ectx.lineWidth=8;ectx.beginPath();for(let i=0;i<=100;i++){const x=80+i*7.7,y=520-400*Math.sqrt(i/100);if(!i)ectx.moveTo(x,y);else ectx.lineTo(x,y);}ectx.stroke();ectx.fillStyle="#171716";ectx.font="700 28px Arial";ectx.fillText("Illustrative precision–recall curve",80,55);
  drawLinesChart([[.78,.84,.89,.93],[.95,.88,.76,.61]], ["#468fc8","#db5c2d"]); const fps = {n:48,s:31,m:19}[model]; state.summary = `${visible.length} of ${detections.length} sample detections remain at confidence ${threshold.toFixed(2)}. Selected model: YOLO11${model}; illustrative throughput ${fps} FPS.`; $("#metricValue").textContent = `${visible.length} detections · ~${fps} FPS`;
}

function otsu(values) { const hist = histogram(values), total = values.length; let sum = 0; for(let i=0;i<256;i++) sum += i*hist[i]; let sumB=0,wB=0,best=0,max=0; for(let t=0;t<256;t++){wB+=hist[t];if(!wB)continue;const wF=total-wB;if(!wF)break;sumB+=t*hist[t];const mB=sumB/wB,mF=(sum-sumB)/wF,between=wB*wF*(mB-mF)**2;if(between>max){max=between;best=t;}} return best; }
function process07() {
  copyCanvas(state.source,$("#result0")); const width=state.source.width,height=state.source.height,gray=grayImageData(state.source),bias=Number($("#biasRange").value),clusters=Number($("#clusterRange").value); $("#biasValue").textContent=bias; $("#clusterValue").textContent=clusters; const threshold=clamp(otsu(gray)+bias),binary=Uint8ClampedArray.from(gray,v=>v>=threshold?255:0); putGray(binary,width,height,$("#result1"));
  const sourceData=state.source.getContext("2d").getImageData(0,0,width,height),region=$("#result2"),rctx=region.getContext("2d");region.width=width;region.height=height;const rd=rctx.createImageData(width,height);for(let i=0;i<sourceData.data.length;i+=4){const lum=.299*sourceData.data[i]+.587*sourceData.data[i+1]+.114*sourceData.data[i+2],level=Math.round(lum/255*(clusters-1))/(clusters-1);rd.data[i]=40+190*level;rd.data[i+1]=80+130*level;rd.data[i+2]=120+90*level;rd.data[i+3]=255;}rctx.putImageData(rd,0,0);
  const edges=new Uint8ClampedArray(gray.length);let edgeCount=0;for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const p=y*width+x,gx=gray[p+1]-gray[p-1],gy=gray[p+width]-gray[p-width],value=Math.hypot(gx,gy)>55?255:0;edges[p]=value;if(value)edgeCount++;}putGray(edges,width,height,$("#result3"),(v)=>v?[66,169,154]:[20,24,23]);
  const semantic=$("#result4"),sctx=semantic.getContext("2d");semantic.width=width;semantic.height=height;const sd=sctx.createImageData(width,height);const palette=[[70,143,200],[97,173,84],[219,92,45],[242,189,47],[80,84,82]];for(let i=0;i<sourceData.data.length;i+=4){const r=sourceData.data[i],g=sourceData.data[i+1],b=sourceData.data[i+2];const c=b>r*1.1&&b>g*.95?0:g>r*1.08?1:r>g*1.2?2:r>150&&g>120&&b<120?3:4;sd.data[i]=palette[c][0];sd.data[i+1]=palette[c][1];sd.data[i+2]=palette[c][2];sd.data[i+3]=255;}sctx.putImageData(sd,0,0);
  const foreground=binary.reduce((n,v)=>n+(v===255),0)/binary.length*100,edgeDensity=edgeCount/gray.length*100;drawLinesChart([[foreground,100-foreground,edgeDensity,clusters*10]],["#42a99a"]);state.summary=`Otsu threshold ${threshold} produces ${foreground.toFixed(1)}% foreground coverage. Edge density is ${edgeDensity.toFixed(1)}%, and region grouping uses ${clusters} intensity clusters.`;$("#metricValue").textContent=`${foreground.toFixed(1)}% foreground · ${edgeDensity.toFixed(1)}% edges`;
}

function process() { if (!state.source && labId !== "05") return; ({"03":process03,"04":process04,"05":process05,"06":process06,"07":process07})[labId](); }

function loadSample() { state.source = makeSample(labId === "05" ? "04" : labId); process(); showToast("Activity sample loaded."); }
function loadFile(file) { if(!file?.type.startsWith("image/")){showToast("Choose a JPG, PNG, or WEBP image.");return;} const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{const scale=Math.min(1,1200/Math.max(image.naturalWidth,image.naturalHeight)),out=canvas(Math.round(image.naturalWidth*scale),Math.round(image.naturalHeight*scale));out.getContext("2d").drawImage(image,0,0,out.width,out.height);state.source=out;URL.revokeObjectURL(url);process();showToast("Your image is ready for analysis.");};image.onerror=()=>{URL.revokeObjectURL(url);showToast("That image could not be loaded.");};image.src=url;}

function downloadEvidence() {
  const results=config.results.map((_,i)=>$(`#result${i}`)),output=canvas(3840,1080),ctx=output.getContext("2d"),gap=18,pad=55,cardWidth=(3840-pad*2-gap*(results.length-1))/results.length;ctx.fillStyle="#171716";ctx.fillRect(0,0,3840,1080);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--accent");ctx.fillRect(0,0,3840,24);ctx.fillStyle="#fff";ctx.font="800 58px Arial";ctx.fillText(`LAB ${labId} · ${config.title.toUpperCase()}`,pad,100);ctx.font="24px Arial";ctx.fillStyle="#ccc";ctx.fillText("CVLAB.106 · PURRCEPTION.sheyn",pad,140);
  results.forEach((source,i)=>{const x=pad+i*(cardWidth+gap),y=180,w=cardWidth,h=820;ctx.fillStyle="#f3efe7";ctx.fillRect(x,y,w,h);ctx.fillStyle="#242624";ctx.fillRect(x+20,y+48,w-40,650);const scale=Math.min((w-40)/source.width,650/source.height),dw=source.width*scale,dh=source.height*scale;ctx.drawImage(source,x+20+(w-40-dw)/2,y+48+(650-dh)/2,dw,dh);ctx.fillStyle="#171716";ctx.font=`800 ${Math.max(24,Math.min(34,cardWidth/13))}px Arial`;ctx.fillText(`${String(i+1).padStart(2,"0")} · ${config.results[i][0].toUpperCase()}`,x+22,y+755,w-44);ctx.fillStyle="#68635c";ctx.font="20px Arial";ctx.fillText(config.results[i][1],x+22,y+800,w-44);});
  output.toBlob((blob)=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`lab${labId}-horizontal-evidence-3840x1080.png`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);showToast("Horizontal evidence PNG downloaded.");},"image/png");
}

function syncPrint() { $("#printEvidence").innerHTML=config.results.map(([title],i)=>`<figure><img src="${$(`#result${i}`).toDataURL("image/png")}" alt="${title}"/><figcaption>${String(i+1).padStart(2,"0")} · ${title}</figcaption></figure>`).join("");$("#printSummary").textContent=state.summary;$("#printAnswers").innerHTML=config.answers.map(([question],i)=>`<article class="print-answer"><h3>${question}</h3><p></p></article>`).join("");$$('.print-answer p').forEach((p,i)=>{p.textContent=$$('[data-answer]')[i].value.trim();});$("#printCode").textContent=config.code;}

function bindEvents() {
  $("#sampleButton").addEventListener("click",()=>{if(labId==="05"){state.face=(state.face+1)%4;process();showToast("A different synthetic face is ready.");}else loadSample();});
  $("#fileInput")?.addEventListener("change",(event)=>loadFile(event.target.files[0]));
  ["contrastRange","tileRange","thresholdRange","pointRange","componentRange","confidenceRange","modelSelect","biasRange","clusterRange"].forEach((id)=>$(`#${id}`)?.addEventListener("input",process));
  $("#nextFaceButton")?.addEventListener("click",()=>{state.face=(state.face+1)%4;process();});
  $("#downloadButton").addEventListener("click",downloadEvidence);
  $("#copyCodeButton").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(config.code);showToast("Python code copied.");}catch{showToast("Select the code and copy it manually.");}});
  $("#visitorButton").addEventListener("click",()=>{$$('[data-answer]').forEach((field)=>{field.value="";});$$('[data-answer]')[0].focus();showToast("Answer fields cleared for your own responses.");});
  $("#restoreButton").addEventListener("click",()=>{$$('[data-answer]').forEach((field)=>{field.value=field.defaultValue;});showToast("Shaine’s completed answers were restored.");});
  $("#printButton").addEventListener("click",()=>{syncPrint();requestAnimationFrame(()=>window.print());}); window.addEventListener("beforeprint",syncPrint);
}

renderShell();
bindEvents();
try {
  if (labId === "05") process05(); else loadSample();
} catch (error) {
  document.documentElement.dataset.runtimeError = error.message;
  $("#metricValue").textContent = "Processor error";
  $(".metric-copy p").textContent = error.message;
  console.error(error);
}
if (location.hash) window.setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 0);
