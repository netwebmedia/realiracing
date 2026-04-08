import React from "react";
import { Composition } from "remotion";
import { Highlights, TOTAL_DURATION } from "./Highlights";

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── HORIZONTAL: YouTube 16:9 ─────────────────────────── */}
      <Composition
        id="Highlights-16x9"
        component={Highlights}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ raceName: "iRacing Highlights" }}
      />

      {/* ── VERTICAL: Instagram Reels / TikTok 9:16 ─────────── */}
      <Composition
        id="Highlights-9x16"
        component={Highlights}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ raceName: "iRacing Highlights" }}
      />

      {/* ── SQUARE: Instagram Feed 1:1 ───────────────────────── */}
      <Composition
        id="Highlights-1x1"
        component={Highlights}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{ raceName: "iRacing Highlights" }}
      />
    </>
  );
};
