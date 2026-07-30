import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ImportWizard } from "./import-wizard";

export const metadata = { title: "Importar dados" };

export default async function ImportacaoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "financeiro") {
    // financeiro pode importar contratos; página liberada
  }

  return (
    <div className="animate-enter">
      <PageHeader
        title="Começar com sua planilha"
        description="Suba o arquivo que você já usa (CSV do Excel ou Google Sheets). O Veluxa sugere o mapeamento das colunas — você confirma e importa em minutos, sem implantação demorada."
      />
      <ImportWizard role={session.role} />
    </div>
  );
}
