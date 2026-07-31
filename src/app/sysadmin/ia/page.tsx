import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/platform-admin";
import { PlatformAiSettingsClient } from "./platform-ai-client";

export const metadata = { title: "IA · Sysadmin" };
export const dynamic = "force-dynamic";

export default async function SysadminAiPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/sysadmin/login");

  return (
    <div className="animate-enter mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">OpenRouter / IA</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          Configure a chave da API e o modelo padrão da plataforma. Valores salvos
          aqui têm prioridade sobre as variáveis de ambiente.
        </p>
      </div>
      <PlatformAiSettingsClient />
    </div>
  );
}
