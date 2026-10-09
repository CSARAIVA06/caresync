// Ícones em linha (traço 2px, estilo "lucide"), sem dependências externas.
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const FileIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h5" />
  </svg>
);

export const BrainIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

export const NurseIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    <path d="M12 2.5v3M10.5 4h3" />
  </svg>
);

export const ShieldIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const AlertIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m10.29 3.86-8.47 14.14A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const ArrowIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const PencilIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

export const SirenIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M7 18v-6a5 5 0 1 1 10 0v6" />
    <path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1zM21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.93 4.93l.71.71" />
  </svg>
);

export const DatabaseIcon = (p) => (
  <svg {...base} {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0" />
  </svg>
);

export const MenuIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const PulseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
