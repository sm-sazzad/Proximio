import { cn } from "@/lib/utils";

interface ProximoLogoProps {
  className?: string;
  size?: number;
}

/**
 * Proximo radar/sonar wave logo.
 * Three concentric arcs radiating from a center dot — a sonar pulse feel.
 */
export function ProximoLogo({ className, size = 28 }: ProximoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Center dot */}
      <circle cx="8" cy="24" r="2.5" fill="#22D3EE" />
      {/* Inner arc */}
      <path
        d="M12 20a6.5 6.5 0 0 0-6.5-6.5"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Middle arc */}
      <path
        d="M18 14a13 13 0 0 0-13-13"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Outer arc */}
      <path
        d="M24 8A19.5 19.5 0 0 0 4.5 1"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

