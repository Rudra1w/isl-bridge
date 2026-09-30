/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_ENABLE_GEMINI?: string;
  readonly VITE_ENABLE_SPEECH_RECOGNITION?: string;
  readonly VITE_ENABLE_SIGN_RECOGNITION?: string;
  readonly VITE_ENABLE_SIGN_OUTPUT?: string;
  readonly VITE_VISION_TARGET_FPS?: string;
  readonly VITE_VISION_CONFIDENCE_THRESHOLD?: string;
  readonly VITE_SPEECH_DEFAULT_LOCALE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
