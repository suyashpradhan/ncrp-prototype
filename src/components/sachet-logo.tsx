type SachetLogoProps = {
  compact?: boolean;
};

export function SachetLogo({ compact = false }: SachetLogoProps) {
  return (
    <span className={`sachet-logo${compact ? " sachet-logo-compact" : ""}`} aria-hidden="true">
      <img
        className="sachet-logo-image"
        src="/Sachet%20logo.svg"
        alt=""
        width="238"
        height="90"
      />
    </span>
  );
}
