"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** full = marca + nome | mark = só o símbolo | wordmark = arte completa (escuro) */
  variant?: "full" | "mark" | "wordmark";
  /** Força claro/escuro (ex.: landing sempre escura). Senão segue o tema. */
  forceTheme?: "light" | "dark";
  className?: string;
  /** Altura do símbolo em px (full/mark). */
  size?: number;
};

/**
 * Logo Veluxa com troca automática por tema:
 * - claro → símbolo dourado (fundo claro)
 * - escuro → símbolo circular dourado / wordmark completo
 */
export function BrandLogo({
  variant = "full",
  forceTheme,
  className,
  size = 28,
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = forceTheme
    ? forceTheme === "dark"
    : !mounted
      ? true // padrão do app é dark — evita flash da logo clara
      : resolvedTheme === "dark";

  if (variant === "wordmark") {
    return (
      <Image
        src="/brand/wordmark-dark.png"
        alt="Veluxa"
        width={Math.round(size * 5.2)}
        height={size}
        className={cn("h-auto w-auto object-contain object-left", className)}
        style={{ height: size }}
        priority
      />
    );
  }

  const markSrc = isDark ? "/brand/mark-dark.png" : "/brand/mark-light.png";

  const markClass = isDark
    ? "shrink-0 rounded-full object-cover"
    : "shrink-0 rounded-md object-contain";

  if (variant === "mark") {
    return (
      <Image
        src={markSrc}
        alt="Veluxa"
        width={size}
        height={size}
        className={cn(markClass, className)}
        priority
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={markSrc}
        alt=""
        width={size}
        height={size}
        className={markClass}
        aria-hidden
        priority
      />
      <span className="font-display font-bold tracking-[-0.01em]">Veluxa</span>
    </span>
  );
}
