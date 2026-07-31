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
    <div className="dark relative flex min-h-dvh flex-col bg-[#0c0a09] px-4 py-6 text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 60% at 50% -10%, rgba(231,194,122,0.12), transparent 55%), linear-gradient(180deg, #1c1917 0%, #0c0a09 45%, #0c0a09 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-4 flex justify-center">
          <BrandLogo forceTheme="dark" size={28} className="text-lg text-[#fafaf9]" />
        </div>
        <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-[#141210]/90 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5">
          <PublicChatClient slug={slug} />
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Powered by Veluxa · Em urgências, use o WhatsApp da funerária
        </p>
      </div>
    </div>
  );
}
