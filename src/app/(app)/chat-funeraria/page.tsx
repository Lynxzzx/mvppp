import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ChatKbClient } from "./chat-kb-client";

export const metadata = { title: "Chat da minha funerária" };

export default async function ChatFunerariaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <div className="animate-enter mx-auto max-w-3xl">
      <PageHeader
        title="Chat da minha funerária"
        description="Cadastre preços, FAQ e políticas. Gere um link público para famílias conversarem com a IA — com WhatsApp real sempre à mão para urgências."
      />
      <ChatKbClient />
    </div>
  );
}
