import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProximoLogoProps {
  className?: string;
  size?: number;
}

/**
 * Proximo brand mark.
 * Stylized glowing cyan 'P' monogram with radiating ultrasonic proximity waves.
 */
export function ProximoLogo({ className, size = 28 }: ProximoLogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative rounded-lg overflow-hidden shrink-0 shadow-[0_0_14px_rgba(34,211,238,0.35)] ring-1 ring-accent/30 bg-[#060B16]",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="Proximo Logo"
        width={Math.max(64, size * 2)}
        height={Math.max(64, size * 2)}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  );
}

