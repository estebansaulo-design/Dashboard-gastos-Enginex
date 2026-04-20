function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function parseMoney(value) {
  if (value === null || value === undefined || value === "") return 0;
  const raw = String(value).trim();
  if (!raw) return 0;

  const cleaned = raw
    .replace(/\$/g, "")
    .replace(/ars|usd|us\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=.*[,])/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parts = raw.split(/[\/\-]/);
  if (parts.length === 3) {
    let [a, b, c] = parts.map((x) => Number(x));
    if (String(parts[0]).length === 4) {
      const date = new Date(a, b - 1, c);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(c, b - 1, a);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date.toLocaleDateString("es-AR", {
    month: "short",
    year: "numeric",
  });
}

function compactCurrency(value) {
  const normalized = String(value || "ARS").trim().toUpperCase();
  return normalized || "ARS";
}

function cleanCategory(value) {
  const normalized = String(value || "Sin categoría").trim();
  return normalized || "Sin categoría";
}

function cleanProvider(value) {
  const normalized = String(value || "Sin proveedor").trim();
  return normalized || "Sin proveedor";
}

function buildObject(headers, row) {
  const result = {};
  headers.forEach((header, index) => {
    result[header] = row[index] ?? "";
  });
  return result;
}

function findValue(obj, candidates) {
  for (const key of candidates) {
    if (obj[key] !== undefined) return obj[key];
  }
  return "";
}

export function buildDashboardData(values) {
  if (!values?.length) {
    return {
      records: [],
      totals: { totalSpend: 0, invoiceCount: 0, avgTicket: 0, currentMonthSpend: 0 },
      charts: { monthly: [], byCategory: [], byProvider: [], byCurrency: [] },
      filters: { categories: [], providers: [], currencies: [], months: [] },
      generatedAt: new Date().toISOString(),
    };
  }

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map(normalizeHeader);

  const records = dataRows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => buildObject(headers, row))
    .map((row) => {
      const emision = parseDate(findValue(row, ["fecha emision", "fecha emisión", "fecha"]));
      const carga = parseDate(findValue(row, ["fecha carga"]));
      const date = emision || carga;

      const total = parseMoney(findValue(row, ["total"]));
      const neto = parseMoney(findValue(row, ["neto"]));
      const iva21 = parseMoney(findValue(row, ["iva 21%", "iva21"]));
      const iva105 = parseMoney(findValue(row, ["iva 10.5%", "iva 10,5%"]));
      const otros = parseMoney(findValue(row, ["otros impuestos"]));
      const retenciones = parseMoney(findValue(row, ["retenciones"]));
      const resolvedTotal = total || Math.max(neto + iva21 + iva105 + otros - retenciones, 0);

      return {
        date,
        monthKey: date ? monthKey(date) : "Sin fecha",
        monthLabel: date ? monthLabel(date) : "Sin fecha",
        provider: cleanProvider(findValue(row, ["razon social", "razón social"])),
        category: cleanCategory(findValue(row, ["categoria", "categoría"])),
        currency: compactCurrency(findValue(row, ["moneda"])),
        total: resolvedTotal,
        neto,
        iva21,
        iva105,
        otros,
        retenciones,
        comprobante: findValue(row, ["nro comprobante", "nro de comprobante"]),
        tipoComprobante: findValue(row, ["tipo comprobante"]),
        urlDrive: findValue(row, ["url drive"]),
      };
    })
    .filter((record) => record.total > 0);

  const monthlyMap = new Map();
  const categoryMap = new Map();
  const providerMap = new Map();
  const currencyMap = new Map();

  for (const record of records) {
    const currentMonth = monthlyMap.get(record.monthKey) || {
      monthKey: record.monthKey,
      label: record.monthLabel,
      total: 0,
      invoices: 0,
    };
    currentMonth.total += record.total;
    currentMonth.invoices += 1;
    monthlyMap.set(record.monthKey, currentMonth);

    categoryMap.set(record.category, (categoryMap.get(record.category) || 0) + record.total);
    providerMap.set(record.provider, (providerMap.get(record.provider) || 0) + record.total);
    currencyMap.set(record.currency, (currencyMap.get(record.currency) || 0) + record.total);
  }

  const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  let running = 0;
  const monthlyWithAccumulated = monthly.map((item) => {
    running += item.total;
    return { ...item, accumulated: running };
  });

  const byCategory = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byProvider = Array.from(providerMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const byCurrency = Array.from(currencyMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalSpend = records.reduce((sum, row) => sum + row.total, 0);
  const invoiceCount = records.length;
  const avgTicket = invoiceCount ? totalSpend / invoiceCount : 0;
  const currentMonthSpend = monthlyWithAccumulated.at(-1)?.total || 0;

  const categories = Array.from(new Set(records.map((r) => r.category))).sort((a, b) => a.localeCompare(b));
  const providers = Array.from(new Set(records.map((r) => r.provider))).sort((a, b) => a.localeCompare(b));
  const currencies = Array.from(new Set(records.map((r) => r.currency))).sort((a, b) => a.localeCompare(b));
  const months = monthlyWithAccumulated.map((m) => ({ value: m.monthKey, label: m.label }));

  return {
    records,
    totals: { totalSpend, invoiceCount, avgTicket, currentMonthSpend },
    charts: {
      monthly: monthlyWithAccumulated,
      byCategory,
      byProvider,
      byCurrency,
    },
    filters: { categories, providers, currencies, months },
    generatedAt: new Date().toISOString(),
  };
}
