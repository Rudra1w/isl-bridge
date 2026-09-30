import argparse
import os
import shutil
import subprocess
import sys

def main():
    parser = argparse.ArgumentParser(description="Export Keras ISL Model to TensorFlow.js format")
    parser.add_argument('--keras_model', type=str, default='models/saved_model/isl_classifier.h5', help='Path to .h5 model')
    parser.add_argument('--labels', type=str, default='models/saved_model/labels.json', help='Path to labels.json')
    parser.add_argument('--output_dir', type=str, default='public/models/isl-classifier', help='Output web directory')
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print(f"Converting {args.keras_model} to TF.js in {args.output_dir}...")

    cmd = [
        "tensorflowjs_converter",
        "--input_format=keras",
        args.keras_model,
        args.output_dir
    ]

    try:
        subprocess.run(cmd, check=True)
        print("TensorFlow.js conversion successful!")

        # Copy labels.json to output directory
        if os.path.exists(args.labels):
            dest_labels = os.path.join(args.output_dir, 'labels.json')
            shutil.copyfile(args.labels, dest_labels)
            print(f"Copied {args.labels} -> {dest_labels}")

        print(f"\nModel ready for browser inference at: {args.output_dir}/model.json")
    except FileNotFoundError:
        print("Error: tensorflowjs_converter not found in PATH.")
        print("Install via: pip install tensorflowjs")
    except subprocess.CalledProcessError as e:
        print(f"Conversion failed with return code {e.returncode}")

if __name__ == '__main__':
    main()
