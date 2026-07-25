import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,#f5f0e6_0%,#fafaf9_50%,#fafaf9_100%)]"
        aria-hidden
      />
      <div className="relative mb-9">
        <BrandLogo size={38} className="text-3xl" />
      </div>
      <div className="relative w-full max-w-md animate-enter">{children}</div>
    </div>
  );
}
