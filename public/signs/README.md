# ISL Bridge — Visual Sign Asset Repository (`public/signs/`)

This directory houses the local visual assets for Indian Sign Language (ISL) communication.

---

## 1. Directory Structure

```
public/signs/
├── images/     # High-resolution static sign graphics (.png, .jpg, .webp)
├── gifs/       # Looping sign demonstration GIFs (.gif)
├── videos/     # Short MP4/WebM sign demonstrations (1-3 seconds, .mp4, .webm)
├── svg/        # Vector graphics with handshape silhouettes (.svg)
└── README.md   # Asset guidelines and contributor documentation
```

---

## 2. Supported Formats & Specifications

| Format | Recommended Specs | Usage |
|---|---|---|
| **Images (.png, .webp)** | 512x512 to 800x800, transparent or dark `#0f172a` background | Static handshapes & postured signs |
| **GIFs (.gif)** | 400x400 to 600x600, 20-30 FPS, loop duration 1.2–2.5s | Short continuous gestures & transitions |
| **Videos (.mp4, .webm)**| H.264 / VP9 codec, 720p (720x720 square or 1280x720), no audio | High-fidelity sign recordings |
| **Vector (.svg)** | 400x400 `viewBox`, self-contained vector glyphs | Fast, offline vector baseline |

---

## 3. How to Add a New Sign

1. **Place the Media File**:
   Drop your asset into the appropriate folder (e.g. `public/signs/images/doctor.png` or `public/signs/videos/hospital.mp4`).

2. **Register the Sign in `src/modules/sign-output/signDictionary.ts`**:
   Add a new entry with metadata:

   ```typescript
   "DOCTOR": {
     type: "image",
     src: "/signs/images/doctor.png",
     label: "DOCTOR",
     category: "medical",
     description: "Touch index and middle finger to wrist (taking pulse).",
     source: "ISL Research & Training Centre (ISLRTC) Standard",
     license: "Creative Commons Attribution 4.0 (CC-BY-4.0)",
     attribution: "ISL Bridge Contributors"
   }
   ```

3. **Verify in Sign Dictionary Viewer**:
   Open the application dashboard and click **"Sign Dictionary"** to preview your new visual sign.

---

## 4. Linguistic Integrity & Verification Guidelines

- **NO Web Image Scraping**: Do **not** scrape search engine results or assign random images to sign tokens. Every visual must represent a verified Indian Sign Language (ISL) sign or clear manual fingerspelling.
- **Attribution**: Always record the linguistic source, author/institution, and licensing terms in `signDictionary.ts`.
- **Missing Signs**: If a sign is not available, ISL Bridge automatically falls back to Indian Sign Language two-hand/single-hand fingerspelling or displays a polite *"Sign asset unavailable"* banner.
