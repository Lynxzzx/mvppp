"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, MessageCircle, QrCode, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import { WHATSAPP_SALES_URL, type PaidPlan } from "@/lib/plans";

interface Checkout {
  paymentId: string;
  qrCodeBase64: string;
  copyPaste: string;
  amountCents: number;
}

export function SubscribeButton({ plan, planLabel }: { plan: PaidPlan; planLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkout, setCheckout] = useState<Checkout | null>(null);

  async function startCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, payerDocument: f.get("payerDocument") }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro ao gerar cobrança PIX");
      return;
    }
    setCheckout(await res.json());
  }

  async function copyCode() {
    if (!checkout) return;
    await navigator.clipboard.writeText(checkout.copyPaste);
    toast.success("Código PIX copiado");
  }

  async function verifyPayment() {
    if (!checkout) return;
    setChecking(true);
    const res = await fetch("/api/subscription/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: checkout.paymentId }),
    });
    setChecking(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Erro ao verificar pagamento");
      return;
    }
    const { status } = await res.json();
    if (status === "completo") {
      toast.success(`Plano ${planLabel} ativado!`);
      setOpen(false);
      setCheckout(null);
      router.refresh();
    } else if (status === "falha") {
      toast.error("O pagamento falhou ou foi cancelado. Gere um novo PIX.");
      setCheckout(null);
    } else {
      toast.info("Pagamento ainda não identificado. Aguarde alguns segundos após pagar.");
    }
  }

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        <QrCode data-icon="inline-start" /> Assinar {planLabel}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setCheckout(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-medium">
              Assinar plano {planLabel}
            </DialogTitle>
            <DialogDescription>
              Pagamento mensal via PIX, processado pela MisticPay.
            </DialogDescription>
          </DialogHeader>

          {!checkout ? (
            <form onSubmit={startCheckout} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`doc-${plan}`}>CPF/CNPJ do pagador *</Label>
                <Input
                  id={`doc-${plan}`}
                  name="payerDocument"
                  required
                  inputMode="numeric"
                  placeholder="Somente números"
                />
                <p className="text-xs text-muted-foreground">
                  Usado apenas para identificar o pagamento PIX.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Gerando PIX…" : "Gerar QR Code PIX"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="font-mono text-lg">{formatBRL(checkout.amountCents)}</p>
              <img
                src={checkout.qrCodeBase64}
                alt="QR Code PIX para pagamento da assinatura"
                className="mx-auto size-52 rounded-md border bg-white p-2"
              />
              <p className="break-all rounded-md bg-muted px-3 py-2 text-left font-mono text-xs">
                {checkout.copyPaste}
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={copyCode}>
                  <Copy data-icon="inline-start" /> Copiar código
                </Button>
                <Button size="sm" onClick={verifyPayment} disabled={checking}>
                  {checking ? (
                    <RefreshCw data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <Check data-icon="inline-start" />
                  )}
                  Já paguei
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Após o pagamento, a ativação é automática (webhook) — ou clique
                em &quot;Já paguei&quot; para verificar agora.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WhatsAppButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      nativeButton={false}
      render={<a href={WHATSAPP_SALES_URL} target="_blank" rel="noopener noreferrer" />}
    >
      <MessageCircle data-icon="inline-start" /> Falar no WhatsApp
    </Button>
  );
}
