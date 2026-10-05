import { useEffect, useState } from "react";
import { z } from "zod";

export const PHASES = ["Briefing", "Em andamento", "Revisão", "Entregue"] as const;
export const PAYMENTS = ["Pago", "50%", "Não pago"] as const;
export type Phase = (typeof PHASES)[number];
export type Payment = (typeof PAYMENTS)[number];

export type Client = { id: string; name: string };
export type Contract = {
  id: string;
  clientId: string;
  type: string;
  value: number;
  startMonth: string;
  endMonth: string | null;
  skippedMonths: string[];
};
export type Service = {
  id: string;
  clientId: string;
  client: string;
  type: string;
  value: number;
  month: string;
  phase: Phase;
  payment: Payment;
  contractId?: string;
};

export type NewService = {
  client: string;
  type: string;
  value: number;
  month: string;
  phase: Phase;
  payment: Payment;
  recurring: boolean;
  endMonth: string | null;
};

type Workspace = { version: 2; clients: Client[]; contracts: Contract[]; services: Service[] };

export const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const monthLabel = (k: string) => MONTHS[Number(k.split("-")[1]) - 1] ?? "";
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const received = (s: Service) => (s.payment === "Pago" ? s.value : s.payment === "50%" ? s.value / 2 : 0);
export const outstanding = (s: Service) => s.value - received(s);

export const newServiceSchema = z.object({
  client: z.string().trim().min(1, "Informe o cliente").max(80, "Nome muito longo"),
  type: z.string().trim().max(100, "Descrição muito longa"),
  value: z.number().positive("Informe um valor maior que zero").max(100000000, "Valor muito alto"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inicial inválido"),
  phase: z.enum(PHASES),
  payment: z.enum(PAYMENTS),
  recurring: z.boolean(),
  endMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês final inválido").nullable(),
}).superRefine((data, ctx) => {
  if (data.recurring && data.endMonth && data.endMonth < data.month) {
    ctx.addIssue({ code: "custom", path: ["endMonth"], message: "O fim deve ser igual ou posterior ao início" });
  }
});

const WORKSPACE_KEY = "freela-workspace-v2";
const LEGACY_KEY = "freela-services";

function id() {
  return crypto.randomUUID();
}

function monthRange(start: string, end: string) {
  const result: string[] = [];
  let [year, month] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    result.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month === 13) { month = 1; year += 1; }
  }
  return result;
}

function seedLegacy(): Omit<Service, "clientId">[] {
  const month = monthKey();
  return [
    { id: "1", client: "Studio Mãos", type: "Design de logo", value: 1500, month, phase: "Em andamento", payment: "Pago" },
    { id: "2", client: "Café do Bairro", type: "Landing page", value: 2100, month, phase: "Revisão", payment: "50%" },
    { id: "3", client: "Bar do Zé", type: "Mural ilustrado", value: 3350, month, phase: "Entregue", payment: "Não pago" },
  ];
}

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase("pt-BR");
}

function migrateLegacy(): Workspace {
  let legacy: Omit<Service, "clientId">[] = seedLegacy();
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) legacy = JSON.parse(raw) as Omit<Service, "clientId">[];
  } catch { /* Fall back to the starter rows when old data is invalid. */ }
  const clients: Client[] = [];
  const services = legacy.map((service) => {
    const clientName = String(service.client || "Cliente sem nome").trim();
    let client = clients.find((item) => normalizeName(item.name) === normalizeName(clientName));
    if (!client) {
      client = { id: id(), name: clientName };
      clients.push(client);
    }
    return { ...service, client: client.name, clientId: client.id };
  });
  return { version: 2, clients, contracts: [], services };
}

function materialize(workspace: Workspace): Workspace {
  const services = [...workspace.services];
  const current = monthKey();
  for (const contract of workspace.contracts) {
    const lastMonth = contract.endMonth ?? current;
    for (const month of monthRange(contract.startMonth, lastMonth)) {
      if (contract.skippedMonths.includes(month) || services.some((service) => service.contractId === contract.id && service.month === month)) continue;
      const client = workspace.clients.find((item) => item.id === contract.clientId);
      if (!client) continue;
      services.push({ id: id(), clientId: client.id, client: client.name, type: contract.type, value: contract.value, month, phase: "Briefing", payment: "Não pago", contractId: contract.id });
    }
  }
  return { ...workspace, services };
}

function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (raw) return materialize(JSON.parse(raw) as Workspace);
  } catch { /* Migrate if the current local copy cannot be read. */ }
  return migrateLegacy();
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>({ version: 2, clients: [], contracts: [], services: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWorkspace(loadWorkspace());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
  }, [workspace, ready]);

  const add = (draft: NewService) => {
    const parsed = newServiceSchema.safeParse(draft);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Revise os dados" };
    const data = parsed.data;
    setWorkspace((previous) => {
      let client = previous.clients.find((item) => normalizeName(item.name) === normalizeName(data.client));
      const clients = [...previous.clients];
      if (!client) { client = { id: id(), name: data.client.trim() }; clients.push(client); }
      if (!data.recurring) {
        const service: Service = { id: id(), clientId: client.id, client: client.name, type: data.type.trim(), value: data.value, month: data.month, phase: data.phase, payment: data.payment };
        return { ...previous, clients, services: [service, ...previous.services] };
      }
      const contract: Contract = { id: id(), clientId: client.id, type: data.type.trim(), value: data.value, startMonth: data.month, endMonth: data.endMonth, skippedMonths: [] };
      const lastMonth = data.endMonth ?? monthKey();
      const instances = monthRange(data.month, lastMonth).map((month, index): Service => ({
        id: id(), clientId: client.id, client: client.name, type: data.type.trim(), value: data.value, month,
        phase: index === 0 ? data.phase : "Briefing", payment: index === 0 ? data.payment : "Não pago", contractId: contract.id,
      }));
      return { ...previous, clients, contracts: [contract, ...previous.contracts], services: [...instances.reverse(), ...previous.services] };
    });
    return { ok: true as const };
  };

  const update = (serviceId: string, patch: Partial<Pick<Service, "phase" | "payment">>) =>
    setWorkspace((previous) => ({ ...previous, services: previous.services.map((service) => service.id === serviceId ? { ...service, ...patch } : service) }));

  const remove = (serviceId: string) => setWorkspace((previous) => {
    const service = previous.services.find((item) => item.id === serviceId);
    const contracts = service?.contractId
      ? previous.contracts.map((contract) => contract.id === service.contractId ? { ...contract, skippedMonths: [...new Set([...contract.skippedMonths, service.month])] } : contract)
      : previous.contracts;
    return { ...previous, contracts, services: previous.services.filter((item) => item.id !== serviceId) };
  });

  const stopContract = (contractId: string) => setWorkspace((previous) => {
    const endMonth = monthKey();
    return {
      ...previous,
      contracts: previous.contracts.map((contract) => contract.id === contractId ? { ...contract, endMonth } : contract),
      services: previous.services.filter((service) => service.contractId !== contractId || service.month <= endMonth),
    };
  });

  return { ...workspace, ready, add, update, remove, stopContract };
}

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("freela-theme") === "dark"); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("freela-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((value) => !value) };
}

export function useGoals() {
  const [goals, setGoals] = useState<Record<string, number>>({});
  useEffect(() => {
    const raw = localStorage.getItem("freela-goals");
    if (raw) setGoals(JSON.parse(raw) as Record<string, number>);
  }, []);
  const set = (month: string, value: number) => setGoals((previous) => {
    const next = { ...previous, [month]: value };
    localStorage.setItem("freela-goals", JSON.stringify(next));
    return next;
  });
  return { goals, set };
}