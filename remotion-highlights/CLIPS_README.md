# @realiracing Highlights — Remotion Project

## Quick Start

```bash
npm install
npm run studio       # opens browser preview at localhost:3000
```

## Adding Your Clips

1. Drop your `.mp4` files into `public/videos/`
2. Open `src/Highlights.tsx`
3. Edit the `CLIPS` array at the top of the file:

```ts
export const CLIPS = [
  {
    src: "public/videos/your-clip.mp4",
    startFrom: 0,           // start offset in frames (30fps → 30 = 1 second in)
    durationInFrames: 90,   // how long to show (90 = 3 seconds at 30fps)
    title: "OVERTAKE",      // big text on screen
    subtitle: "Turn 7",     // smaller text below title
    titlePosition: "bottom-left",  // or top-left, bottom-right, center
    playbackRate: 1,        // 2 = 2x speed, 0.5 = slow motion
  },
  // add more clips...
];
```

## Rendering

```bash
npm run render:16x9    # YouTube  (1920×1080)
npm run render:9x16    # Reels/TikTok (1080×1920)
npm run render:1x1     # IG feed  (1080×1080)
npm run render:all     # all three at once
```

Output files land in `out/`.

## Customization

| File | What to edit |
|------|-------------|
| `src/Highlights.tsx` | CLIPS array, intro/outro duration |
| `src/components/Intro.tsx` | Intro animation style |
| `src/components/Outro.tsx` | Outro animation style |
| `src/components/ClipTitle.tsx` | On-screen text styling |
| `src/Root.tsx` | Output resolutions and FPS |

### Colors
The accent color is `#E8FF00` (yellow-green). Search for `ACCENT_COLOR` in `Highlights.tsx` to change it.

## Frame Math (30fps)

| Duration | Frames |
|----------|--------|
| 1 second | 30 |
| 2 seconds | 60 |
| 3 seconds | 90 |
| 4 seconds | 120 |
| 5 seconds | 150 |
