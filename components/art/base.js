/* Shared frame and palette for the per-module illustrations (components/art/*.js). Server-safe, no hooks. */
export const C = { cyan: "#22d3ee", deep: "#0e7490", lime: "#a3e635", amber: "#fbbf24", rose: "#fb7185", violet: "#a78bfa", ink: "#e8eef8", soft: "#9fb0c7", line: "#2c3d5c", bg: "#0f1522" };
export const MONO = "JetBrains Mono, monospace";

export function Frame({ children, title }) {
  return (
    <svg viewBox="0 0 360 200" role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke={C.cyan} strokeOpacity="0.08" /></pattern>
      </defs>
      <rect width="360" height="200" fill={C.bg} />
      <rect width="360" height="200" fill="url(#g)" />
      {children}
    </svg>
  );
}

/* A small caption along the bottom, like the existing pictures use. */
export function Caption({ text, color = C.soft }) {
  return <text x="180" y="186" fontSize="11" textAnchor="middle" fill={color} fontFamily={MONO} letterSpacing="2">{text}</text>;
}
