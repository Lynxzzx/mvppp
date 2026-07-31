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
    <div className="relative flex min-h-dvh flex-col px-4 py-6 text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in oklab, var(--gold) 18%, transparent), transparent 55%), linear-gradient(180deg, #fafaf9 0%, #f5f5f4 40%, #e7e5e4 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-4 flex justify-center">
          <BrandLogo size={28} className="text-lg" />
        </div>
        <div className="flex flex-1 flex-col rounded-2xl border border-border/70 bg-background/85 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5">
          <PublicChatClient slug={slug} />
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Powered by Veluxa · Em urgências, use o WhatsApp da funerária
        </p>
      </div>
    </div>
  );
}
