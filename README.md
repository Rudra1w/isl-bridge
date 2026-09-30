# ISL Bridge — AI-Based Indian Sign Language ↔ Speech Communication System

ISL Bridge is a client-side web application designed to facilitate real-time, two-way communication between the Deaf/Hard-of-Hearing community and hearing individuals across India.

The application brings together **Continuous Computer Vision**, **Speech Recognition (tuned for Indian English)**, and **ISL-friendly NLP Glossing with Visual Sign Playback**.

---

## 🚀 Key Capabilities

### 1. Live ISL Sign → Text
- Continuous WebRTC webcam video processing.
- Hand landmark extraction using 3D skeletal tracking (21 landmarks per hand via MediaPipe Tasks-Vision).
- Landmark classifier with real-time confidence metrics and temporal smoothing.
- Clearly labeled **Geometric Heuristic Fallback** where a trained deep neural model is not mounted (ensuring no false claims or fake AI recognition).
- Sentence accumulator with text-to-speech (TTS) audio playback, clipboard copy, and word editing.

### 2. Speech → Text
- Native microphone speech capture via the Web Speech API.
- Initial native support for **Indian English (`en-IN`)**, with easy switching to Hindi (`hi-IN`) and international locales.
- Live interim speech transcript rendering with automatic pause finalization.
- Completely isolated from the camera pipeline to avoid audio-video thread locking.

### 3. Text / Speech → ISL
- Converts spoken or typed English sentences into structured Indian Sign Language (ISL) gloss notation.
- Optional **Google Gemini** integration for contextual linguistic grammar transformations (SOV structure, temporal fronting, WH-movement).
- **Zero-Dependency Local Fallback**: When Gemini is unconfigured, disabled, or offline, an authentic algorithmic heuristic takes over.
- Sequenced visual sign player with offline SVGs and two-handed Indian fingerspelling for non-lexical words.
- Variable playback speeds (0.5x, 0.75x, 1x, 1.25x), frame stepping, and token scrubbing.

### 4. Real-Time Two-Way Bridge
- Dual-column unified interface allowing a Deaf individual and a hearing partner to hold an interactive, simultaneous conversation on one screen.

### 5. ISL Lexicon & Dictionary
- Searchable catalog of standard Indian Sign Language gestures and two-handed fingerspelling alphabets (A-Z) with descriptive guides.

---

## 🧠 Linguistic Integrity Note on ISL

> [!IMPORTANT]
> **Indian Sign Language (ISL) is NOT signed English.**
> ISL is a rich, authentic natural visual-spatial language with its own grammar, syntax, spatial references, and non-manual markers (facial expressions, head tilts).
>
> Simply reversing English word order or substituting words one-by-one is linguistically invalid.
> This application treats rule-based ISL gloss generation as an **algorithmic approximation** (fronting time words, dropping copulas/articles, moving question markers to the end, and grouping SOV tokens) and provides an open, modular contract ready for dedicated neural ISL grammar parsers.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide React
- **Computer Vision**: `@mediapipe/tasks-vision` (21 3D Hand Landmarks)
- **Speech Engine**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **NLP / AI Engine**: `@google/generative-ai` (Gemini 2.5 Flash / Pro) with local heuristic fallback
- **State & Storage**: Reactive Observer Pattern + `localStorage` persistence

---

## 📁 Modular Directory Structure

```
src/
├── assets/                  # Static assets and sign graphics
├── components/              # Shared UI components (Navbar, StatusIndicator, SettingsModal, Footer)
├── config/                  # Feature flags and central configuration manager
├── hooks/                   # Custom React hooks (useCamera, useSpeechRecognition, useISLGloss, useISLRecognition)
├── modules/
│   ├── camera/              # WebRTC camera streaming and canvas overlay
│   ├── isl-recognition/     # 3D landmark extraction, classifier interfaces, and geometric heuristic fallback
│   ├── speech/              # Web Speech API engine and microphone input panel
│   ├── nlp/                 # English -> ISL gloss engine (Gemini + rule-based heuristic)
│   └── sign-output/         # Sequenced sign visualizer, asset registry, and player
├── pages/
│   ├── TwoWayPage.tsx       # Flagship simultaneous conversation bridge
│   ├── SignToTextPage.tsx   # Live camera sign-to-text view
│   ├── SpeechToSignPage.tsx # Voice/text-to-sign player view
│   └── DictionaryPage.tsx   # Searchable ISL sign lexicon
├── services/                # Gemini client, history storage, and dictionary services
├── types/                   # Immutable TypeScript interfaces
└── utils/                   # Formatting, debouncing, class merging helpers
```

---

## ⚙️ Configuration & Feature Flags

Modules can be toggled on or off at runtime via the **Settings Modal** (gear icon in the top right) or through `.env`:

| Flag | Default | Description |
|---|---|---|
| `VITE_ENABLE_SIGN_RECOGNITION` | `true` | Enables the webcam vision and gesture recognition pipeline |
| `VITE_ENABLE_SPEECH_RECOGNITION` | `true` | Enables microphone speech capture |
| `VITE_ENABLE_SIGN_OUTPUT` | `true` | Enables the visual sign player and lexicon |
| `VITE_ENABLE_GEMINI` | `true` | Enables the Gemini LLM layer for gloss generation |
| `VITE_GEMINI_API_KEY` | `""` | Optional Google AI Studio API key |
| `VITE_SPEECH_DEFAULT_LOCALE` | `en-IN` | Speech recognition locale (`en-IN`, `hi-IN`, `en-US`) |
| `VITE_VISION_TARGET_FPS` | `30` | Target frame rate for computer vision loop |

---

## 🏃 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- A modern web browser with webcam and microphone access (Chrome, Edge, or Safari recommended for Speech Recognition)

### Installation

1. Clone or open the repository:
   ```bash
   cd "ISL TRANSLATOR"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your `VITE_GEMINI_API_KEY` if you wish to use Gemini for advanced glossing. If left blank, the app runs 100% locally with rule-based heuristics.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🧪 Building & Verification

To verify TypeScript types and build the production bundle:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
