/**
 * Cliente da MisticPay (https://docs.misticpay.com/) — gateway PIX.
 * Autenticação por headers `ci` (Client ID) e `cs` (Client Secret).
 */
const BASE_URL = "https://api.misticpay.com/api";

function credentials(): { ci: string; cs: string } | null {
  const ci = process.env.MISTICPAY_CLIENT_ID;
  const cs = process.env.MISTICPAY_CLIENT_SECRET;
  if (!ci || !cs) return null;
  return { ci, cs };
}

export function misticPayConfigured(): boolean {
  return credentials() !== null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const creds = credentials();
  if (!creds) throw new Error("MisticPay não configurada (MISTICPAY_CLIENT_ID/SECRET)");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ci: creds.ci,
      cs: creds.cs,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      `MisticPay ${path} falhou (HTTP ${res.status}): ${body?.message ?? "sem detalhes"}`
    );
  }
  return body as T;
}

export interface PixTransaction {
  transactionId: string;
  qrCodeBase64: string;
  qrcodeUrl?: string;
  copyPaste: string;
  transactionState: string;
}

/** Cria transação PIX (cash-in). `amount` em reais (ex.: 297 = R$ 297,00). */
export async function createPixTransaction(params: {
  amount: number;
  payerName: string;
  payerDocument: string;
  transactionId: string;
  description: string;
  projectWebhook?: string;
}): Promise<PixTransaction> {
  const res = await request<{ message: string; data: PixTransaction }>(
    "/transactions/create",
    { method: "POST", body: JSON.stringify(params) }
  );
  return res.data;
}

export type MisticTransactionState = "PENDENTE" | "COMPLETO" | "FALHA" | "CANCELADO";

/** Consulta o status de uma transação na MisticPay. */
export async function checkTransaction(
  transactionId: string
): Promise<MisticTransactionState> {
  const res = await request<{
    message: string;
    transaction: { transactionState: MisticTransactionState };
  }>("/transactions/check", {
    method: "POST",
    body: JSON.stringify({ transactionId }),
  });
  return res.transaction.transactionState;
}
