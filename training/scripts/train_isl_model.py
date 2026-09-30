import json
import argparse
import os
import sys
import numpy as np

# Add parent path to load feature_extraction
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from preprocessing.feature_extraction import extract_frame_features

def build_model(input_dim, num_classes):
    import tensorflow as tf
    from tensorflow.keras import layers, models

    model = models.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.35),

        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.25),

        layers.Dense(64, activation='relu'),
        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model

def main():
    parser = argparse.ArgumentParser(description="Train ISL Neural Sign Classifier")
    parser.add_argument('--dataset', type=str, default='training/dataset/sample_dataset.json', help='Path to recorded dataset JSON')
    parser.add_argument('--epochs', type=int, default=50, help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=16, help='Training batch size')
    parser.add_argument('--output_dir', type=str, default='models/saved_model', help='Output directory for trained model')
    args = parser.parse_args()

    if not os.path.exists(args.dataset):
        print(f"Error: Dataset file not found at {args.dataset}")
        sys.exit(1)

    with open(args.dataset, 'r', encoding='utf-8') as f:
        data = json.load(f)

    samples = data.get('samples', [])
    if not samples:
        print("Error: No samples found in dataset.")
        sys.exit(1)

    # Collect unique classes
    classes = sorted(list(set(s['label'] for s in samples)))
    class_to_idx = {cls: idx for idx, cls in enumerate(classes)}

    X = []
    y = []

    for sample in samples:
        label = sample['label']
        label_idx = class_to_idx[label]
        frames = sample.get('frames', [])

        for frame in frames:
            feat = extract_frame_features(frame)
            X.append(feat)
            y.append(label_idx)

    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int32)

    print(f"Loaded {len(X)} feature vectors across {len(classes)} classes: {classes}")
    print(f"Feature vector dimensionality: {X.shape[1]}")

    os.makedirs(args.output_dir, exist_ok=True)

    # Save labels metadata
    labels_path = os.path.join(args.output_dir, 'labels.json')
    with open(labels_path, 'w', encoding='utf-8') as f:
        json.dump({'classes': classes, 'inputDim': X.shape[1]}, f, indent=2)

    try:
        import tensorflow as tf
        model = build_model(X.shape[1], len(classes))
        model.summary()

        model.fit(
            X, y,
            epochs=args.epochs,
            batch_size=args.batch_size,
            validation_split=0.2 if len(X) > 10 else 0.0,
            shuffle=True
        )

        model_path = os.path.join(args.output_dir, 'isl_classifier.h5')
        model.save(model_path)
        print(f"Model saved successfully to {model_path}")
        print(f"Labels saved to {labels_path}")

    except ImportError:
        print("Notice: TensorFlow is not installed in the current Python environment.")
        print("Install with: pip install tensorflow tensorflowjs")

if __name__ == '__main__':
    main()
