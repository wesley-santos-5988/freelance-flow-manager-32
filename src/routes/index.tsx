import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Home, Wallet, Plus, Moon, Sun, Trash2, X, Target, Check, Pencil } from "lucide-react";
import {
  PHASES, PAYMENTS, MONTHS, brl, monthKey, monthLabel, received, useServices, useTheme, useGoals,
  type Service, type Phase, type Payment,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Freela — Gestão de serviços para autônomos" },
      { name: "description", content: "Organize seus serviços por mês, acompanhe fases, pagamentos e metas." },
      { property: "og:title", content: "Freela — Gestão de serviços para autônomos" },
      { property: "og:description", content: "Organize seus serviços por mês, acompanhe fases, pagamentos e metas." },
    ],
  }),
  component: App,
});

type Tab = "inicio" | "financeiro";
type Svc = ReturnType<typeof useServices>;
type Goals = ReturnType<typeof useGoals>;

const payColor: Record<Payment, string> = { Pago: "bg-mint", "50%": "bg-sky", "Não pago": "bg-coral" };
const sumRec = (l: Service[]) => l.reduce((a, s) => a + received(s), 0);
const sumTot = (l: Service[]) => l.reduce((a, s) => a + s.value, 0);

function App() {
  const svc = useServices();
  const goals = useGoals();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("inicio");
  const [month, setMonth] = useState(monthKey());
  const [open, setOpen] = useState(false);

  const months = useMemo(() => {
    const set = new Set(svc.items.map((s) => s.month));
    set.add(monthKey());
    Object.keys(goals.goals).forEach((m) => set.add(m));
    return [...set].sort().reverse();
  }, [svc.items, goals.goals]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4 md:max-w-2xl">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long" })}
            </p>
            <h1 className="font-display text-xl font-bold leading-tight">
              {{ inicio: "Seus serviços", financeiro: "Financeiro" }[tab]}
            </h1>
          </div>
          <button onClick={theme.toggle} aria-label="Alternar tema" className="tap grid size-9 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground">
            {theme.dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>

        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
          {months.map((m) => (
            <button key={m} onClick={() => setMonth(m)} className={`tap shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-border ${m === month ? "bg-ink text-ink-foreground" : "bg-surface text-muted-foreground"}`}>
              {monthLabel(m)}{m.slice(0, 4) !== String(new Date().getFullYear()) && ` ${m.slice(2, 4)}`}
            </button>
          ))}
        </div>

        {tab === "inicio" && <HomeTab svc={svc} month={month} goal={goals.goals[month]} />}
        {tab === "financeiro" && <FinanceTab items={svc.items} months={months} month={month} goals={goals} />}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center pb-4">
        <nav className="pointer-events-auto flex w-fit min-w-[220px] items-center justify-between gap-8 rounded-full border border-glass-border bg-glass px-2 p-1.5 shadow-lg backdrop-blur-2xl backdrop-saturate-150">
          <TabBtn icon={<Home size={17} />} label="Início" active={tab === "inicio"} onClick={() => setTab("inicio")} />
          <button onClick={() => setOpen(true)} aria-label="Novo serviço" className="tap -mt-7 grid size-12 shrink-0 place-items-center rounded-full bg-flame text-on-color shadow-xl ring-4 ring-background">
            <Plus size={22} strokeWidth={2.5} />
          </button>
          <TabBtn icon={<Wallet size={17} />} label="Financeiro" active={tab === "financeiro"} onClick={() => setTab("financeiro")} />
        </nav>
      </div>

      {open && <NewSheet month={month} onClose={() => setOpen(false)} onSave={(s) => { svc.add(s); setMonth(s.month); setTab("inicio"); setOpen(false); }} />}
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} className={`tap grid size-10 place-items-center rounded-full ${active ? "bg-flame text-on-color" : "text-ink-foreground/60"}`}>
      {icon}
    </button>
  );
}

function HomeTab({ svc, month, goal }: { svc: Svc; month: string; goal: number | undefined }) {
  const [filter, setFilter] = useState<Payment | "Todos">("Todos");
  const all = svc.items.filter((s) => s.month === month);
  const list = all.filter((s) => filter === "Todos" || s.payment === filter);
  const total = sumTot(all), rec = sumRec(all);
  const pct = goal ? Math.min(100, (rec / goal) * 100) : 0;
  return (
    <>
      <section className="mt-3 rounded-2xl bg-flame px-4 py-3 text-on-color animate-fade-in">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">Recebido</p>
            <p className="font-display text-2xl font-bold leading-none">{brl(rec)}</p>
          </div>
          <div className="flex gap-4 text-right">
            <div><p className="text-[10px] font-semibold uppercase opacity-80">Pendente</p><p className="font-display text-sm font-bold">{brl(total - rec)}</p></div>
            <div><p className="text-[10px] font-semibold uppercase opacity-80">Total</p><p className="font-display text-sm font-bold">{brl(total)}</p></div>
          </div>
        </div>
        {goal ? (
          <div className="mt-2.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-on-color/25"><div className="h-full rounded-full bg-on-color transition-all" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-[10px] font-semibold opacity-90">{rec >= goal ? "Meta batida!" : `${Math.round(pct)}% da meta de ${brl(goal)}`}</p>
          </div>
        ) : null}
      </section>

      <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto">
        {(["Todos", ...PAYMENTS] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`tap shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${f === filter ? (f === "Todos" ? "bg-ink text-ink-foreground" : `${payColor[f]} text-on-color`) : "bg-muted text-muted-foreground"}`}>
            {f} · {f === "Todos" ? all.length : all.filter((s) => s.payment === f).length}
          </button>
        ))}
      </div>

      {list.length === 0 && <Empty />}
      <div className="mt-2 space-y-2">{list.map((s) => <ServiceCard key={s.id} s={s} svc={svc} />)}</div>
    </>
  );
}

function ServiceCard({ s, svc }: { s: Service; svc: Svc }) {
  const nextPay = () => svc.update(s.id, { payment: PAYMENTS[(PAYMENTS.indexOf(s.payment) + 1) % 3]! });
  const idx = PHASES.indexOf(s.phase);
  return (
    <article className="rounded-2xl bg-surface px-3.5 py-3 ring-1 ring-border animate-fade-in">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold leading-tight">{s.client}</h3>
          <p className="truncate text-[11px] text-muted-foreground">{s.type || "Serviço"} · <b className="text-foreground">{brl(s.value)}</b></p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={nextPay} title="Toque para mudar" className={`tap rounded-full px-2.5 py-1 text-[10px] font-bold text-on-color ${payColor[s.payment]}`}>{s.payment}</button>
          <button onClick={() => svc.remove(s.id)} aria-label="Excluir" className="tap grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {PHASES.map((p, i) => (
          <button key={p} onClick={() => svc.update(s.id, { phase: p })} className="tap group text-left" aria-label={p}>
            <span className={`block h-1.5 rounded-full ${i <= idx ? "bg-lemon" : "bg-muted"}`} />
            <span className={`mt-1 block truncate text-[9px] font-bold ${i === idx ? "text-foreground" : "text-muted-foreground"}`}>{p}</span>
          </button>
        ))}
      </div>
    </article>
  );
}

function FinanceTab({ items, months, month, goals }: { items: Service[]; months: string[]; month: string; goals: Goals }) {
  const l = items.filter((s) => s.month === month);
  const rec = sumRec(l), tot = sumTot(l);
  const goal = goals.goals[month] ?? 0;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const hit = goal > 0 && rec >= goal;
  const pct = goal ? Math.min(100, (rec / goal) * 100) : 0;
  const potPct = goal ? Math.min(100, (tot / goal) * 100) : 0;

  return (
    <>
      <section className="mt-3 rounded-2xl bg-ink p-4 text-ink-foreground">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70"><Target size={12} /> Meta de {monthLabel(month).toLowerCase()}</p>
          {goal > 0 && <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-on-color ${hit ? "bg-mint" : "bg-coral"}`}>{hit ? "Batida" : "Não batida"}</span>}
        </div>
        {editing ? (
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); goals.set(month, Number(val) || 0); setEditing(false); }}>
            <input autoFocus type="number" inputMode="decimal" placeholder="Valor da meta" value={val} onChange={(e) => setVal(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-ink-foreground/10 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-flame" />
            <button className="tap grid size-9 place-items-center rounded-xl bg-flame text-on-color"><Check size={16} /></button>
          </form>
        ) : (
          <button onClick={() => { setVal(goal ? String(goal) : ""); setEditing(true); }} className="tap mt-1 flex items-center gap-2 text-left">
            <span className="font-display text-2xl font-bold">{goal ? brl(goal) : "Definir meta"}</span>
            <Pencil size={13} className="opacity-60" />
          </button>
        )}
        {goal > 0 && (
          <>
            <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-ink-foreground/15">
              <div className="absolute inset-y-0 left-0 rounded-full bg-ink-foreground/30" style={{ width: `${potPct}%` }} />
              <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${hit ? "bg-mint" : "bg-flame"}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] opacity-75">
              {hit ? `Passou ${brl(rec - goal)} da meta` : `Faltam ${brl(goal - rec)} · ${tot >= goal ? "dá pra bater com os pendentes" : `previsto ${brl(tot)}`}`}
            </p>
          </>
        )}
      </section>

      <h2 className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Histórico</h2>
      <div className="mt-2 space-y-2">
        {months.map((m) => {
          const ml = items.filter((s) => s.month === m);
          const r = sumRec(ml), g = goals.goals[m] ?? 0;
          const p = g ? Math.min(100, (r / g) * 100) : 0;
          return (
            <div key={m} className="rounded-2xl bg-surface px-3.5 py-2.5 ring-1 ring-border">
              <div className="flex items-center justify-between gap-2 text-sm">
                <p className="font-bold">{monthLabel(m)} <span className="text-[11px] font-normal text-muted-foreground">{m.slice(0, 4)}</span></p>
                <p className="flex items-center gap-1.5 font-bold">
                  {brl(r)}{g > 0 && <span className="text-[11px] font-normal text-muted-foreground">/ {brl(g)}</span>}
                  {g > 0 && <span className={`size-2 rounded-full ${r >= g ? "bg-mint" : "bg-coral"}`} />}
                </p>
              </div>
              {g > 0 && <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${r >= g ? "bg-mint" : "bg-flame"}`} style={{ width: `${p}%` }} /></div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Empty() {
  return <p className="mt-3 rounded-2xl border-2 border-dashed p-6 text-center text-xs font-semibold text-muted-foreground">Nenhum serviço aqui. Toque no + para adicionar.</p>;
}

function NewSheet({ month, onClose, onSave }: { month: string; onClose: () => void; onSave: (s: Omit<Service, "id">) => void }) {
  const [f, setF] = useState({ client: "", type: "", value: "", month, phase: "Briefing" as Phase, payment: "Não pago" as Payment });
  const [y, mo] = f.month.split("-");
  const input = "w-full rounded-xl bg-muted px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-flame";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 md:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (!f.client || !f.value) return; onSave({ ...f, value: Number(f.value) }); }}
        className="w-full max-w-[480px] space-y-2.5 rounded-t-3xl bg-background p-5 animate-fade-in md:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Novo serviço</h2>
          <button type="button" onClick={onClose} className="tap grid size-8 place-items-center rounded-full bg-muted"><X size={15} /></button>
        </div>
        <input className={input} placeholder="Cliente" value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={input} placeholder="Tipo (Logo, Site…)" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
          <input className={input} placeholder="Valor (R$)" inputMode="decimal" type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className={input} value={mo} onChange={(e) => setF({ ...f, month: `${y}-${e.target.value}` })}>
            {MONTHS.map((n, i) => <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>)}
          </select>
          <input className={input} type="number" value={y} onChange={(e) => setF({ ...f, month: `${e.target.value}-${mo}` })} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENTS.map((p) => (
            <button type="button" key={p} onClick={() => setF({ ...f, payment: p })} className={`tap rounded-full px-3 py-1.5 text-[11px] font-bold ${f.payment === p ? `${payColor[p]} text-on-color` : "bg-muted text-muted-foreground"}`}>{p}</button>
          ))}
        </div>
        <button type="submit" className="tap w-full rounded-full bg-flame py-3 text-sm font-bold text-on-color">Salvar serviço</button>
      </form>
    </div>
  );
}
