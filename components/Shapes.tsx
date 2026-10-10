// The flower, leaf and sun from the brand mockups. Decoration only.
export function Shapes({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 110"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="var(--coral)">
        <circle cx="30" cy="30" r="27" />
        <circle cx="78" cy="30" r="27" />
        <circle cx="30" cy="78" r="27" />
        <circle cx="78" cy="78" r="27" />
        <rect x="30" y="30" width="48" height="48" />
      </g>
      <path d="M112 4 C170 4 184 50 184 96 C132 96 112 62 112 4 Z" fill="var(--accent)" />
      <circle cx="220" cy="42" r="39" fill="var(--sun)" />
      <path d="M184 110 A38 38 0 0 1 260 110 Z" fill="var(--sky)" />
    </svg>
  );
}

// The four-petal flower on its own: the face of the voice guide. Takes its colour from the text colour.
export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 108 108" aria-hidden="true" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" />
      <circle cx="78" cy="30" r="28" />
      <circle cx="30" cy="78" r="28" />
      <circle cx="78" cy="78" r="28" />
      <rect x="30" y="30" width="48" height="48" />
    </svg>
  );
}
