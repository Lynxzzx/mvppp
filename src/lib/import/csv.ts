/** Parser CSV simples (vírgula ou ponto-e-vírgula; aspas). Sem dependências. */

export type CsvTable = {
  headers: string[];
  rows: string[][];
};

function detectDelimiter(sample: string): "," | ";" {
  const firstLine = sample.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

function parseLine(line: string, delimiter: "," | ";"): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseCsv(text: string): CsvTable {
  const cleaned = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(cleaned);
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]!, delimiter).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = parseLine(line, delimiter);
    while (cols.length < headers.length) cols.push("");
    return cols.slice(0, headers.length);
  });

  return { headers, rows };
}

export function rowsToObjects(table: CsvTable): Record<string, string>[] {
  return table.rows.map((row) => {
    const obj: Record<string, string> = {};
    table.headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}
