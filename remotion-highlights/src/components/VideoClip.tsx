import React from "react";
import { OffthreadVideo, useVideoConfig, useCurrentFrame, interpolate, Easing } from "remotion";
import { ClipTitle } from "./ClipTitle";

export interface ClipConfig {
  src: string;
  startFrom?: number;   // frame offset into source video
  title?: string;
  subtitle?: string;
  titlePosition?: "top-left" | "bottom-left" | "bottom-right" | "center";
  playbackRate?: number;
}

interface VideoClipProps {
  clip: ClipConfig;
  accentColor?: string;
  transitionDuration?: number; // frames
}

export const VideoClip: React.FC<VideoClipProps> = ({
  clip,
  accentColor = "#E8FF00",
  transitionDuration = 12,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Hard cut flash on entry
  const flashOpacity = interpolate(frame, [0, transitionDuration], [0.5, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });

  // Subtle zoom-in on the clip
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.04], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width, height, position: "relative", overflow: "hidden", backgroundColor: "#000" }}>
      {/* Video */}
      <div style={{ transform: `scale(${zoom})`, transformOrigin: "center", width: "100%", height: "100%" }}>
        <OffthreadVideo
          src={clip.src}
          startFrom={clip.startFrom ?? 0}
          playbackRate={clip.playbackRate ?? 1}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Cut flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#ffffff",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Title overlay */}
      {clip.title && (
        <ClipTitle
          title={clip.title}
          subtitle={clip.subtitle}
          accentColor={accentColor}
          position={clip.titlePosition ?? "bottom-left"}
          showDuration={Math.min(90, durationInFrames - 10)}
        />
      )}
    </div>
  );
};
