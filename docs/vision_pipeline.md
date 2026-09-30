# Live Camera Computer Vision Pipeline Documentation
**ISL Bridge — Hand Tracking & Landmark Extraction Engine**

---

## 1. Overview & Technology Selection

The vision pipeline leverages **Google MediaPipe Tasks Vision (`@mediapipe/tasks-vision` v0.10.21)**, the modern, actively-supported browser solution for 3D hand skeletal estimation.

Key advantages:
- Client-side execution in WebAssembly (WASM) and WebGL/GPU delegates.
- Zero server dependency, providing 100% user privacy.
- High-fidelity 21 3D spatial points per hand $(x, y, z)$.
- Multi-hand tracking support (concurrent one-hand and two-hand detection).
- Automatic Handedness classification (`Left` vs `Right`).

---

## 2. Architecture & Data Structures

### 2.1 Landmark Normalization Pipeline

To ensure subsequent sign language recognition models are **not overly dependent on camera distance, resolution, or hand positioning**, the pipeline computes two coordinate representations:

1. **Image-Relative Coordinates (`landmarks`)**:
   Normalized to $[0, 1]$ relative to camera viewport dimensions. Used for visual canvas rendering.
2. **Position- & Scale-Invariant Coordinates (`normalizedLandmarks`)**:
   - **Translation**: Translates the wrist landmark $P_0$ to the local coordinate origin $(0, 0, 0)$:
     $$P'_i = (P_i.x - P_0.x, P_i.y - P_0.y, P_i.z - P_0.z)$$
   - **Scale Invariance**: Normalizes by the palm reference length (Euclidean distance between Wrist $P_0$ and Middle Finger MCP $P_9$):
     $$d = \sqrt{(P_9.x - P_0.x)^2 + (P_9.y - P_0.y)^2 + (P_9.z - P_0.z)^2}$$
     $$P''_i = \left(\frac{P'_i.x}{d}, \frac{P'_i.y}{d}, \frac{P'_i.z}{d}\right)$$
   This ensures that hands appearing closer to or farther from the lens produce uniform numerical vectors.

### 2.2 TypeScript Data Contract

```typescript
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
  width: number;
  height: number;
}

export interface HandLandmarks {
  handIndex: number;
  handedness: 'Left' | 'Right';
  landmarks: Point3D[];          // 21 raw image-relative landmarks
  normalizedLandmarks: Point3D[];// 21 wrist-centered, scale-invariant landmarks
  boundingBox: BoundingBox;      // Computed bounding rectangle with 8% padding
  score: number;                 // Detection confidence (0 to 1)
  timestamp: number;             // Epoch millisecond timestamp
}
```

---

## 3. The `useHandTracking()` Hook

Located at [`src/modules/camera/useHandTracking.ts`](file:///c:/Users/rudra/Downloads/ISL%20TRANSLATOR/src/modules/camera/useHandTracking.ts), this custom React hook encapsulates all camera lifecycle management, permission handling, and vision processing:

```typescript
const {
  videoRef,           // RefObject for <video> element
  canvasRef,          // RefObject for <canvas> overlay
  videoElement,       // HTMLVideoElement instance
  landmarks,          // HandLandmarks[] (0, 1, or 2 hands)
  handsDetected,      // Hand count (number)
  handedness,         // Handedness[] ('Left' | 'Right')
  confidence,         // Mean detection confidence (0 to 1)
  fps,                // Measured processing FPS
  isRunning,          // Camera active state (boolean)
  startCamera,        // Function to request permissions & initiate stream
  stopCamera,         // Function to cleanly terminate tracks & loop
  error,              // Human-readable error message or null
  debugMode,          // Debug HUD toggle (boolean)
  setDebugMode,       // (enabled: boolean) => void
  devices,            // Available video input cameras
  selectedDeviceId,   // Active camera device ID
  switchCamera,       // (deviceId: string) => Promise<void>
  isMirrored,         // Horizontal reflection (boolean)
  setIsMirrored,      // (mirrored: boolean) => void
} = useHandTracking();
```

---

## 4. Performance & Memory Optimizations

1. **Monotonically Increasing Timestamp Enforcement**:
   MediaPipe's `detectForVideo()` requires strictly increasing millisecond timestamps. The pipeline tracks `lastProcessedTimestamp` to guarantee every dispatch satisfies $t_{k} > t_{k-1}$, preventing video stutter or unhandled runtime exceptions.
2. **Video Frame Advance Check**:
   Inference is skipped when `video.currentTime === lastVideoTime`, preventing redundant GPU/CPU evaluation when the browser has not rendered a new camera frame.
3. **Throttled State & Telemetry**:
   FPS calculations are aggregated across a 1000ms rolling window to eliminate unnecessary React re-renders on every animation frame.
4. **Clean Resource Teardown**:
   Stopping the camera cancels the `requestAnimationFrame` loop, stops all `MediaStreamTrack` instances, clears canvas memory, and closes the MediaPipe WebGL delegate.

---

## 5. Visual Overlay & Debug Inspector

1. **Skeletal Drawing**:
   - 21 joint nodes rendered with fingertip accents (`#facc15`).
   - 21 skeletal connection bones color-coded by handedness (Indigo for Right Hand `#6366f1`, Emerald for Left Hand `#10b981`).
2. **Bounding Box & Hand Tag**:
   - Renders a dashed bounding box around each detected hand.
   - Displays a floating badge with handedness (`Right Hand` / `Left Hand`) and confidence rating.
3. **Debug Mode (`LandmarkDebugHUD`)**:
   - Toggleable directly via the terminal icon (`>_`) in the Camera panel header.
   - Inspects real-time raw coordinates, scale-invariant $(dX, dY, dZ)$ values, bounding box dimensions, and provides 1-click JSON clipboard export.
