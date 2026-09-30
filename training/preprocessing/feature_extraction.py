import numpy as np

def euclidean_distance(p1, p2):
    dx = p1.get('x', 0) - p2.get('x', 0)
    dy = p1.get('y', 0) - p2.get('y', 0)
    dz = p1.get('z', 0) - p2.get('z', 0)
    return float(np.sqrt(dx * dx + dy * dy + dz * dz))

def extract_single_hand_features(hand_dict):
    """
    Extracts 73 features from a single hand dictionary:
    - 63 normalized coordinates (21 keypoints * 3)
    - 5 fingertip-to-wrist distances
    - 5 adjacent fingertip spread distances
    """
    pts = hand_dict.get('normalizedLandmarks') or hand_dict.get('landmarks', [])
    features = []

    # Pad or extract 21 points
    for i in range(21):
        if i < len(pts):
            p = pts[i]
            features.extend([p.get('x', 0.0), p.get('y', 0.0), p.get('z', 0.0)])
        else:
            features.extend([0.0, 0.0, 0.0])

    wrist = pts[0] if len(pts) > 0 else {'x': 0, 'y': 0, 'z': 0}
    tip_indices = [4, 8, 12, 16, 20]

    # 5 fingertip-to-wrist distances
    for tip_idx in tip_indices:
        if tip_idx < len(pts):
            features.append(euclidean_distance(pts[tip_idx], wrist))
        else:
            features.append(0.0)

    # 5 spread distances
    if len(pts) >= 21:
        features.append(euclidean_distance(pts[4], pts[8]))   # Thumb-Index
        features.append(euclidean_distance(pts[8], pts[12]))  # Index-Middle
        features.append(euclidean_distance(pts[12], pts[16])) # Middle-Ring
        features.append(euclidean_distance(pts[16], pts[20])) # Ring-Pinky
        features.append(euclidean_distance(pts[4], pts[20]))  # Thumb-Pinky
    else:
        features.extend([0.0] * 5)

    return features

def extract_frame_features(frame_dict):
    """
    Extracts 155-dimensional feature vector from a single video frame.
    Supports single or dual hand gestures.
    """
    single_hand_dim = 73
    total_dim = single_hand_dim * 2 + 9 # 155
    vector = [0.0] * total_dim

    hands = frame_dict.get('hands', [])
    if not hands:
        return vector

    # Sort dominant hand first (Right, then Left)
    sorted_hands = sorted(hands, key=lambda h: 0 if h.get('handedness') == 'Right' else 1)

    # Hand 1
    h1 = extract_single_hand_features(sorted_hands[0])
    vector[0:len(h1)] = h1

    # Hand 2 (if present)
    if len(sorted_hands) > 1:
        h2 = extract_single_hand_features(sorted_hands[1])
        vector[single_hand_dim:single_hand_dim + len(h2)] = h2

        # Dual hand interactions
        lm1 = sorted_hands[0].get('landmarks', [])
        lm2 = sorted_hands[1].get('landmarks', [])
        if lm1 and lm2:
            w1 = lm1[0]
            w2 = lm2[0]
            offset = single_hand_dim * 2
            vector[offset + 0] = euclidean_distance(w1, w2)
            vector[offset + 1] = w1.get('x', 0) - w2.get('x', 0)
            vector[offset + 2] = w1.get('y', 0) - w2.get('y', 0)
            vector[offset + 3] = w1.get('z', 0) - w2.get('z', 0)

            if len(lm1) > 8 and len(lm2) > 8:
                vector[offset + 4] = euclidean_distance(lm1[8], lm2[8])

            vector[offset + 8] = 1.0 # Two hands active flag

    return vector
