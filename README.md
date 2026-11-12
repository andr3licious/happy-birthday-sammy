# 🎁 Birthday Surprise for Samantha (React.js + Vite)

A modern, responsive, interactive birthday web app built with **React 18** and **Vite**:
1. **Stage 1 — The Ambient Intro ("The Door"):** Floating glass card over an interactive stardust particle canvas.
2. **Stage 2 — Interactive Birthday Cake & Candle:** Tap/click to blow out the candle with rising smoke, chime SFX, and a multi-stage confetti celebration.
3. **Stage 3 — The Interactive Content Hub:**
   - **Mini Vinyl Music Player** with spinning disc (featuring Samantha's photo on the label), equalizer bars, and a Liner Notes modal.
   - **Interactive Scratch-Off Voucher** (`1 Sweet Dessert Date (Ice Cream, Cake, or Whatever You Crave!) on Me 🍨🍰`).
   - **3D Flip Polaroid Gallery** showcasing her favorite snaps (`public/assets/images/`).
   - **Typewriter Birthday Letter** tailored for your 2-month milestone.

---

## 🚀 Quick Start (Development & Build)

```bash
# Install dependencies (already installed)
npm install

# Start the local development server with hot-reload
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview the production build locally
npm run preview
```

To share online, either:
- Drag and drop the generated **`dist/`** folder onto **[Netlify Drop](https://app.netlify.com/drop)**, or
- Connect this repository to **Vercel** / **Netlify** (Build command: `npm run build`, Output directory: `dist`).

---

## ✨ Personalization (`src/config.js`)

All customizable text, photos, music, and voucher details live in a single file: **`src/config.js`**.

| Setting | Key in `src/config.js` |
|---|---|
| Her name & full name | `CONFIG.name`, `CONFIG.fullName` |
| Your signature | `CONFIG.from` |
| Song file, title, artist, liner notes | `CONFIG.song` (place `.mp3` at `public/assets/audio/song.mp3`) |
| Dessert voucher text | `CONFIG.voucher.prize`, `CONFIG.voucher.fine` |
| Polaroid photos & flip captions | `CONFIG.memories[]` (images in `public/assets/images/`) |
| Typewriter birthday letter | `CONFIG.letter` |

---

## 📁 Project Structure

```text
├── public/
│   └── assets/
│       ├── audio/                     # Place song.mp3 here (falls back to Web Audio lullaby)
│       └── images/                    # Samantha's imported photos
├── src/
│   ├── components/
│   │   ├── StardustCanvas.jsx         # Interactive HTML5 particle & shooting-star canvas
│   │   ├── MuteButton.jsx             # Floating mute/unmute toggle
│   │   ├── StageIntro.jsx             # Stage 1: Welcome card ("The Door")
│   │   ├── StageCake.jsx              # Stage 2: CSS birthday cake & candle
│   │   ├── StageHub.jsx               # Stage 3: Gift hub layout
│   │   ├── MusicPlayerCard.jsx        # Spinning vinyl turntable & controls
│   │   ├── ScratchVoucherCard.jsx     # HTML5 canvas scratch-off voucher
│   │   ├── PolaroidGalleryCard.jsx    # 3D flip polaroid photo cards
│   │   ├── TypewriterLetterCard.jsx   # Auto-scrolling typewriter letter
│   │   └── LinerNotesModal.jsx        # Song liner notes dialog
│   ├── styles/
│   │   └── index.css                  # Glassmorphism, responsive grid & animations
│   ├── utils/
│   │   ├── audio.js                   # HTML5 audio + Web Audio synth fallback + useMusic hook
│   │   ├── confetti.js                # canvas-confetti bursts
│   │   └── haptics.js                 # Unified Pointer Events tap hook & vibration helper
│   ├── config.js                      # All personalizable content in one place
│   ├── App.jsx                        # Stage state machine & layout root
│   └── main.jsx                       # React entry point
├── index.html
├── package.json
└── vite.config.js
```
