import { useEffect, useState } from "react";

export const PHASES = ["Briefing", "Em andamento", "Revisão", "Entregue"] as const;
export const PAYMENTS = ["Pago", "50%", "Não pago"] as const;
export type Phase = (typeof PHASES)[number];
export type Payment = (typeof PAYMENTS)[number];

export type Service = {
  id: string;
  client: string;
  type: string;
  value: number;
  month: string; // YYYY-MM
  phase: Phase;
  payment: Payment;
};

export const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const monthLabel = (k: string) => MONTHS[Number(k.split("-")[1]) - 1] ?? "";
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const received = (s: Service) => (s.payment === "Pago" ? s.value : s.payment === "50%" ? s.value / 2 : 0);

function seed(): Service[] {
  const m = monthKey();
  return [
    { id: "1", client: "Studio Mãos", type: "Design de logo", value: 1500, month: m, phase: "Em andamento", payment: "Pago" },
    { id: "2", client: "Café do Bairro", type: "Landing page", value: 2100, month: m, phase: "Revisão", payment: "50%" },
    { id: "3", client: "Bar do Zé", type: "Mural ilustrado", value: 3350, month: m, phase: "Entregue", payment: "Não pago" },
  ];
}

const KEY = "freela-services";

export function useServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    setItems(raw ? JSON.parse(raw) : seed());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);
  return {
    items,
    add: (s: Omit<Service, "id">) => setItems((p) => [{ ...s, id: crypto.randomUUID() }, ...p]),
    update: (id: string, patch: Partial<Service>) => setItems((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s))),
    remove: (id: string) => setItems((p) => p.filter((s) => s.id !== id)),
    clear: () => setItems([]),
  };
}

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(localStorage.getItem("freela-theme") === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("freela-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}
