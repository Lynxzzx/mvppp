export type ImportEntity = "casos" | "estoque" | "contratos";

export type ImportField = {
  key: string;
  label: string;
  required?: boolean;
  /** Sinônimos de cabeçalho para auto-mapeamento (normalizados). */
  aliases: string[];
};

export const IMPORT_ENTITIES: {
  id: ImportEntity;
  label: string;
  description: string;
  feature?: "estoque" | "contratos";
  fields: ImportField[];
}[] = [
  {
    id: "casos",
    label: "Casos / atendimentos",
    description: "Importe sua planilha de atendimentos. Colunas típicas: falecido, familiar, telefone, tipo de serviço.",
    fields: [
      {
        key: "deceased.name",
        label: "Nome do falecido",
        required: true,
        aliases: ["falecido", "nome falecido", "nome do falecido", "obito", "deceased", "morto"],
      },
      {
        key: "family.name",
        label: "Nome do responsável",
        required: true,
        aliases: ["responsavel", "familiar", "familia", "nome responsavel", "cliente", "family"],
      },
      {
        key: "family.phone",
        label: "Telefone",
        aliases: ["telefone", "fone", "celular", "whatsapp", "phone"],
      },
      {
        key: "family.email",
        label: "E-mail",
        aliases: ["email", "e-mail", "mail"],
      },
      {
        key: "family.relationship",
        label: "Parentesco",
        aliases: ["parentesco", "grau", "relacionamento", "relationship"],
      },
      {
        key: "family.document",
        label: "Documento do responsável",
        aliases: ["cpf", "documento", "rg", "document"],
      },
      {
        key: "deceased.dateOfDeath",
        label: "Data do óbito",
        aliases: ["data obito", "obito", "data do obito", "falecimento", "death"],
      },
      {
        key: "deceased.dateOfBirth",
        label: "Data de nascimento",
        aliases: ["nascimento", "data nascimento", "birth"],
      },
      {
        key: "deceased.placeOfDeath",
        label: "Local do óbito",
        aliases: ["local", "local obito", "hospital", "place"],
      },
      {
        key: "serviceType",
        label: "Tipo de serviço",
        aliases: ["tipo", "servico", "tipo servico", "modalidade", "service"],
      },
    ],
  },
  {
    id: "estoque",
    label: "Estoque",
    description: "Itens de estoque (urnas, flores, etc.) com quantidade e mínimo.",
    feature: "estoque",
    fields: [
      {
        key: "name",
        label: "Nome do item",
        required: true,
        aliases: ["nome", "item", "produto", "descricao", "name"],
      },
      {
        key: "category",
        label: "Categoria",
        aliases: ["categoria", "tipo", "category"],
      },
      {
        key: "quantity",
        label: "Quantidade",
        aliases: ["quantidade", "qtd", "estoque", "qty", "quantity"],
      },
      {
        key: "minQuantity",
        label: "Mínimo",
        aliases: ["minimo", "qtd minima", "estoque minimo", "min"],
      },
      {
        key: "supplierName",
        label: "Fornecedor",
        aliases: ["fornecedor", "supplier"],
      },
      {
        key: "notes",
        label: "Observações",
        aliases: ["obs", "observacao", "notas", "notes"],
      },
    ],
  },
  {
    id: "contratos",
    label: "Contratos / planos",
    description: "Planos pré-pagos com valor total e número de parcelas.",
    feature: "contratos",
    fields: [
      {
        key: "customerName",
        label: "Titular",
        required: true,
        aliases: ["titular", "cliente", "nome", "customer"],
      },
      {
        key: "customerPhone",
        label: "Telefone",
        aliases: ["telefone", "fone", "celular", "phone"],
      },
      {
        key: "customerDocument",
        label: "CPF/CNPJ",
        aliases: ["cpf", "cnpj", "documento", "document"],
      },
      {
        key: "planName",
        label: "Nome do plano",
        required: true,
        aliases: ["plano", "nome plano", "produto", "plan"],
      },
      {
        key: "totalCents",
        label: "Valor total (R$)",
        required: true,
        aliases: ["valor", "total", "preco", "amount", "valor total"],
      },
      {
        key: "installmentsCount",
        label: "Nº de parcelas",
        required: true,
        aliases: ["parcelas", "n parcelas", "qtd parcelas", "installments"],
      },
      {
        key: "firstDueDate",
        label: "1º vencimento",
        required: true,
        aliases: ["vencimento", "primeiro vencimento", "1 vencimento", "due", "data"],
      },
    ],
  },
];

export function getEntityDef(id: ImportEntity) {
  return IMPORT_ENTITIES.find((e) => e.id === id)!;
}

/** Normaliza texto de cabeçalho para matching. */
export function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Sugere mapeamento coluna → campo com base em aliases. */
export function suggestMapping(
  headers: string[],
  entity: ImportEntity
): Record<string, string> {
  const fields = getEntityDef(entity).fields;
  const mapping: Record<string, string> = {};
  const used = new Set<string>();

  for (const header of headers) {
    const n = normalizeHeader(header);
    if (!n) continue;
    for (const field of fields) {
      if (used.has(field.key)) continue;
      const hit = field.aliases.some(
        (a) => n === normalizeHeader(a) || n.includes(normalizeHeader(a)) || normalizeHeader(a).includes(n)
      );
      if (hit) {
        mapping[header] = field.key;
        used.add(field.key);
        break;
      }
    }
  }
  return mapping;
}
