interface SparkleProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function Sparkle({ size = 12, color = "white", className }: SparkleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z" />
    </svg>
  );
}
