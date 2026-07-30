/**
 * CNAB 400 (layout pragmático estilo cobrança) para remessa/retorno.
 * Compatível com o fluxo Veluxa: nosso número = sequencial da cobrança.
 * Bancos reais podem exigir ajustes de convênio — a conciliação pelo
 * nosso número + valor funciona no retorno padrão tipo 1.
 */

export type BankConfig = {
  bankCode: string; // 3 dígitos
  agency: string;
  account: string;
  wallet: string;
  beneficiaryName: string;
  beneficiaryDocument: string; // CNPJ só dígitos
};

export type RemessaItem = {
  nossoNumero: string;
  amountCents: number;
  dueDate: Date;
  payerName: string;
  payerDocument?: string;
  invoiceNumber: string;
};

function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function padLeft(s: string, n: number, ch = "0"): string {
  return (s || "").slice(0, n).padStart(n, ch);
}

function padRight(s: string, n: number, ch = " "): string {
  const t = (s || "").slice(0, n);
  return t + ch.repeat(Math.max(0, n - t.length));
}

function yymmdd(d: Date): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}${mm}${yy}`;
}

function formatAmount(cents: number): string {
  return padLeft(String(Math.max(0, Math.floor(cents))), 13, "0");
}

export function buildRemessaCnab400(
  bank: BankConfig,
  items: RemessaItem[],
  seqFile: number
): string {
  const lines: string[] = [];
  const today = new Date();
  const bankCode = padLeft(onlyDigits(bank.bankCode) || "237", 3);
  const agency = padLeft(onlyDigits(bank.agency), 5);
  const account = padLeft(onlyDigits(bank.account), 8);
  const wallet = padLeft(onlyDigits(bank.wallet) || "09", 2);

  // Header tipo 0 — 400 cols
  let h = "";
  h += "0"; // 001
  h += "1"; // 002 remessa
  h += padRight("REMESSA", 7);
  h += "01";
  h += padRight("COBRANCA", 15);
  h += agency;
  h += padLeft(wallet, 3);
  h += account;
  h += padRight("", 8);
  h += padRight(bank.beneficiaryName.toUpperCase(), 30);
  h += bankCode;
  h += padRight("BANCO", 15);
  h += yymmdd(today);
  h += padLeft(String(seqFile), 7);
  h += padRight("", 294);
  h += padLeft("1", 6);
  lines.push(padRight(h, 400).slice(0, 400));

  items.forEach((item, idx) => {
    const nosso = padLeft(onlyDigits(item.nossoNumero) || String(idx + 1), 11);
    let d = "";
    d += "1"; // tipo
    d += "02"; // inscrição empresa CNPJ
    d += padLeft(onlyDigits(bank.beneficiaryDocument), 14);
    d += agency;
    d += padLeft(wallet, 3);
    d += account;
    d += padRight("", 25); // uso empresa
    d += nosso;
    d += padRight("", 10);
    d += wallet;
    d += padRight("", 25);
    d += "1"; // emissão banco
    d += "N"; // pós
    d += padRight(item.invoiceNumber, 10);
    d += yymmdd(item.dueDate);
    d += formatAmount(item.amountCents);
    d += bankCode;
    d += padLeft("0", 5); // agência cobradora
    d += "01"; // espécie DM
    d += "N"; // aceite
    d += yymmdd(today); // emissão
    d += "00"; // instrução 1
    d += "00"; // instrução 2
    d += formatAmount(0); // juros
    d += padLeft("0", 6); // desconto até
    d += formatAmount(0);
    d += formatAmount(0); // iof
    d += formatAmount(0); // abatimento
    const payerDoc = onlyDigits(item.payerDocument || "");
    d += payerDoc.length === 11 ? "01" : "02";
    d += padLeft(payerDoc || "0", 14);
    d += padRight(item.payerName.toUpperCase(), 40);
    d += padRight("", 40); // endereço
    d += padRight("", 12);
    d += padLeft("0", 8); // CEP
    d += padRight("", 60);
    d += padLeft(String(idx + 2), 6);
    lines.push(padRight(d, 400).slice(0, 400));
  });

  let t = "";
  t += "9";
  t += padRight("", 393);
  t += padLeft(String(items.length + 2), 6);
  lines.push(padRight(t, 400).slice(0, 400));

  return lines.join("\r\n") + "\r\n";
}

export type RetornoPayment = {
  nossoNumero: string;
  amountCents: number;
  paidAt: Date;
  occurrence: string;
};

/** Códigos de ocorrência comuns de liquidação/baixa (CNAB 400). */
const PAID_CODES = new Set([
  "06", // liquidação normal
  "15", // liquidação em cartório
  "17", // liquidação após baixa
  "09", // baixado
  "10", // baixado conforme instruções
]);

export function parseRetornoCnab400(content: string): RetornoPayment[] {
  const lines = content.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  const paid: RetornoPayment[] = [];

  for (const line of lines) {
    if (line.length < 80) continue;
    const tipo = line[0];
    if (tipo !== "1" && tipo !== "7") continue; // detalhe

    // Tentativa CNAB400: ocorrência nas posições 109-110 (1-based) → index 108-109
    const occurrence = line.slice(108, 110);
    if (!PAID_CODES.has(occurrence)) {
      // fallback: procura nosso número + valor mesmo sem código conhecido se linha longa
      if (line.length < 160) continue;
    }

    // Nosso número: várias posições possíveis; tentamos 63-73 e 37-47
    let nosso = onlyDigits(line.slice(62, 73));
    if (!nosso || nosso === "00000000000") {
      nosso = onlyDigits(line.slice(37, 48));
    }
    nosso = nosso.replace(/^0+/, "") || nosso;

    // Valor pago: frequentemente 253-265 ou 153-165
    let amountRaw = onlyDigits(line.slice(252, 266));
    if (!amountRaw || Number(amountRaw) === 0) {
      amountRaw = onlyDigits(line.slice(152, 166));
    }
    const amountCents = Number(amountRaw);
    if (!nosso || !Number.isFinite(amountCents) || amountCents <= 0) continue;

    if (!PAID_CODES.has(occurrence) && line.length >= 400) {
      // só aceita sem código se valor batível — ainda assim exige ocorrência vazia ou 00
      if (occurrence && occurrence !== "00" && occurrence !== "  ") continue;
    }

    // Data crédito 111-116 ddmmyy
    const ds = line.slice(110, 116);
    let paidAt = new Date();
    if (/^\d{6}$/.test(ds)) {
      const dd = Number(ds.slice(0, 2));
      const mm = Number(ds.slice(2, 4)) - 1;
      let yy = Number(ds.slice(4, 6));
      yy += yy < 70 ? 2000 : 1900;
      const dt = new Date(yy, mm, dd, 12);
      if (!Number.isNaN(dt.getTime())) paidAt = dt;
    }

    paid.push({
      nossoNumero: nosso,
      amountCents,
      paidAt,
      occurrence: occurrence || "06",
    });
  }

  return paid;
}

/** Gera linha digitável simplificada + nosso número a partir do seq. */
export function buildBoletoRefs(seq: number, amountCents: number): {
  nossoNumero: string;
  boletoLine: string;
} {
  const nossoNumero = String(seq);
  const group = (n: number, seed: number) => {
    let x = seed;
    return Array.from({ length: n }, () => {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      return String(x % 10);
    }).join("");
  };
  const boletoLine = `23790.${group(5, seq)} ${group(5, seq + 1)}.${group(6, seq + 2)} ${group(5, seq + 3)}.${group(6, seq + 4)} ${seq % 10} ${padLeft(String(amountCents), 14)}`;
  return { nossoNumero, boletoLine };
}
