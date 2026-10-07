import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, Check, ChevronLeft, Home, Moon, Pencil, Plus, Repeat2, Search, Sun, Target, Trash2, UserRound, Users, Wallet, X } from "lucide-react";
import {
  PHASES, PAYMENTS, MONTHS, brl, monthKey, monthLabel, outstanding, received, useWorkspace, useTheme, useGoals,
  type Client, type Contract, type NewService, type Service, type Phase, type Payment,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Freela — Serviços, contratos e clientes" },
      { name: "description", content: "Organize serviços, contratos mensais, pagamentos, clientes e metas." },
      { property: "og:title", content: "Freela — Serviços, contratos e clientes" },
      { property: "og:description", content: "Organize serviços, contratos mensais, pagamentos, clientes e metas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Tab = "inicio" | "clientes" | "financeiro" | "contratos";
type Workspace = ReturnType<typeof useWorkspace>;
type Goals = ReturnType<typeof useGoals>;
const payColor: Record<Payment, string> = { Pago: "bg-mint", "50%": "bg-sky", "Não pago": "bg-coral" };
const sumRec = (list: Service[]) => list.reduce((total, service) => total + received(service), 0);
const sumTot = (list: Service[]) => list.reduce((total, service) => total + service.value, 0);

function App() {
  const workspace = useWorkspace();
  const goals = useGoals();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("inicio");
  const [month, setMonth] = useState(monthKey());
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const months = useMemo(() => {
    const values = new Set(workspace.services.map((service) => service.month));
    const now = new Date();
    for (let offset = -3; offset <= 3; offset++) values.add(monthKey(new Date(now.getFullYear(), now.getMonth() + offset, 1)));
    Object.keys(goals.goals).forEach((value) => values.add(value));
    return [...values].sort();
  }, [workspace.services, goals.goals]);
  const monthBar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = monthBar.current;
    const chip = bar?.querySelector<HTMLElement>(`[data-month="${month}"]`);
    if (bar && chip) bar.scrollTo({ left: chip.offsetLeft - bar.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [month, tab, months]);

  const title = selectedClient && tab === "clientes"
    ? workspace.clients.find((client) => client.id === selectedClient)?.name ?? "Cliente"
    : { inicio: "Seus serviços", clientes: "Clientes", financeiro: "Financeiro", contratos: "Contratos" }[tab];

  const changeTab = (next: Tab) => { setTab(next); setSelectedClient(null); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[480px] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-4 md:max-w-2xl">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long" })}
            </p>
            <div className="flex items-center gap-1.5">
              {selectedClient && tab === "clientes" && (
                <button onClick={() => setSelectedClient(null)} aria-label="Voltar aos clientes" className="tap -ml-1 grid size-7 place-items-center rounded-full hover:bg-muted"><ChevronLeft size={18} /></button>
              )}
              <h1 className="truncate font-display text-xl font-bold leading-tight">{title}</h1>
            </div>
          </div>
          <button onClick={theme.toggle} aria-label="Alternar tema" className="tap grid size-9 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground">
            {theme.dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>

        {(tab === "inicio" || tab === "financeiro") && (
          <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
            {months.map((value) => (
              <button key={value} onClick={() => setMonth(value)} className={`tap shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-border ${value === month ? "bg-ink text-ink-foreground" : "bg-surface text-muted-foreground"}`}>
                {monthLabel(value)}{value.slice(0, 4) !== String(new Date().getFullYear()) && ` ${value.slice(2, 4)}`}
              </button>
            ))}
          </div>
        )}

        {tab === "inicio" && <HomeTab workspace={workspace} month={month} goal={goals.goals[month]} />}
        {tab === "clientes" && (selectedClient
          ? <ClientDetail key={selectedClient} clientId={selectedClient} workspace={workspace} onBack={() => setSelectedClient(null)} onMonth={(value) => { setMonth(value); changeTab("inicio"); }} />
          : <ClientsTab workspace={workspace} onSelect={setSelectedClient} />)}
        {tab === "financeiro" && <FinanceTab items={workspace.services} months={months} month={month} goals={goals} />}
        {tab === "contratos" && <ContractsTab workspace={workspace} />}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-glass-border bg-glass p-1.5 shadow-lg backdrop-blur-2xl backdrop-saturate-150">
          <TabBtn icon={<Home size={17} />} label="Início" active={tab === "inicio"} onClick={() => changeTab("inicio")} />
          <TabBtn icon={<Users size={17} />} label="Clientes" active={tab === "clientes"} onClick={() => changeTab("clientes")} />
          <button onClick={() => setOpen(true)} aria-label="Novo serviço" className="tap mx-2 -mt-7 grid size-12 shrink-0 place-items-center rounded-full bg-flame text-on-color shadow-xl ring-4 ring-background">
            <Plus size={22} strokeWidth={2.5} />
          </button>
          <TabBtn icon={<Wallet size={17} />} label="Financeiro" active={tab === "financeiro"} onClick={() => changeTab("financeiro")} />
          <TabBtn icon={<Repeat2 size={17} />} label="Contratos" active={tab === "contratos"} onClick={() => changeTab("contratos")} />
        </nav>
      </div>

      {open && <NewSheet clients={workspace.clients} month={month} onClose={() => setOpen(false)} onSave={(service) => {
        const result = workspace.add(service);
        if (!result.ok) return result.error;
        setMonth(service.month); setTab("inicio"); setOpen(false);
        return undefined;
      }} />}
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} aria-label={label} className={`tap grid size-10 place-items-center rounded-full ${active ? "bg-on-color/15 text-flame" : "text-glass-foreground hover:text-on-color"}`}>{icon}</button>;
}

function HomeTab({ workspace, month, goal }: { workspace: Workspace; month: string; goal: number | undefined }) {
  const [filter, setFilter] = useState<Payment | "Todos">("Todos");
  const all = workspace.services.filter((service) => service.month === month);
  const list = all.filter((service) => filter === "Todos" || service.payment === filter);
  const total = sumTot(all), rec = sumRec(all);
  const pct = goal ? Math.min(100, (rec / goal) * 100) : 0;
  return <>
    <section className="mt-3 rounded-2xl bg-flame px-4 py-3 text-on-color animate-fade-in">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">Recebido</p><p className="font-display text-2xl font-bold leading-none">{brl(rec)}</p></div>
        <div className="flex gap-4 text-right"><div><p className="text-[10px] font-semibold uppercase opacity-80">Pendente</p><p className="font-display text-sm font-bold">{brl(total - rec)}</p></div><div><p className="text-[10px] font-semibold uppercase opacity-80">Total</p><p className="font-display text-sm font-bold">{brl(total)}</p></div></div>
      </div>
      {goal ? <div className="mt-2.5"><div className="h-1.5 overflow-hidden rounded-full bg-on-color/25"><div className="h-full rounded-full bg-on-color transition-all" style={{ width: `${pct}%` }} /></div><p className="mt-1 text-[10px] font-semibold opacity-90">{rec >= goal ? "Meta batida!" : `${Math.round(pct)}% da meta de ${brl(goal)}`}</p></div> : null}
    </section>
    <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto">
      {(["Todos", ...PAYMENTS] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`tap shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${value === filter ? (value === "Todos" ? "bg-ink text-ink-foreground" : `${payColor[value]} text-on-color`) : "bg-muted text-muted-foreground"}`}>{value} · {value === "Todos" ? all.length : all.filter((service) => service.payment === value).length}</button>)}
    </div>
    {list.length === 0 && <Empty text="Nenhum serviço aqui. Toque no + para adicionar." />}
    <div className="mt-2 space-y-2">{list.map((service) => <ServiceCard key={service.id} service={service} workspace={workspace} />)}</div>
  </>;
}

function ServiceCard({ service, workspace }: { service: Service; workspace: Workspace }) {
  const nextPay = () => workspace.update(service.id, { payment: PAYMENTS[(PAYMENTS.indexOf(service.payment) + 1) % PAYMENTS.length] ?? "Não pago" });
  const phaseIndex = PHASES.indexOf(service.phase);
  const [editing, setEditing] = useState(false);
  return <><article className="rounded-2xl bg-surface px-3.5 py-3 ring-1 ring-border">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div className="min-w-0"><button onClick={() => setEditing(true)} className="block w-full min-w-0 text-left"><h3 className="flex items-center gap-1 truncate text-sm font-bold leading-tight">{service.client}{service.contractId && <Repeat2 size={11} className="shrink-0 text-flame" aria-label="Serviço mensal" />}</h3><p className="truncate text-[11px] text-muted-foreground">{service.type || "Serviço"} · <b className="text-foreground">{brl(service.value)}</b></p></button></div>
      <div className="flex shrink-0 items-center gap-1"><button onClick={nextPay} title="Toque para mudar" className={`tap rounded-full px-2.5 py-1 text-[10px] font-bold text-on-color ${payColor[service.payment]}`}>{service.payment}</button><button onClick={() => setEditing(true)} aria-label="Editar" className="tap grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><Pencil size={13} /></button></div>
    </div>
    <div className="mt-2 grid grid-cols-4 gap-1">{PHASES.map((phase, index) => <button key={phase} onClick={() => workspace.update(service.id, { phase })} className="tap group relative text-left before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-['']" aria-label={phase}><span className={`block h-1.5 rounded-full ${index <= phaseIndex ? "bg-phase" : "bg-muted"}`} /><span className={`mt-1 block truncate text-[9px] font-bold ${index === phaseIndex ? "text-foreground" : "text-muted-foreground"}`}>{phase}</span></button>)}</div>
  </article>
  {editing && <EditSheet clients={workspace.clients} initial={{ client: service.client, type: service.type, value: String(service.value), month: service.month, phase: service.phase, payment: service.payment }} title={service.contractId ? `Editar ${monthLabel(service.month).toLowerCase()}` : "Editar serviço"} lockMonth={!!service.contractId} onClose={() => setEditing(false)} onDelete={() => { setEditing(false); workspace.remove(service.id); }} onSave={(form) => { const message = workspace.editService(service.id, { ...form, value: Number(form.value) }); if (!message) setEditing(false); return message; }} />}
  </>;
}

function ClientsTab({ workspace, onSelect }: { workspace: Workspace; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const current = monthKey();
  const clients = workspace.clients.filter((client) => client.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")));
  return <>
    <label className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-muted-foreground"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" maxLength={80} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none" /></label>
    {clients.length === 0 && <Empty text="Nenhum cliente encontrado." />}
    <div className="mt-3 space-y-2">{clients.map((client) => {
      const services = workspace.services.filter((service) => service.clientId === client.id && service.month <= current);
      const debt = services.reduce((total, service) => total + outstanding(service), 0);
      return <button key={client.id} onClick={() => onSelect(client.id)} className="tap grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 text-left ring-1 ring-border">
        <span className="grid size-9 place-items-center rounded-full bg-muted text-flame"><UserRound size={16} /></span>
        <span className="min-w-0"><span className="block truncate text-sm font-bold">{client.name}</span><span className="block text-[10px] text-muted-foreground">{services.length} {services.length === 1 ? "lançamento" : "lançamentos"} · recebido {brl(sumRec(services))}</span></span>
        <span className={`text-right text-xs font-bold ${debt > 0 ? "text-coral" : "text-mint"}`}>{debt > 0 ? brl(debt) : "Em dia"}</span>
      </button>;
    })}</div>
  </>;
}

function ClientDetail({ clientId, workspace, onMonth, onBack }: { clientId: string; workspace: Workspace; onMonth: (month: string) => void; onBack: () => void }) {
  const current = monthKey();
  const services = workspace.services.filter((service) => service.clientId === clientId && service.month <= current).sort((a, b) => b.month.localeCompare(a.month));
  const debt = services.reduce((total, service) => total + outstanding(service), 0);
  const contracts = workspace.contracts.filter((contract) => contract.clientId === clientId);
  const linked = workspace.services.some((service) => service.clientId === clientId) || contracts.length > 0;
  const name = workspace.clients.find((client) => client.id === clientId)?.name ?? "";
  const [renaming, setRenaming] = useState(false), [draft, setDraft] = useState(name), [error, setError] = useState("");
  return <>
    <section className="mt-3 rounded-2xl bg-ink p-4 text-ink-foreground"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">Saldo devedor</p><p className="font-display text-2xl font-bold">{brl(debt)}</p><div className="mt-2 flex gap-4 text-[11px] opacity-75"><span>Recebido {brl(sumRec(services))}</span><span>{contracts.length} {contracts.length === 1 ? "contrato" : "contratos"}</span></div></section>
    {renaming
      ? <form className="mt-2 space-y-1" onSubmit={(event) => { event.preventDefault(); const message = workspace.renameClient(clientId, draft); if (message) setError(message); else { setRenaming(false); setError(""); } }}><div className="flex gap-2"><input autoFocus value={draft} maxLength={80} onChange={(event) => setDraft(event.target.value)} className={sheetInput} /><button aria-label="Salvar nome" className="tap grid size-10 shrink-0 place-items-center rounded-xl bg-flame text-on-color"><Check size={16} /></button><button type="button" aria-label="Cancelar" onClick={() => { setRenaming(false); setDraft(name); setError(""); }} className="tap grid size-10 shrink-0 place-items-center rounded-xl bg-muted"><X size={15} /></button></div>{error && <p role="alert" className="px-1 text-xs font-semibold text-coral">{error}</p>}</form>
      : <div className="mt-2 flex gap-2"><button onClick={() => { setDraft(name); setRenaming(true); }} className="tap flex flex-1 items-center justify-center gap-1.5 rounded-full bg-muted py-2 text-xs font-bold"><Pencil size={12} /> Renomear</button>{!linked && <div className="flex-1"><ConfirmDelete label="Excluir cliente" confirmLabel="Excluir?" onConfirm={() => { workspace.deleteClient(clientId); onBack(); }} /></div>}</div>}
    <h2 className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Histórico</h2>
    {services.length === 0 && <Empty text="Este cliente ainda não tem lançamentos." />}
    <div className="mt-2 space-y-2">{services.map((service) => { const owed = outstanding(service); return <button key={service.id} onClick={() => onMonth(service.month)} className="tap grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 text-left ring-1 ring-border"><span className="min-w-0"><span className="flex items-center gap-1 truncate text-sm font-bold">{service.type || "Serviço"}{service.contractId && <Repeat2 size={11} className="text-flame" />}</span><span className="text-[10px] text-muted-foreground">{monthLabel(service.month)} {service.month.slice(0, 4)} · {service.payment}</span></span><span className="text-right"><span className="block text-xs font-bold">{brl(service.value)}</span><span className={`block text-[10px] font-semibold ${owed > 0 ? "text-coral" : "text-mint"}`}>{owed > 0 ? `deve ${brl(owed)}` : "Quitado"}</span></span></button>; })}</div>
  </>;
}

function ContractsTab({ workspace }: { workspace: Workspace }) {
  const current = monthKey();
  const [editing, setEditing] = useState<Contract | null>(null);
  return <>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Contratos indefinidos criam um novo lançamento quando cada mês começa.</p>
    {workspace.contracts.length === 0 && <Empty text="Nenhum contrato mensal. Crie um pelo botão +." />}
    <div className="mt-3 space-y-2">{workspace.contracts.map((contract) => {
      const client = workspace.clients.find((item) => item.id === contract.clientId);
      const active = !contract.endMonth || contract.endMonth >= current;
      return <article key={contract.id} className="rounded-2xl bg-surface px-3.5 py-3 ring-1 ring-border">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-bold">{client?.name ?? "Cliente"}</h3><p className="truncate text-[11px] text-muted-foreground">{contract.type || "Serviço mensal"} · {brl(contract.value)}/mês</p></div><div className="flex shrink-0 items-center gap-1"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-on-color ${active ? "bg-mint" : "bg-muted-foreground"}`}>{active ? "Ativo" : "Encerrado"}</span><button onClick={() => setEditing(contract)} aria-label="Editar contrato" className="tap grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"><Pencil size={13} /></button></div></div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"><span>{monthLabel(contract.startMonth)} {contract.startMonth.slice(0, 4)} → {contract.endMonth ? `${monthLabel(contract.endMonth)} ${contract.endMonth.slice(0, 4)}` : "Sem data final"}</span>{active && (!contract.endMonth || contract.endMonth > current) && <button onClick={() => workspace.stopContract(contract.id)} className="tap shrink-0 font-bold text-coral">Encerrar neste mês</button>}</div>
      </article>;
    })}</div>
    {editing && <ContractSheet contract={editing} clientName={workspace.clients.find((item) => item.id === editing.clientId)?.name ?? ""} clients={workspace.clients} onClose={() => setEditing(null)} onDelete={() => { workspace.deleteContract(editing.id); setEditing(null); }} onSave={(patch) => { const message = workspace.editContract(editing.id, patch); if (!message) setEditing(null); return message; }} />}
  </>;
}

function FinanceTab({ items, months, month, goals }: { items: Service[]; months: string[]; month: string; goals: Goals }) {
  const list = items.filter((service) => service.month === month);
  const rec = sumRec(list), total = sumTot(list), goal = goals.goals[month] ?? 0;
  const [editing, setEditing] = useState(false), [value, setValue] = useState("");
  const hit = goal > 0 && rec >= goal, pct = goal ? Math.min(100, (rec / goal) * 100) : 0, potential = goal ? Math.min(100, (total / goal) * 100) : 0;
  return <>
    <section className="mt-3 rounded-2xl bg-ink p-4 text-ink-foreground"><div className="flex items-center justify-between gap-2"><p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70"><Target size={12} /> Meta de {monthLabel(month).toLowerCase()}</p>{goal > 0 && <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-on-color ${hit ? "bg-mint" : "bg-coral"}`}>{hit ? "Batida" : "Não batida"}</span>}</div>
      {editing ? <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); goals.set(month, Number(value) || 0); setEditing(false); }}><input autoFocus type="number" inputMode="decimal" placeholder="Valor da meta" value={value} onChange={(event) => setValue(event.target.value)} className="min-w-0 flex-1 rounded-xl bg-ink-foreground/10 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-flame" /><button aria-label="Salvar meta" className="tap grid size-9 place-items-center rounded-xl bg-flame text-on-color"><Check size={16} /></button></form> : <button onClick={() => { setValue(goal ? String(goal) : ""); setEditing(true); }} className="tap mt-1 flex items-center gap-2 text-left"><span className="font-display text-2xl font-bold">{goal ? brl(goal) : "Definir meta"}</span><Pencil size={13} className="opacity-60" /></button>}
      {goal > 0 && <><div className="relative mt-3 h-2 overflow-hidden rounded-full bg-ink-foreground/15"><div className="absolute inset-y-0 left-0 rounded-full bg-ink-foreground/30" style={{ width: `${potential}%` }} /><div className={`absolute inset-y-0 left-0 rounded-full transition-all ${hit ? "bg-mint" : "bg-flame"}`} style={{ width: `${pct}%` }} /></div><p className="mt-1.5 text-[11px] opacity-75">{hit ? `Passou ${brl(rec - goal)} da meta` : `Faltam ${brl(goal - rec)} · ${total >= goal ? "dá pra bater com os pendentes" : `previsto ${brl(total)}`}`}</p></>}
    </section>
    <h2 className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Histórico</h2><div className="mt-2 space-y-2">{months.map((value) => { const monthItems = items.filter((service) => service.month === value), receivedValue = sumRec(monthItems), monthGoal = goals.goals[value] ?? 0, progress = monthGoal ? Math.min(100, (receivedValue / monthGoal) * 100) : 0; return <div key={value} className="rounded-2xl bg-surface px-3.5 py-2.5 ring-1 ring-border"><div className="flex items-center justify-between gap-2 text-sm"><p className="font-bold">{monthLabel(value)} <span className="text-[11px] font-normal text-muted-foreground">{value.slice(0, 4)}</span></p><p className="flex items-center gap-1.5 font-bold">{brl(receivedValue)}{monthGoal > 0 && <span className="text-[11px] font-normal text-muted-foreground">/ {brl(monthGoal)}</span>}{monthGoal > 0 && <span className={`size-2 rounded-full ${receivedValue >= monthGoal ? "bg-mint" : "bg-coral"}`} />}</p></div>{monthGoal > 0 && <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${receivedValue >= monthGoal ? "bg-mint" : "bg-flame"}`} style={{ width: `${progress}%` }} /></div>}</div>; })}</div>
  </>;
}

function Empty({ text }: { text: string }) { return <p className="mt-3 rounded-2xl border-2 border-dashed p-6 text-center text-xs font-semibold text-muted-foreground">{text}</p>; }

function NewSheet({ clients, month, onClose, onSave }: { clients: Client[]; month: string; onClose: () => void; onSave: (service: NewService) => string | undefined }) {
  const [form, setForm] = useState({ client: "", type: "", value: "", month, phase: "Briefing" as Phase, payment: "Não pago" as Payment, recurring: false, indefinite: true, endMonth: month });
  const [error, setError] = useState("");
  const input = "w-full rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-flame";
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const message = onSave({ client: form.client, type: form.type, value: Number(form.value), month: form.month, phase: form.phase, payment: form.payment, recurring: form.recurring, endMonth: form.recurring && !form.indefinite ? form.endMonth : null });
    if (message) setError(message);
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 md:items-center" onClick={onClose}>
    <form onClick={(event) => event.stopPropagation()} onSubmit={save} className="max-h-[calc(100dvh-1rem)] w-full max-w-[480px] space-y-2.5 overflow-y-auto overscroll-contain rounded-t-3xl bg-background p-5 [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))] animate-fade-in md:max-h-[90dvh] md:rounded-3xl">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Novo serviço</h2><button type="button" onClick={onClose} aria-label="Fechar" className="tap grid size-8 place-items-center rounded-full bg-muted"><X size={15} /></button></div>
      <div><input className={input} list="client-list" placeholder="Cliente" maxLength={80} value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} /><datalist id="client-list">{clients.map((client) => <option key={client.id} value={client.name} />)}</datalist><p className="mt-1 px-1 text-[10px] text-muted-foreground">Selecione um nome existente ou digite um novo.</p></div>
      <div className="grid grid-cols-2 gap-2"><input className={input} placeholder="Tipo (Logo, Site…)" maxLength={100} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /><input className={input} placeholder="Valor (R$)" inputMode="decimal" type="number" min="0" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></div>
      <MonthField label="Mês inicial" value={form.month} onChange={(value) => setForm({ ...form, month: value, endMonth: form.endMonth < value ? value : form.endMonth })} />
      <button type="button" onClick={() => setForm({ ...form, recurring: !form.recurring })} className={`tap flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left ${form.recurring ? "bg-flame text-on-color" : "bg-muted text-foreground"}`}><span className="flex items-center gap-2 text-sm font-bold"><Repeat2 size={15} /> Serviço mensal</span><span className={`h-5 w-9 rounded-full p-0.5 ${form.recurring ? "bg-on-color/30" : "bg-muted-foreground/25"}`}><span className={`block size-4 rounded-full bg-on-color transition-transform ${form.recurring ? "translate-x-4" : "translate-x-0"}`} /></span></button>
      {form.recurring && <div className="rounded-xl border border-border p-3"><label className="flex items-center justify-between gap-3 text-xs font-bold"><span>Sem data final</span><input type="checkbox" checked={form.indefinite} onChange={(event) => setForm({ ...form, indefinite: event.target.checked })} className="size-4 accent-flame" /></label>{!form.indefinite && <div className="mt-2"><MonthField label="Mês final" value={form.endMonth} onChange={(value) => setForm({ ...form, endMonth: value })} /></div>}<p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Cada mês terá fase e pagamento independentes.</p></div>}
      <PhasePicker value={form.phase} onChange={(phase) => setForm({ ...form, phase })} />
      <div className="flex flex-wrap gap-1.5">{PAYMENTS.map((payment) => <button type="button" key={payment} onClick={() => setForm({ ...form, payment })} className={`tap rounded-full px-3 py-1.5 text-[11px] font-bold ${form.payment === payment ? `${payColor[payment]} text-on-color` : "bg-muted text-muted-foreground"}`}>{payment}</button>)}</div>
      {error && <p role="alert" className="text-xs font-semibold text-coral">{error}</p>}
      <button type="submit" className="tap w-full rounded-full bg-flame py-3 text-sm font-bold text-on-color">{form.recurring ? "Criar contrato mensal" : "Salvar serviço"}</button>
    </form>
  </div>;
}

function MonthField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [year, month] = value.split("-");
  const input = "w-full rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-flame";
  return <fieldset><legend className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</legend><div className="grid grid-cols-2 gap-2"><select aria-label={`${label}: mês`} className={input} value={month} onChange={(event) => onChange(`${year}-${event.target.value}`)}>{MONTHS.map((name, index) => <option key={name} value={String(index + 1).padStart(2, "0")}>{name}</option>)}</select><input aria-label={`${label}: ano`} className={input} type="number" min="2000" max="2200" value={year} onChange={(event) => onChange(`${event.target.value}-${month}`)} /></div></fieldset>;
}
const sheetInput = "w-full rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-flame";

function Sheet({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: (event: React.FormEvent) => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 md:items-center" onClick={onClose}>
    <form onClick={(event) => event.stopPropagation()} onSubmit={onSubmit} className="max-h-[calc(100dvh-1rem)] w-full max-w-[480px] space-y-2.5 overflow-y-auto overscroll-contain rounded-t-3xl bg-background p-5 [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))] animate-fade-in md:max-h-[90dvh] md:rounded-3xl">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">{title}</h2><button type="button" onClick={onClose} aria-label="Fechar" className="tap grid size-8 place-items-center rounded-full bg-muted"><X size={15} /></button></div>
      {children}
    </form>
  </div>;
}

type EditForm = { client: string; type: string; value: string; month: string; phase: Phase; payment: Payment };

function EditSheet({ clients, initial, title, lockMonth, onClose, onSave, onDelete }: { clients: Client[]; initial: EditForm; title: string; lockMonth: boolean; onClose: () => void; onDelete: () => void; onSave: (form: EditForm) => string | undefined }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  return <Sheet title={title} onClose={onClose} onSubmit={(event) => { event.preventDefault(); const message = onSave(form); if (message) setError(message); }}>
    <div><input className={sheetInput} list="edit-client-list" placeholder="Cliente" maxLength={80} value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} /><datalist id="edit-client-list">{clients.map((client) => <option key={client.id} value={client.name} />)}</datalist></div>
    <div className="grid grid-cols-2 gap-2"><input className={sheetInput} placeholder="Tipo" maxLength={100} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /><input className={sheetInput} placeholder="Valor (R$)" inputMode="decimal" type="number" min="0" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></div>
    {lockMonth ? <p className="px-1 text-[10px] text-muted-foreground">Mês de um contrato mensal: as mudanças valem só para esta competência.</p> : <MonthField label="Mês" value={form.month} onChange={(value) => setForm({ ...form, month: value })} />}
    <PhasePicker value={form.phase} onChange={(phase) => setForm({ ...form, phase })} />
    <div className="flex flex-wrap gap-1.5">{PAYMENTS.map((payment) => <button type="button" key={payment} onClick={() => setForm({ ...form, payment })} className={`tap rounded-full px-3 py-1.5 text-[11px] font-bold ${form.payment === payment ? `${payColor[payment]} text-on-color` : "bg-muted text-muted-foreground"}`}>{payment}</button>)}</div>
    {error && <p role="alert" className="text-xs font-semibold text-coral">{error}</p>}
    <button type="submit" className="tap w-full rounded-full bg-flame py-3 text-sm font-bold text-on-color">Salvar alterações</button>
    <ConfirmDelete label={lockMonth ? "Excluir este mês" : "Excluir serviço"} confirmLabel={lockMonth ? "Excluir este mês do contrato?" : "Excluir este serviço?"} onConfirm={onDelete} />
  </Sheet>;
}

function PhasePicker({ value, onChange }: { value: Phase; onChange: (phase: Phase) => void }) {
  return <div className="flex flex-wrap gap-1.5">{PHASES.map((phase) => <button type="button" key={phase} onClick={() => onChange(phase)} className={`tap rounded-full px-3 py-1.5 text-[11px] font-bold ${value === phase ? "bg-ink text-ink-foreground" : "bg-muted text-muted-foreground"}`}>{phase}</button>)}</div>;
}

function ContractSheet({ contract, clientName, clients, onClose, onSave, onDelete }: { contract: Contract; clientName: string; clients: Client[]; onClose: () => void; onDelete: () => void; onSave: (patch: { client: string; type: string; value: number; startMonth: string; endMonth: string | null }) => string | undefined }) {
  const [form, setForm] = useState({ client: clientName, type: contract.type, value: String(contract.value), startMonth: contract.startMonth, indefinite: !contract.endMonth, endMonth: contract.endMonth ?? monthKey() });
  const [error, setError] = useState("");
  return <Sheet title="Editar contrato" onClose={onClose} onSubmit={(event) => { event.preventDefault(); const message = onSave({ client: form.client, type: form.type, value: Number(form.value), startMonth: form.startMonth, endMonth: form.indefinite ? null : form.endMonth }); if (message) setError(message); }}>
    <div><input className={sheetInput} list="contract-client-list" placeholder="Cliente" maxLength={80} value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} /><datalist id="contract-client-list">{clients.map((client) => <option key={client.id} value={client.name} />)}</datalist></div>
    <div className="grid grid-cols-2 gap-2"><input className={sheetInput} placeholder="Tipo" maxLength={100} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /><input className={sheetInput} placeholder="Valor mensal (R$)" inputMode="decimal" type="number" min="0" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></div>
    <MonthField label="Mês inicial" value={form.startMonth} onChange={(value) => setForm({ ...form, startMonth: value })} />
    <div className="rounded-xl border border-border p-3"><label className="flex items-center justify-between gap-3 text-xs font-bold"><span>Sem data final</span><input type="checkbox" checked={form.indefinite} onChange={(event) => setForm({ ...form, indefinite: event.target.checked })} className="size-4 accent-flame" /></label>{!form.indefinite && <div className="mt-2"><MonthField label="Mês final" value={form.endMonth} onChange={(value) => setForm({ ...form, endMonth: value })} /></div>}<p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">O novo valor vale do mês atual em diante; meses passados mantêm o valor e os pagamentos. Meses fora do novo período são removidos.</p></div>
    {error && <p role="alert" className="text-xs font-semibold text-coral">{error}</p>}
    <button type="submit" className="tap w-full rounded-full bg-flame py-3 text-sm font-bold text-on-color">Salvar contrato</button>
    <ConfirmDelete label="Excluir contrato" confirmLabel="Excluir contrato e todos os meses?" onConfirm={onDelete} />
  </Sheet>;
}

function ConfirmDelete({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  if (!armed) return <button type="button" onClick={() => setArmed(true)} className="tap flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold text-coral hover:bg-coral/10"><Trash2 size={13} /> {label}</button>;
  return <div className="flex items-center gap-2 rounded-full bg-coral/10 p-1 pl-3"><span className="min-w-0 flex-1 text-[11px] font-bold text-coral">{confirmLabel}</span><button type="button" onClick={() => setArmed(false)} className="tap rounded-full px-3 py-1.5 text-[11px] font-bold text-muted-foreground">Cancelar</button><button type="button" onClick={onConfirm} className="tap rounded-full bg-coral px-3 py-1.5 text-[11px] font-bold text-on-color">Excluir</button></div>;
}
