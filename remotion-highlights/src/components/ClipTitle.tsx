import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

interface ClipTitleProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  position?: "top-left" | "bottom-left" | "bottom-right" | "center";
  showDuration?: number; // frames to show before fading
}

export const ClipTitle: React.FC<ClipTitleProps> = ({
  title,
  subtitle,
  accentColor = "#E8FF00",
  position = "bottom-left",
  showDuration = 60,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const slideIn = interpolate(frame, [0, 18], [40, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const fadeIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [showDuration - 15, showDuration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = Math.min(fadeIn, fadeOut);

  const isVertical = height > width;
  const padding = isVertical ? 32 : 40;

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-left": { top: padding, left: padding },
    "bottom-left": { bottom: padding, left: padding },
    "bottom-right": { bottom: padding, right: padding, textAlign: "right" },
    center: {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      textAlign: "center",
    },
  };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        opacity,
        transform:
          position === "center"
            ? "translate(-50%, -50%)"
            : `translateX(${slideIn}px)`,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: "50px",
          height: "5px",
          backgroundColor: accentColor,
          borderRadius: "2px",
          marginBottom: "10px",
        }}
      />

      {/* Title */}
      <div
        style={{
          color: "#ffffff",
          fontSize: isVertical ? 36 : 42,
          fontFamily: "'Arial Black', Arial, sans-serif",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          lineHeight: 1.1,
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          maxWidth: isVertical ? "80vw" : "50vw",
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            color: accentColor,
            fontSize: isVertical ? 20 : 24,
            fontFamily: "Arial, sans-serif",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginTop: 6,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
