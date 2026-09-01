import { useId, type CSSProperties } from "react";

interface IconProps {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1a4 4 0 0 0 4 4" />
      <path d="M17 5h3v1a4 4 0 0 1-4 4" />
      <path d="M12 13v3" />
      <path d="M9 20h6" />
      <path d="M10 16h4l.5 4h-5l.5-4Z" />
    </svg>
  );
}

export function MedalIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="m8 3 4 6 4-6" />
      <circle cx="12" cy="15" r="6" />
      <path d="M12 12.5v5M9.8 14.2h4.4" />
    </svg>
  );
}

export function HeartIcon({
  className,
  filled,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      className={className}
      {...base}
      fill={filled ? "currentColor" : "none"}
    >
      <path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.65-9.5 9-9.5 9Z" />
    </svg>
  );
}

export function CommentIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M21 12a8 8 0 0 1-8 8H6l-3 3 .6-4.2A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

export function ScaleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="13" r="4.2" />
      <path d="M12 13 14 10.5" />
      <path d="M9 3v2.5" />
      <path d="M15 3v2.5" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 16 9 10 13 13 20 5" />
      <path d="M14 5h6v6" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </svg>
  );
}

// Payment brand acceptance marks — hand-drawn approximations (not official
// brand assets), in the spirit of the small "we accept" badges every
// checkout page shows. Not pixel-accurate reproductions of the real logos.

export function VisaLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 30">
      <rect width="48" height="30" rx="4" fill="#1a1f71" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="13"
        fill="#ffffff"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 30">
      <rect width="48" height="30" rx="4" fill="#f2f2f2" />
      <circle cx="20" cy="15" r="8.5" fill="#eb001b" />
      <circle cx="28" cy="15" r="8.5" fill="#f79e1b" />
      <path d="M24 8.6a8.47 8.47 0 0 1 0 12.8 8.47 8.47 0 0 1 0-12.8Z" fill="#ff5f00" />
    </svg>
  );
}

export function AmexLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 30">
      <rect width="48" height="30" rx="4" fill="#006fcf" />
      <text
        x="24"
        y="19"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="10"
        fill="#ffffff"
      >
        AMEX
      </text>
    </svg>
  );
}

export function PayPalLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 60 30">
      <rect width="60" height="30" rx="4" fill="#f2f2f2" />
      <text
        x="30"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="800"
        fontStyle="italic"
        fontSize="12"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009cde">Pal</tspan>
      </text>
    </svg>
  );
}

export function ApplePayLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 54 30">
      <rect width="54" height="30" rx="4" fill="#000000" />
      <circle cx="15" cy="14.5" r="4.6" fill="#fff" />
      <circle cx="19.5" cy="12.5" r="3.8" fill="#fff" />
      <path d="M17 8.6c.2-.9.9-1.5.9-1.5" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
      <text
        x="34"
        y="19"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="600"
        fontSize="11"
        fill="#ffffff"
      >
        Pay
      </text>
    </svg>
  );
}

export function GooglePayLogo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 58 30">
      <rect width="58" height="30" rx="4" fill="#f2f2f2" />
      <text
        x="16"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="14"
        fill="#4285f4"
      >
        G
      </text>
      <text
        x="34"
        y="19"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="500"
        fontSize="11"
        fill="#5f6368"
      >
        Pay
      </text>
    </svg>
  );
}

// A "STANDARD BARBELL" 20kg/45lb plate — outer rim, four spokes, a center
// hub with a grip slot, and curved top/bottom labels, like a real plate.
// The body is opaque (not just outlined) so that when several of these are
// stacked with overlap, the one painted later actually covers the one
// behind it, with its dark rim reading as the "cut" between them — rather
// than two wireframes just crossing through each other.
export function PlateIcon({
  className,
  style,
}: IconProps & { style?: CSSProperties }) {
  const uid = useId();
  const topArcId = `${uid}-top`;
  const bottomArcId = `${uid}-bottom`;
  const gradId = `${uid}-grad`;
  const line = "rgba(255,255,255,0.4)";

  return (
    <svg className={className} style={style} viewBox="0 0 100 100">
      <defs>
        <path id={topArcId} d="M16.2,37.7 A36,36 0 0 1 83.8,37.7" />
        <path id={bottomArcId} d="M83.8,62.3 A36,36 0 0 1 16.2,62.3" />
        <radialGradient id={gradId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#4a4d52" />
          <stop offset="60%" stopColor="#212327" />
          <stop offset="100%" stopColor="#0a0b0c" />
        </radialGradient>
      </defs>

      {/* opaque body + dark rim = the "cut" that separates overlapping plates */}
      <circle cx="50" cy="50" r="48" fill={`url(#${gradId})`} stroke="#050506" strokeWidth="3" />

      <circle cx="50" cy="50" r="44.5" fill="none" stroke={line} strokeWidth="1" />
      <circle cx="50" cy="50" r="42.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={line} strokeWidth="1" />

      <line x1="30" y1="30" x2="41.5" y2="41.5" stroke={line} strokeWidth="1.2" />
      <line x1="70" y1="30" x2="58.5" y2="41.5" stroke={line} strokeWidth="1.2" />
      <line x1="30" y1="70" x2="41.5" y2="58.5" stroke={line} strokeWidth="1.2" />
      <line x1="70" y1="70" x2="58.5" y2="58.5" stroke={line} strokeWidth="1.2" />

      <circle cx="50" cy="50" r="15" fill="none" stroke={line} strokeWidth="1.2" />
      <rect x="45.5" y="38.5" width="9" height="6" rx="2" fill="none" stroke={line} strokeWidth="1.2" />
      <circle cx="50" cy="55.5" r="5.6" fill="none" stroke={line} strokeWidth="1.2" />

      <text fontSize="8.5" fontWeight="700" letterSpacing="0.5" fill={line}>
        <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
          STANDARD
        </textPath>
      </text>
      <text fontSize="8.5" fontWeight="700" letterSpacing="0.5" fill={line}>
        <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
          BARBELL
        </textPath>
      </text>

      <text x="26" y="46.5" fontSize="10.5" fontWeight="800" textAnchor="middle" fill={line}>
        45
      </text>
      <text x="26" y="57" fontSize="6.2" fontWeight="700" textAnchor="middle" fill={line}>
        LB.
      </text>
      <text x="74" y="46.5" fontSize="10.5" fontWeight="800" textAnchor="middle" fill={line}>
        20
      </text>
      <text x="74" y="57" fontSize="6.2" fontWeight="700" textAnchor="middle" fill={line}>
        KG
      </text>
    </svg>
  );
}

