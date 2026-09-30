# ISL Bridge — Neural Classifier Training & Data Pipeline

This directory provides the end-to-end machine learning infrastructure for training, evaluating, and exporting custom Indian Sign Language (ISL) classifiers for browser inference via TensorFlow.js.

---

## 📁 Directory Structure

```
training/
├── README.md                     # Training documentation & architecture guide
├── dataset/
│   └── sample_dataset.json       # Example recorded dataset structure
├── preprocessing/
│   └── feature_extraction.py    # Python feature normalization & extraction algorithms
├── scripts/
│   └── train_isl_model.py        # Model training script (Keras / TensorFlow)
└── export/
    └── export_to_tfjs.py         # Converts trained Keras model to TF.js model.json format
```

---

## 🔄 Complete Machine Learning Workflow

```
1. Browser Dataset Collector (Webcam)
   ↓ (Records 21 3D landmarks + labels)
2. dataset.json
   ↓ (Normalized & scale-invariant features)
3. train_isl_model.py (Dense MLP / BiLSTM)
   ↓ (Trained Keras model .h5 / .keras)
4. export_to_tfjs.py (tensorflowjs_converter)
   ↓ (model.json + shard binary)
5. Placed in /public/models/isl-classifier/
   ↓
6. Automatic Browser Inference (Zero Crash / Auto Fallback)
```

---

## 🛠️ Step 1: Collecting Training Samples

Use the **ISL Landmark Recording Tool** built directly into the web application:
1. Open **ISL Bridge** in your browser (`http://localhost:5173`).
2. Start the camera.
3. Click the **Record Dataset** button (`Database` icon) in the camera panel.
4. Enter the sign gloss (e.g., `NAMASTE`, `HELLO`, `WATER`, `FOOD`, `HELP`).
5. Choose **Static (1-frame snapshot)** or **Dynamic (30-frame sequence)**.
6. Record 20–50 samples per sign across different lighting conditions and hand angles.
7. Click **Download Dataset JSON** and save to `training/dataset/isl_dataset.json`.

---

## 🐍 Step 2: Setting Up the Python Environment

Install dependencies:
```bash
pip install tensorflow tensorflowjs numpy scikit-learn
```

---

## 🏋️ Step 3: Train the Model

Run the training script:
```bash
python training/scripts/train_isl_model.py --dataset training/dataset/isl_dataset.json --epochs 50 --output_dir models/saved_model
```

The script:
1. Loads raw 21 3D landmarks from the JSON dataset.
2. Applies **wrist-centered, palm-scale normalization**.
3. Computes the 155-dimensional feature vector (coordinates, fingertip-wrist distances, pairwise finger spreads, dual-hand inter-wrist metrics).
4. Splits into 80% train / 20% validation with stratified sampling.
5. Trains a Multi-Layer Perceptron (MLP) with Batch Normalization and Dropout:
   - Input: `(155,)`
   - Dense(256, ReLU) + Dropout(0.3)
   - Dense(128, ReLU) + Dropout(0.2)
   - Dense(64, ReLU)
   - Dense(num_classes, Softmax)
6. Saves `isl_classifier.h5` and `labels.json`.

---

## 📦 Step 4: Export to TensorFlow.js

Export the trained model directly into the web application's public assets:
```bash
python training/export/export_to_tfjs.py --keras_model models/saved_model/isl_classifier.h5 --labels models/saved_model/labels.json --output_dir public/models/isl-classifier/
```

This generates:
- `public/models/isl-classifier/model.json`
- `public/models/isl-classifier/group1-shard1of1.bin`
- `public/models/isl-classifier/labels.json`

---

## 🚀 Step 5: Live Inference in ISL Bridge

Once the model files are placed in `/public/models/isl-classifier/`:
1. Refresh the web application.
2. The `TensorFlowISLRecognizer` will automatically detect the neural checkpoint.
3. The UI status badge will transition from **"Demo Heuristic Mode"** to **"Active Neural Model"**.
4. Predictions will now execute using your custom neural network!
