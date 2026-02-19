interface CloudBackgroundProps {
  className?: string;
}

export default function CloudBackground({ className }: CloudBackgroundProps) {
  return (
    <svg viewBox="0 0 200 80" className={className} fill="white" style={{ opacity: 0.15 }} aria-hidden="true">
      <ellipse cx="60" cy="55" rx="55" ry="25" />
      <ellipse cx="110" cy="50" rx="40" ry="22" />
      <ellipse cx="150" cy="55" rx="45" ry="20" />
      <ellipse cx="85" cy="40" rx="35" ry="20" />
      <ellipse cx="130" cy="38" rx="30" ry="18" />
    </svg>
  );
}
