# Static Model Checkpoint Directory

Place trained TensorFlow.js model files here:
- `model.json`
- `group1-shard1of1.bin` (and any additional binary shard files)
- `labels.json`

When these files are present, `TensorFlowISLRecognizer` automatically loads and executes the neural model in the browser.
If these files are missing, the web application automatically and safely falls back to `ISLDemoHeuristicRecognizer` with full transparency.
