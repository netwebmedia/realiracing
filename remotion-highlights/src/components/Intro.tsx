import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

interface IntroProps {
  channelName?: string;
  raceName?: string;
  accentColor?: string;
}

export const Intro: React.FC<IntroProps> = ({
  channelName = "@realiracing",
  raceName = "iRacing Highlights",
  accentColor = "#E8FF00",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Logo bar slide in from left
  const barX = interpolate(frame, [0, 20], [-width, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });

  // Channel name fade + slide up
  const channelOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const channelY = interpolate(frame, [15, 30], [30, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Race name bounce in
  const raceScale = spring({
    fps,
    frame: frame - 25,
    config: { damping: 12, stiffness: 180, mass: 0.8 },
  });
  const raceOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flash effect on first frame
  const flashOpacity = interpolate(frame, [0, 8], [0.6, 0], {
    extrapolateRight: "clamp",
  });

  const isVertical = height > width;
  const titleSize = isVertical ? 64 : 80;
  const subSize = isVertical ? 32 : 40;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(232,255,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,255,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Accent bar slide */}
      <div
        style={{
          position: "absolute",
          left: barX,
          top: "50%",
          transform: "translateY(-50%)",
          width: "8px",
          height: "60%",
          backgroundColor: accentColor,
          borderRadius: "0 4px 4px 0",
        }}
      />

      {/* Channel name */}
      <div
        style={{
          opacity: channelOpacity,
          transform: `translateY(${channelY}px)`,
          color: accentColor,
          fontSize: subSize,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        {channelName}
      </div>

      {/* Race name */}
      <div
        style={{
          opacity: raceOpacity,
          transform: `scale(${raceScale})`,
          color: "#ffffff",
          fontSize: titleSize,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          textAlign: "center",
          padding: "0 40px",
          lineHeight: 1.1,
        }}
      >
        {raceName}
      </div>

      {/* Flash overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#ffffff",
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
