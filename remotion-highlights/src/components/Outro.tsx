import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

interface OutroProps {
  channelName?: string;
  cta?: string;
  accentColor?: string;
}

export const Outro: React.FC<OutroProps> = ({
  channelName = "@realiracing",
  cta = "LIKE · SUBSCRIBE · FOLLOW",
  accentColor = "#E8FF00",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Lines expand outward
  const lineScale = interpolate(frame, [10, 40], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaY = interpolate(frame, [30, 50], [20, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isVertical = height > width;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Diagonal speed lines */}
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${lineScale * (width * 1.5)}px`,
            height: "2px",
            backgroundColor: accentColor,
            opacity: 0.15 - Math.abs(i) * 0.02,
            transform: `translate(-50%, calc(-50% + ${i * 60}px)) rotate(-8deg)`,
            transformOrigin: "center",
          }}
        />
      ))}

      {/* Channel logo text */}
      <div
        style={{
          color: "#ffffff",
          fontSize: isVertical ? 80 : 96,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          position: "relative",
          zIndex: 2,
        }}
      >
        {channelName}
      </div>

      {/* Accent underline */}
      <div
        style={{
          width: `${lineScale * (isVertical ? 300 : 500)}px`,
          height: "6px",
          backgroundColor: accentColor,
          borderRadius: "3px",
          marginTop: 12,
          marginBottom: 32,
        }}
      />

      {/* CTA */}
      <div
        style={{
          color: accentColor,
          fontSize: isVertical ? 24 : 28,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 700,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
        }}
      >
        {cta}
      </div>
    </div>
  );
};
