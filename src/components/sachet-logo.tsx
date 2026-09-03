type SachetLogoProps = {
  compact?: boolean;
};

export function SachetLogo({ compact = false }: SachetLogoProps) {
  return (
    <span className={`sachet-logo${compact ? " sachet-logo-compact" : ""}`} aria-hidden="true">
      <svg
        className="sachet-logo-mark"
        viewBox="0 0 36 36"
        fill="none"
        focusable="false"
      >
        <path d="M7 9.5h16M7 15.5h12M7 21.5h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="m19 23.5 3.4 3.4L30 18.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sachet-logo-wordmark">
        <span className="sachet-logo-hi">सचेत</span>
        <span className="sachet-logo-en">Sachet</span>
      </span>
    </span>
  );
}
