import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8">
        <BrandLogo size={40} className="text-3xl" />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
