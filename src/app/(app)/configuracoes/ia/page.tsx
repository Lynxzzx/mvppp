import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { AiSettingsClient } from "./ai-settings-client";

export const metadata = { title: "Configurações de IA" };

export default async function AiSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <div className="animate-enter">
      <PageHeader
        title="Inteligência artificial"
        description="Área exclusiva de administradores. O padrão do Veluxa é inclusionai/ling-3.0-flash:free — troque por funcionalidade sem novo deploy."
      />
      <AiSettingsClient />
    </div>
  );
}
