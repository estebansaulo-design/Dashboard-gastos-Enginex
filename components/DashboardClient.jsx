"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, CalendarRange, CircleDollarSign, FileText, Filter } from "lucide-react";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

function fmtMoney(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="recharts-custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((item, idx) => (
        <p key={idx} className="tooltip-row" style={{ color: item.color || "#e2e8f0" }}>
          {item.name}: {fmtMoney(item.value)}
        </p>
      ))}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card">
      <div className="kpi-top">
        <div className="card-label">{label}</div>
        <Icon size={18} className="icon-muted" />
      </div>
      <div className="card-value">{value}</div>
      {sub ? <div className="card-sub">{sub}</div> : null}
    </div>
  );
}

export default function DashboardClient({ initialData }) {
  const [category, setCategory] = useState("__all__");
  const [provider, setProvider] = useState("__all__");
  const [currency, setCurrency] = useState("__all__");
  const [fromMonth, setFromMonth] = useState("__all__");
  const [toMonth, setToMonth] = useState("__all__");

  const filteredRecords = useMemo(() => {
    return initialData.records.filter((record) => {
      if (category !== "__all__" && record.category !== category) return false;
      if (provider !== "__all__" && record.provider !== provider) return false;
      if (currency !== "__all__" && record.currency !== currency) return false;
      if (fromMonth !== "__all__" && record.monthKey < fromMonth) return false;
      if (toMonth !== "__all__" && record.monthKey > toMonth) return false;
      return true;
    });
  }, [initialData.records, category, provider, currency, fromMonth, toMonth]);

  const derived = useMemo(() => {
    const monthMap = new Map();
    const categoryMap = new Map();
    const providerMap = new Map();
    const currencyMap = new Map();

    for (const record of filteredRecords) {
      const m = monthMap.get(record.monthKey) || {
        monthKey: record.monthKey,
        label: record.monthLabel,
        total: 0,
        invoices: 0,
      };
      m.total += record.total;
      m.invoices += 1;
      monthMap.set(record.monthKey, m);

      categoryMap.set(record.category, (categoryMap.get(record.category) || 0) + record.total);
      providerMap.set(record.provider, (providerMap.get(record.provider) || 0) + record.total);
      currencyMap.set(record.currency, (currencyMap.get(record.currency) || 0) + record.total);
    }

    const monthly = Array.from(monthMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    let accumulated = 0;
    const monthlySeries = monthly.map((item) => {
      accumulated += item.total;
      return { ...item, accumulated };
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

    const totalSpend = filteredRecords.reduce((sum, row) => sum + row.total, 0);
    const invoiceCount = filteredRecords.length;
    const avgTicket = invoiceCount ? totalSpend / invoiceCount : 0;
    const currentMonthSpend = monthlySeries.at(-1)?.total || 0;

    return {
      totalSpend,
      invoiceCount,
      avgTicket,
      currentMonthSpend,
      monthlySeries,
      byCategory,
      byProvider,
      byCurrency,
    };
  }, [filteredRecords]);

  const updatedAt = new Date(initialData.generatedAt).toLocaleString("es-AR");

  return (
    <main className="dashboard-root">
      <header className="dash-header">
        <div className="header-left">
          <span className="header-org">Compras y gastos</span>
          <h1 className="header-title">Dashboard de gastos de la empresa</h1>
          <p className="header-sub">
            Tablero automático conectado a Google Sheets, con filtros por categoría, proveedor, moneda y período.
          </p>
        </div>
        <div className="header-right badge badge-blue">
          Actualizado: {updatedAt}
        </div>
      </header>

      <section className="filters-card">
        <div className="filters-title-row">
          <div className="card-title">Filtros</div>
          <div className="filters-title-meta">
            <Filter size={16} />
            Segmentación en vivo
          </div>
        </div>
        <div className="filters-grid">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="__all__">Todas las categorías</option>
            {initialData.filters.categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="__all__">Todos los proveedores</option>
            {initialData.filters.providers.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="__all__">Todas las monedas</option>
            {initialData.filters.currencies.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)}>
            <option value="__all__">Desde cualquier mes</option>
            {initialData.filters.months.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <select value={toMonth} onChange={(e) => setToMonth(e.target.value)}>
            <option value="__all__">Hasta cualquier mes</option>
            {initialData.filters.months.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid-4">
        <KpiCard icon={CircleDollarSign} label="Gasto acumulado" value={fmtMoney(derived.totalSpend)} sub="Suma de facturas filtradas" />
        <KpiCard icon={CalendarRange} label="Gasto del último mes visible" value={fmtMoney(derived.currentMonthSpend)} sub="Último corte del filtro aplicado" />
        <KpiCard icon={FileText} label="Cantidad de facturas" value={derived.invoiceCount.toLocaleString("es-AR")} sub="Registros incluidos en la vista" />
        <KpiCard icon={BarChart3} label="Ticket promedio" value={fmtMoney(derived.avgTicket)} sub="Promedio por comprobante" />
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-title">Evolución mensual del gasto</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px", paddingTop: "12px" }} />
                <Bar dataKey="total" name="Gasto mensual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Acumulado de gasto</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={derived.monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "13px", paddingTop: "12px" }} />
                <Line type="monotone" dataKey="accumulated" name="Acumulado" stroke="#ef4444" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid-3">
        <div className="card">
          <div className="card-title">Gasto por categoría</div>
          <div className="pie-container-lg">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={derived.byCategory.slice(0, 8)}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine
                >
                  {derived.byCategory.slice(0, 8).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Top 10 proveedores</div>
          <div className="ranking-list">
            {derived.byProvider.map((item, index) => (
              <div key={item.name} className="ranking-item">
                <span className="ranking-num">{index + 1}</span>
                <div className="ranking-info">
                  <div className="ranking-name">{item.name}</div>
                  <div className="ranking-note">{fmtMoney(item.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Distribución por moneda</div>
          <div className="pie-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={derived.byCurrency} dataKey="value" nameKey="name" outerRadius={85} label>
                  {derived.byCurrency.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Detalle de categorías más pesadas</div>
        <div className="chart-container chart-container-tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={derived.byCategory.slice(0, 12)} layout="vertical" margin={{ top: 8, right: 16, left: 48, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Gasto" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
