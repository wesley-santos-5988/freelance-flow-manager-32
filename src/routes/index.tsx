import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Home, LayoutList, Wallet, Settings, Plus, Moon, Sun, Trash2, X } from "lucide-react";
import {
  PHASES, PAYMENTS, MONTHS, brl, monthKey, monthLabel, received, useServices, useTheme,
  type Service, type Phase, type Payment,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Freela — Gestão de serviços para autônomos" },
      { name: "description", content: "Organize seus serviços por mês, acompanhe fases e pagamentos." },
      { property: "og:title", content: "Freela — Gestão de serviços para autônomos" },
      { property: "og:description", content: "Organize seus serviços por mês, acompanhe fases e pagamentos." },
    ],
  }),
  component: App,
});

type Tab = "inicio" | "servicos" | "financeiro" | "ajustes";

const payColor: Record<Payment, string> = { Pago: "bg-mint", "50%": "bg-sky", "Não pago": "bg-coral" };

function App() {
  const svc = useServices();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("inicio");
  const [month, setMonth] = useState(monthKey());
  const [open, setOpen] = useState(false);

  const months = useMemo(() => {
    const set = new Set(svc.items.map((s) => s.month));
    set.add(monthKey());
    return [...set].sort().reverse();
  }, [svc.items]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[480px] px-5 pb-36 pt-6 md:max-w-2xl">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "long" })}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-none">
              {{ inicio: "Bom dia.", servicos: "Serviços", financeiro: "Financeiro", ajustes: "Ajustes" }[tab]}
            </h1>
          </div>
          <button onClick={theme.toggle} aria-label="Alternar tema" className="tap grid size-11 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground">
            {theme.dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {tab === "inicio" && <HomeTab svc={svc} months={months} month={month} setMonth={setMonth} />}
        {tab === "servicos" && <AllTab svc={svc} />}
        {tab === "financeiro" && <FinanceTab items={svc.items} months={months} />}
        {tab === "ajustes" && <SettingsTab dark={theme.dark} toggle={theme.toggle} clear={svc.clear} />}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center pb-5">
        <nav className="pointer-events-auto relative flex w-[92%] max-w-[440px] items-center justify-between rounded-full bg-ink px-2 py-2 shadow-2xl">
          <TabBtn icon={<Home size={18} />} label="Início" active={tab === "inicio"} onClick={() => setTab("inicio")} />
          <TabBtn icon={<LayoutList size={18} />} label="Serviços" active={tab === "servicos"} onClick={() => setTab("servicos")} />
          <button onClick={() => setOpen(true)} aria-label="Novo serviço" className="tap -mt-10 grid size-16 shrink-0 place-items-center rounded-full bg-flame text-on-color shadow-xl ring-4 ring-background">
            <Plus size={28} strokeWidth={2.5} />
          </button>
          <TabBtn icon={<Wallet size={18} />} label="Financeiro" active={tab === "financeiro"} onClick={() => setTab("financeiro")} />
          <TabBtn icon={<Settings size={18} />} label="Ajustes" active={tab === "ajustes"} onClick={() => setTab("ajustes")} />
        </nav>
      </div>

      {open && <NewSheet month={month} onClose={() => setOpen(false)} onSave={(s) => { svc.add(s); setMonth(s.month); setTab("inicio"); setOpen(false); }} />}
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`tap flex min-w-0 flex-col items-center gap-1 rounded-full px-3 py-2 ${active ? "bg-flame text-on-color" : "text-ink-foreground/60"}`}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

type Svc = ReturnType<typeof useServices>;

function HomeTab({ svc, months, month, setMonth }: { svc: Svc; months: string[]; month: string; setMonth: (m: string) => void }) {
  const list = svc.items.filter((s) => s.month === month);
  const total = list.reduce((a, s) => a + s.value, 0);
  const rec = list.reduce((a, s) => a + received(s), 0);
  return (
    <>
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {months.map((m) => (
          <button key={m} onClick={() => setMonth(m)} className={`tap shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold ring-1 ring-border ${m === month ? "bg-ink text-ink-foreground" : "bg-surface text-muted-foreground"}`}>
            {monthLabel(m)}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[28px] bg-flame px-6 pb-5 pt-6 text-on-color animate-fade-in">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Recebido em {monthLabel(month).toLowerCase()}</p>
        <p className="mt-2 font-display text-5xl font-bold leading-none tracking-tight">{brl(rec)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-on-color/15 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Pendente</p>
            <p className="mt-1 font-display text-2xl font-bold leading-none">{brl(total - rec)}</p>
          </div>
          <div className="rounded-2xl bg-on-color/15 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Total</p>
            <p className="mt-1 font-display text-2xl font-bold leading-none">{brl(total)}</p>
          </div>
        </div>
      </section>

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Serviços do mês</h2>
        <span className="text-sm font-semibold text-muted-foreground">{list.length} ativos</span>
      </div>
      {list.length === 0 && <Empty />}
      {list.map((s) => <ServiceCard key={s.id} s={s} svc={svc} />)}
    </>
  );
}

function AllTab({ svc }: { svc: Svc }) {
  const [filter, setFilter] = useState<Payment | "Todos">("Todos");
  const list = svc.items.filter((s) => filter === "Todos" || s.payment === filter).sort((a, b) => b.month.localeCompare(a.month));
  return (
    <>
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {(["Todos", ...PAYMENTS] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`tap shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold ring-1 ring-border ${f === filter ? "bg-ink text-ink-foreground" : "bg-surface text-muted-foreground"}`}>{f}</button>
        ))}
      </div>
      {list.length === 0 && <Empty />}
      {list.map((s) => <ServiceCard key={s.id} s={s} svc={svc} showMonth />)}
    </>
  );
}

function ServiceCard({ s, svc, showMonth }: { s: Service; svc: Svc; showMonth?: boolean }) {
  const nextPay = () => svc.update(s.id, { payment: PAYMENTS[(PAYMENTS.indexOf(s.payment) + 1) % 3]! });
  return (
    <article className="mt-3 rounded-3xl bg-surface p-5 ring-1 ring-border animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {s.type}{showMonth && ` · ${monthLabel(s.month)} ${s.month.slice(0, 4)}`}
          </p>
          <h3 className="truncate font-display text-lg font-bold leading-tight">{s.client}</h3>
          <p className="mt-2 font-display text-2xl font-bold leading-none">{brl(s.value)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button onClick={nextPay} title="Toque para mudar" className={`tap rounded-full px-3 py-1.5 text-xs font-bold text-on-color ${payColor[s.payment]}`}>{s.payment}</button>
          <button onClick={() => svc.remove(s.id)} aria-label="Excluir" className="tap grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"><Trash2 size={15} /></button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {PHASES.map((p) => (
          <button key={p} onClick={() => svc.update(s.id, { phase: p })} className={`tap rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ring-border ${p === s.phase ? "bg-lemon text-on-lemon" : "bg-surface text-muted-foreground"}`}>{p}</button>
        ))}
      </div>
    </article>
  );
}

function FinanceTab({ items, months }: { items: Service[]; months: string[] }) {
  const all = items.reduce((a, s) => a + s.value, 0);
  const rec = items.reduce((a, s) => a + received(s), 0);
  return (
    <>
      <section className="mt-5 rounded-[28px] bg-ink px-6 pb-5 pt-6 text-ink-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Total recebido</p>
        <p className="mt-2 font-display text-5xl font-bold leading-none">{brl(rec)}</p>
        <p className="mt-3 text-sm opacity-70">A receber: <b>{brl(all - rec)}</b></p>
      </section>
      <h2 className="mt-7 font-display text-xl font-bold">Por mês</h2>
      {months.map((m) => {
        const l = items.filter((s) => s.month === m);
        const t = l.reduce((a, s) => a + s.value, 0);
        const r = l.reduce((a, s) => a + received(s), 0);
        const pct = t ? (r / t) * 100 : 0;
        return (
          <div key={m} className="mt-3 rounded-3xl bg-surface p-5 ring-1 ring-border">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-lg font-bold">{monthLabel(m)} <span className="text-sm text-muted-foreground">{m.slice(0, 4)}</span></p>
              <p className="font-display font-bold">{brl(r)} <span className="text-sm text-muted-foreground">/ {brl(t)}</span></p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </>
  );
}

function SettingsTab({ dark, toggle, clear }: { dark: boolean; toggle: () => void; clear: () => void }) {
  return (
    <div className="mt-6 space-y-3">
      <button onClick={toggle} className="tap flex w-full items-center justify-between rounded-3xl bg-surface p-5 ring-1 ring-border">
        <span className="font-display text-lg font-bold">Tema {dark ? "escuro" : "claro"}</span>
        <span className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors ${dark ? "bg-flame" : "bg-muted"}`}>
          <span className={`size-6 rounded-full bg-on-color shadow transition-transform ${dark ? "translate-x-6" : ""}`} />
        </span>
      </button>
      <button onClick={() => confirm("Apagar todos os serviços?") && clear()} className="tap w-full rounded-3xl bg-surface p-5 text-left font-display text-lg font-bold text-coral ring-1 ring-border">
        Apagar todos os dados
      </button>
    </div>
  );
}

function Empty() {
  return <p className="mt-6 rounded-3xl border-2 border-dashed p-8 text-center text-sm font-semibold text-muted-foreground">Nenhum serviço aqui. Toque no + para adicionar.</p>;
}

function NewSheet({ month, onClose, onSave }: { month: string; onClose: () => void; onSave: (s: Omit<Service, "id">) => void }) {
  const [f, setF] = useState({ client: "", type: "", value: "", month, phase: "Briefing" as Phase, payment: "Não pago" as Payment });
  const [y, mo] = f.month.split("-");
  const input = "w-full rounded-2xl bg-muted px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-flame";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 md:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (!f.client || !f.value) return; onSave({ ...f, value: Number(f.value) }); }}
        className="w-full max-w-[480px] space-y-3 rounded-t-[32px] bg-background p-6 pb-8 animate-fade-in md:rounded-[32px]"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Novo serviço</h2>
          <button type="button" onClick={onClose} className="tap grid size-10 place-items-center rounded-full bg-muted"><X size={18} /></button>
        </div>
        <input className={input} placeholder="Cliente" value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} />
        <input className={input} placeholder="Tipo (ex: Logo, Site, Pintura)" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} />
        <input className={input} placeholder="Valor (R$)" inputMode="decimal" type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <select className={input} value={mo} onChange={(e) => setF({ ...f, month: `${y}-${e.target.value}` })}>
            {MONTHS.map((n, i) => <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>)}
          </select>
          <input className={input} type="number" value={y} onChange={(e) => setF({ ...f, month: `${e.target.value}-${mo}` })} />
        </div>
        <div className="flex flex-wrap gap-2">
          {PAYMENTS.map((p) => (
            <button type="button" key={p} onClick={() => setF({ ...f, payment: p })} className={`tap rounded-full px-4 py-2 text-xs font-bold ${f.payment === p ? `${payColor[p]} text-on-color` : "bg-muted text-muted-foreground"}`}>{p}</button>
          ))}
        </div>
        <button type="submit" className="tap w-full rounded-full bg-flame py-4 font-display text-lg font-bold text-on-color">Salvar serviço</button>
      </form>
    </div>
  );
}
