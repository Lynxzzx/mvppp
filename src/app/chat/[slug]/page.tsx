import { BrandLogo } from "@/components/brand-logo";
import { PublicChatClient } from "./public-chat-client";

export const metadata = { title: "Chat · Veluxa" };
export const dynamic = "force-dynamic";

export default async function PublicChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="dark relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#0c0a09] text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 60% at 50% -10%, rgba(231,194,122,0.12), transparent 55%), linear-gradient(180deg, #1c1917 0%, #0c0a09 45%, #0c0a09 100%)",
        }}
        aria-hidden
      />

      {/* Logo sempre visível — fora da área que rola */}
      <header className="relative z-10 flex shrink-0 justify-center px-4 pt-5 pb-3">
        <BrandLogo forceTheme="dark" size={28} className="text-lg text-[#fafaf9]" />
      </header>

      {/* Painel centralizado na viewport */}
      <main className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center px-4 pb-3">
        <div className="flex h-full max-h-[min(680px,calc(100dvh-7.5rem))] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#141210]/95 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5">
          <PublicChatClient slug={slug} />
        </div>
      </main>

      <p className="relative z-10 shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-[11px] text-muted-foreground">
        Powered by Veluxa · Em urgências, use o WhatsApp da funerária
      </p>
    </div>
  );
}
