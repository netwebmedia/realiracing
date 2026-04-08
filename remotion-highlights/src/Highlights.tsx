import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
} from "remotion";
import { Intro } from "./components/Intro";
import { Outro } from "./components/Outro";
import { VideoClip, ClipConfig } from "./components/VideoClip";

// ─── EDIT YOUR CLIPS HERE ────────────────────────────────────────────────────
//
// Place your video files in: public/videos/
// Then add entries to CLIPS below.
//
// Each clip config:
//   src        - path to your video file (relative to /public)
//   startFrom  - frame offset to start from within the source video (optional)
//   durationInFrames - how many frames to show (at 30fps: 90 = 3 seconds)
//   title      - text label shown on screen (optional)
//   subtitle   - smaller label below title (optional)
//   titlePosition - "top-left" | "bottom-left" | "bottom-right" | "center"
//   playbackRate   - 1 = normal, 2 = 2x speed, 0.5 = slow-mo
//
export const CLIPS: (ClipConfig & { durationInFrames: number })[] = [
  {
    src: "public/videos/clip1.mp4",
    startFrom: 0,
    durationInFrames: 90, // 3 sec
    title: "RACE START",
    subtitle: "Lap 1",
    titlePosition: "bottom-left",
    playbackRate: 1,
  },
  {
    src: "public/videos/clip2.mp4",
    startFrom: 0,
    durationInFrames: 120, // 4 sec
    title: "OVERTAKE",
    subtitle: "Turn 4",
    titlePosition: "bottom-left",
    playbackRate: 1,
  },
  {
    src: "public/videos/clip3.mp4",
    startFrom: 0,
    durationInFrames: 90, // 3 sec
    title: "FASTEST LAP",
    subtitle: "Personal Best",
    titlePosition: "bottom-left",
    playbackRate: 1,
  },
  {
    src: "public/videos/clip4.mp4",
    startFrom: 0,
    durationInFrames: 90, // 3 sec
    title: "FINAL PUSH",
    subtitle: "Last 2 Laps",
    titlePosition: "bottom-left",
    playbackRate: 1,
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_COLOR = "#E8FF00";
const INTRO_DURATION = 60;  // 2 sec at 30fps
const OUTRO_DURATION = 75;  // 2.5 sec at 30fps

interface HighlightsProps {
  raceName?: string;
}

export const Highlights: React.FC<HighlightsProps> = ({
  raceName = "iRacing Highlights",
}) => {
  const { width, height } = useVideoConfig();

  // Build timeline offsets
  let clipOffset = INTRO_DURATION;
  const clipOffsets: number[] = CLIPS.map((clip) => {
    const offset = clipOffset;
    clipOffset += clip.durationInFrames;
    return offset;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_DURATION}>
        <Intro
          channelName="@realiracing"
          raceName={raceName}
          accentColor={ACCENT_COLOR}
        />
      </Sequence>

      {/* Clips */}
      {CLIPS.map((clip, i) => (
        <Sequence
          key={i}
          from={clipOffsets[i]}
          durationInFrames={clip.durationInFrames}
        >
          <VideoClip clip={clip} accentColor={ACCENT_COLOR} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence from={clipOffset} durationInFrames={OUTRO_DURATION}>
        <Outro
          channelName="@realiracing"
          cta="LIKE · SUBSCRIBE · FOLLOW"
          accentColor={ACCENT_COLOR}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// Calculate total duration
export const TOTAL_DURATION =
  INTRO_DURATION +
  CLIPS.reduce((sum, c) => sum + c.durationInFrames, 0) +
  OUTRO_DURATION;
