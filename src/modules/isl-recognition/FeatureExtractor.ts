import { HandLandmarks, Point3D, HandLandmarkFrame, TemporalSequenceFrame } from '@/types/recognition';

export class FeatureExtractor {
  /**
   * Extracts static feature vector from a single hand.
   * Produces 63 normalized landmark coordinates + 10 geometric finger extension & distance metrics.
   */
  public static extractSingleHandFeatures(hand: HandLandmarks): number[] {
    const pts = hand.normalizedLandmarks || hand.landmarks;
    const features: number[] = [];

    // 1. Normalized (wrist-centered, palm-scaled) coordinates (21 * 3 = 63)
    for (let i = 0; i < 21; i++) {
      const p = pts[i] || { x: 0, y: 0, z: 0 };
      features.push(p.x, p.y, p.z);
    }

    // 2. Fingertip distances to wrist (P0)
    const wrist = pts[0];
    const tipIndices = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
    for (const tipIdx of tipIndices) {
      features.push(this.euclideanDistance(pts[tipIdx], wrist));
    }

    // 3. Adjacent fingertip distances (spread metric)
    features.push(this.euclideanDistance(pts[4], pts[8]));   // Thumb to Index
    features.push(this.euclideanDistance(pts[8], pts[12]));  // Index to Middle
    features.push(this.euclideanDistance(pts[12], pts[16])); // Middle to Ring
    features.push(this.euclideanDistance(pts[16], pts[20])); // Ring to Pinky
    features.push(this.euclideanDistance(pts[4], pts[20]));  // Thumb to Pinky span

    return features;
  }

  /**
   * Extracts static feature vector for a frame (supports 1 or 2 hands).
   * Fixed length output (155 features).
   */
  public static extractFrameFeatures(frame: HandLandmarkFrame): number[] {
    const hands = frame.hands;
    const singleHandDim = 73; // 63 coords + 10 geometric metrics
    const totalDim = singleHandDim * 2 + 9; // Hand1 (73) + Hand2 (73) + 9 dual-hand metrics = 155

    const vector: number[] = new Array(totalDim).fill(0);

    if (hands.length === 0) {
      return vector;
    }

    // Sort hands so primary dominant hand is first (or Right hand first)
    const sortedHands = [...hands].sort((a, b) => {
      if (a.handedness === 'Right' && b.handedness === 'Left') return -1;
      if (a.handedness === 'Left' && b.handedness === 'Right') return 1;
      return a.handIndex - b.handIndex;
    });

    // Populate Hand 1
    const h1Features = this.extractSingleHandFeatures(sortedHands[0]);
    for (let i = 0; i < h1Features.length; i++) {
      vector[i] = h1Features[i];
    }

    // Populate Hand 2 (if present)
    if (sortedHands.length > 1) {
      const h2Features = this.extractSingleHandFeatures(sortedHands[1]);
      for (let i = 0; i < h2Features.length; i++) {
        vector[singleHandDim + i] = h2Features[i];
      }

      // Dual-hand spatial metrics
      const w1 = sortedHands[0].landmarks[0];
      const w2 = sortedHands[1].landmarks[0];
      const offset = singleHandDim * 2;

      vector[offset + 0] = this.euclideanDistance(w1, w2); // Inter-wrist distance
      vector[offset + 1] = w1.x - w2.x;                    // Horizontal separation
      vector[offset + 2] = w1.y - w2.y;                    // Vertical elevation difference
      vector[offset + 3] = (w1.z || 0) - (w2.z || 0);      // Depth separation

      // Fingertip proximity (e.g. index tips touching in two-handed signs)
      const tip1 = sortedHands[0].landmarks[8];
      const tip2 = sortedHands[1].landmarks[8];
      vector[offset + 4] = this.euclideanDistance(tip1, tip2);

      // Bounding box overlaps
      const bb1 = sortedHands[0].boundingBox;
      const bb2 = sortedHands[1].boundingBox;
      if (bb1 && bb2) {
        vector[offset + 5] = Math.abs(bb1.xMin - bb2.xMin);
        vector[offset + 6] = Math.abs(bb1.yMin - bb2.yMin);
        vector[offset + 7] = bb1.width / (bb2.width || 1);
        vector[offset + 8] = 1.0; // Two hands presence flag
      }
    }

    return vector;
  }

  /**
   * Extracts dynamic temporal sequence features across a sliding window of frames.
   * Produces a 2D matrix [windowSize, featuresPerFrame].
   */
  public static extractSequenceFeatures(sequence: TemporalSequenceFrame): number[][] {
    const matrix: number[][] = [];
    for (const frame of sequence.frames) {
      matrix.push(this.extractFrameFeatures(frame));
    }
    return matrix;
  }

  private static euclideanDistance(p1: Point3D, p2: Point3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
