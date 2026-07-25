"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CeremonyActions({ id }: { id: string }) {
  const router = useRouter();

  async function setStatus(status: "realizada" | "cancelada") {
    const res = await fetch(`/api/ceremonies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Erro ao atualizar cerimônia");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Marcar como realizada"
        title="Marcar como realizada"
        onClick={() => setStatus("realizada")}
      >
        <Check className="text-sage" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Cancelar cerimônia"
        title="Cancelar cerimônia"
        onClick={() => setStatus("cancelada")}
      >
        <X className="text-destructive" />
      </Button>
    </div>
  );
}
