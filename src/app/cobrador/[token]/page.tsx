import { BrandLogo } from "@/components/brand-logo";
import { CollectorClient } from "./collector-client";

export const metadata = { title: "Cobrador · Veluxa" };
export const dynamic = "force-dynamic";

export default async function CobradorPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="dark relative flex min-h-dvh flex-col px-4 py-8 text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #1c1917 0%, #0c0a09 45%, #0c0a09 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <BrandLogo forceTheme="dark" size={32} className="text-xl text-[#fafaf9]" />
        </div>
        <CollectorClient token={token} />
        <p className="mt-8 text-center text-xs text-muted-foreground">
          App do cobrador — registre recebimentos em campo. Sem instalação.
        </p>
      </div>
    </div>
  );
}
