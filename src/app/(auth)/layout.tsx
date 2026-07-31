import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark relative flex min-h-dvh flex-col items-center justify-center bg-[#0c0a09] px-4 py-12 text-[#fafaf9]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 50% at 50% -8%, rgba(231,194,122,0.10), transparent 50%), linear-gradient(180deg, #1c1917 0%, #0c0a09 45%, #0c0a09 100%)",
        }}
        aria-hidden
      />
      <div
        className="landing-grain pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        aria-hidden
      />

      <Link href="/" className="relative mb-9 transition-opacity duration-200 hover:opacity-80">
        <BrandLogo forceTheme="dark" size={38} className="text-3xl text-[#fafaf9]" />
      </Link>
      <div className="relative w-full max-w-md animate-enter">{children}</div>
    </div>
  );
}
