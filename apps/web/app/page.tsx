'use client';
import { useCallback, useEffect, useState } from 'react';
import type { DirectorState, Mapping, Overlay, Sequence } from '../../../packages/shared/src';
import { en } from '../../../packages/shared/src/messages/en';

const API = 'http://localhost:4000';
interface State { real: DirectorState; simulation: DirectorState; simOverlay?: Overlay; simScene: string; simNow: number; obs: { status: string; scene: string; mapping?: Mapping }; twitch: { status: string; lastChatAt?: number; gaps: { from: number; to?: number }[] }; overlayUrl: string }
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const date = (at: number) => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }).format(at);
export default function Home() {
  const [state, setState] = useState<State>();
  const [tab, setTab] = useState<string>(en.nav[0]);
  const [csrf, setCsrf] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scenes, setScenes] = useState<{ name: string; uuid: string }[]>([]);
  const [items, setItems] = useState<{ id: number; name: string }[]>([]);
  const [mapping, setMapping] = useState<Mapping>({ main: '', welcome: '', cameraScene: '', cameraId: -1, zoom: 1.1 });
  const [historyOrigin, setHistoryOrigin] = useState<'REAL' | 'SIMULATION'>('REAL');
  const simulated = tab === en.nav[2];
  const target = simulated ? 'SIMULATION' : 'REAL';
  const d = simulated ? state?.simulation : state?.real;
  const read = useCallback(async (path: string) => { const r = await fetch(`${API}/${path}`, { credentials: 'include', cache: 'no-store' }); if (!r.ok) throw new Error(en.error); return r.json(); }, []);
  const refresh = useCallback(async () => { setState(await read('state') as State); }, [read]);
  useEffect(() => {
    let alive = true;
    const start = async () => {
      try { const r = await fetch(`${API}/session`, { method: 'POST', credentials: 'include' }); if (!r.ok) throw new Error(); const s = await r.json() as { csrf: string }; if (alive) { setCsrf(s.csrf); await refresh(); setError(new URLSearchParams(window.location.search).get('twitch') === 'error' ? en.authError : ''); } }
      catch { if (alive) setError(en.offline); }
    };
    void start();
    const id = setInterval(() => { if (alive) void refresh().catch(() => setError(en.offline)); }, 1000);
    return () => { alive = false; clearInterval(id); };
  }, [refresh]);
  async function send(body: object) {
    setBusy(true); setError('');
    try { const r = await fetch(`${API}/command`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Scenquira-CSRF': csrf }, body: JSON.stringify(body) }); const data = await r.json() as { error?: string; url?: string }; if (!r.ok) throw new Error(data.error || en.error); if (data.url) window.location.assign(data.url); await refresh(); return true; }
    catch (e) { setError(e instanceof Error ? e.message : en.error); return false; }
    finally { setBusy(false); }
  }
  const configure = (value: object) => send({ action: 'configure', target, value });
  const action = (name: string) => send({ action: name, target });
  async function loadScenes() { try { setScenes(await read('scenes')); } catch { setError(en.obsError); } }
  async function cameraScene(name: string) { setMapping(m => ({ ...m, cameraScene: name, cameraId: -1 })); try { setItems(await read(`items?scene=${encodeURIComponent(name)}`)); } catch { setError(en.invalidMapping); } }
  const status = (name: string, value: string) => <span className="pill"><span className={value === en.connected ? 'text-emerald-300' : 'text-muted'} aria-hidden="true">●</span>{name}<span className="text-muted">{value}</span></span>;
  return <div className="min-h-screen">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-edge px-6 py-5 lg:px-10">
      <a href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight"><span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-zinc-950">S</span>{en.app}<span className="ml-2 text-xs font-normal uppercase tracking-[.25em] text-muted">{en.director}</span></a>
      <div className="flex flex-wrap gap-3">{status(en.twitch, state?.twitch.status ?? en.disconnected)}{status(en.obs, state?.obs.status ?? en.disconnected)}</div>
    </header>
    <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-edge p-5 lg:min-h-[calc(100vh-80px)] lg:border-r lg:border-b-0">
        <nav aria-label={en.navigation} className="flex flex-wrap gap-2 lg:flex-col">{en.nav.map((name, i) => <button key={name} onClick={() => setTab(name)} aria-current={tab === name ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${tab === name ? 'bg-violet-400/15 text-accent' : 'text-muted hover:bg-white/5'}`}><span aria-hidden="true" className="font-mono text-xs opacity-60">0{i + 1}</span>{name}</button>)}</nav>
        <div className="mt-12 hidden border-t border-edge pt-5 text-xs leading-6 text-muted lg:block"><p>{en.promise}</p><p className="mt-5 text-accent">{en.noModel}</p><p className="mt-3">{en.pendingReal}</p></div>
      </aside>
      <main className="min-w-0 p-5 md:p-8 lg:p-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs uppercase tracking-[.25em] text-muted">{simulated ? en.simulation : en.workspace}</p><h1 className="text-3xl font-semibold tracking-tight">{tab}</h1></div><span className={`pill ${simulated ? 'border-amber-500/50 text-amber-200' : 'text-muted'}`}>{simulated ? en.simulation : en.security}</span></div>
        {error && <div role="alert" className="mb-6 rounded-xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}
        {!state && <div role="status" className="panel text-muted">{en.loading}</div>}
        {state && d && (tab === en.nav[0] || simulated) && <>
          {simulated && <section className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5"><p className="text-sm text-amber-100">{en.simulatorHelp}</p><p className="mt-2 text-xs text-muted">{en.simHint}</p><div className="mt-4 flex flex-wrap gap-2">{[['warm', en.simWarm], ['hype', en.simHype], ['raid', en.simRaid], ['spam', en.simSpam], ['stale', en.simStale], ['duplicate', en.simDuplicate], ['manual', en.simManual], ['reset', en.simReset]].map(([scenario, label]) => <button key={scenario} className="btn" disabled={busy} onClick={() => void send({ action: 'simulate', scenario })}>{label}</button>)}</div></section>}
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl border border-edge bg-panel">
                <div className="flex items-center justify-between border-b border-edge px-5 py-3 text-xs text-muted"><span>{en.preview}</span><span>{simulated ? en.simulation : d.mode}</span></div>
                <div className="relative flex min-h-72 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#302343_0%,#17171e_65%)] p-8 text-center">
                  <div aria-hidden="true" className="absolute inset-7 rounded-xl border border-white/5" />
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/10 text-3xl text-accent" aria-hidden="true">{d.active ? '✦' : '◈'}</div>
                  <h2 className="text-2xl font-medium">{d.active?.kind ?? en.idle}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted">{d.active ? `${Math.max(0, Math.ceil((d.active.ends - (simulated ? state.simNow : Date.now())) / 1000))} ${en.seconds}` : en.idleDetail}</p>
                  <div className="mt-6 text-xs text-muted">{en.scene}: {simulated ? state.simScene : state.obs.scene || en.disconnected}</div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-edge p-4"><button className="btn primary" disabled={busy || !csrf} onClick={() => void action('suspense')}>{en.startSuspense}</button><button className="btn" disabled={busy || !d.active} onClick={() => void action('cancel')}>{en.cancel}</button><p className="w-full text-xs text-muted">{en.suspenseHelp}</p></div>
              </section>
              <section className="panel"><div className="mb-5 flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{en.activity}</h2><span className="text-xs text-muted">{d.activity.warm ? en.ready : en.warmup}</span></div><div className="grid grid-cols-2 gap-5 sm:grid-cols-4">{[[en.messages, d.activity.messages], [en.participants, d.activity.participants], [en.reactions, d.activity.reactions], [en.baseline, d.activity.baseline]].map(([label, value]) => <div key={label}><p className="text-3xl font-semibold tabular-nums">{number.format(Number(value))}</p><p className="mt-2 text-xs text-muted">{label}</p></div>)}</div></section>
              <section className="panel"><h2 className="mb-4 font-semibold">{en.recent}</h2><p className="text-sm text-muted" aria-live="polite">{d.history[0]?.reason ?? en.noHistory}</p></section>
            </div>
            <div className="space-y-6">
              <section className="panel"><h2 className="mb-6 font-semibold">{en.controls}</h2><span className="label">{en.mode}</span><div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-room p-1">{en.modes.map(mode => <button key={mode} disabled={busy} aria-pressed={d.mode === mode} onClick={() => void configure({ mode })} className={`rounded-lg px-2 py-2.5 text-sm ${d.mode === mode ? 'bg-accent text-zinc-950' : 'text-muted'}`}>{mode}</button>)}</div>
                <label className="label" htmlFor="context">{en.context}</label><select id="context" value={d.context} onChange={e => void configure({ context: e.target.value })}>{en.contexts.map(c => <option key={c}>{c}</option>)}</select>
                <div className="mt-6"><label className="label" htmlFor="intensity">{en.intensity} · {number.format(d.intensity * 100)}%</label><input id="intensity" className="w-full" type="range" min="0" max="1" step="0.1" value={d.intensity} onChange={e => void configure({ intensity: Number(e.target.value) })} /></div>
                <fieldset className="mt-5 border-t border-edge pt-5"><legend className="text-xs text-muted">{en.allow}</legend>{en.sequences.map(kind => <label key={kind} className="mt-3 flex items-center gap-3 text-sm"><input type="checkbox" checked={d.authorized.includes(kind)} onChange={e => void configure({ authorized: e.target.checked ? [...d.authorized, kind] : d.authorized.filter(k => k !== kind) })} />{kind}</label>)}</fieldset>
                <div className="mt-6 space-y-3 border-t border-edge pt-5"><button className={`btn w-full ${d.paused ? 'primary' : ''}`} onClick={() => void configure({ paused: !d.paused })}>{d.paused ? en.resume : en.pause}</button><label className="flex items-center justify-between rounded-lg border border-edge p-3 text-sm">{en.dnd}<input type="checkbox" checked={d.dnd} onChange={e => void configure({ dnd: e.target.checked })} /></label><button className="btn w-full text-amber-200" onClick={() => void action('restore')}>{en.restore}</button></div>
              </section>
              <section className="panel"><h2 className="mb-4 font-semibold">{en.proposals}</h2>{d.proposals.length === 0 ? <p className="text-sm text-muted">{en.noProposals}</p> : d.proposals.map(p => <div className="mt-4 border-t border-edge pt-4" key={p.id}><h3>{p.kind}</h3><p className="my-2 text-xs text-muted">{p.reason}</p><div className="flex gap-2">{['approve', 'dismiss'].map(a => <button className={`btn ${a === 'approve' ? 'primary' : ''}`} key={a} disabled={busy} onClick={() => void send({ action: a, target, id: p.id })}>{a === 'approve' ? en.approve : en.dismiss}</button>)}</div></div>)}</section>
            </div>
          </div>
        </>}
        {state && tab === en.nav[1] && <div className="space-y-6"><p className="text-sm text-muted">{en.connectionsHelp}</p><div className="grid gap-6 md:grid-cols-2"><section className="panel"><h2 className="mb-5 text-lg font-semibold">{en.obs}</h2>{status(en.obs, state.obs.status)}<div className="mt-5 flex gap-2"><button className="btn primary" disabled={busy} onClick={async () => { if (await send({ action: 'obs-connect' })) await loadScenes(); }}>{en.connectObs}</button><button className="btn" disabled={busy} onClick={() => void send({ action: 'obs-disconnect' })}>{en.disconnect}</button></div></section><section className="panel"><h2 className="mb-5 text-lg font-semibold">{en.twitch}</h2>{status(en.twitch, state.twitch.status)}<div className="mt-5 flex gap-2"><button className="btn primary" disabled={busy} onClick={() => void send({ action: 'twitch-connect' })}>{en.authorize}</button><button className="btn" disabled={busy} onClick={() => void send({ action: 'twitch-disconnect' })}>{en.disconnect}</button></div>{state.twitch.lastChatAt && <p className="mt-4 text-xs text-muted">{en.chatReceived} · {date(state.twitch.lastChatAt)}</p>}</section></div>
          <section className="panel"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">{en.main} / {en.welcome} / {en.camera}</h2><button className="btn" disabled={busy || state.obs.status !== en.connected} onClick={() => void loadScenes()}>{en.refresh}</button></div><p className="my-4 text-sm text-muted">{en.mappingHelp}</p><div className="grid gap-5 md:grid-cols-2">{(['main', 'welcome', 'cameraScene'] as const).map(key => <label key={key}><span className="label">{en[key]}</span><select value={mapping[key]} onChange={e => key === 'cameraScene' ? void cameraScene(e.target.value) : setMapping(m => ({ ...m, [key]: e.target.value }))}><option value="">{en.select}</option>{scenes.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</select></label>)}<label><span className="label">{en.camera}</span><select value={mapping.cameraId} onChange={e => setMapping(m => ({ ...m, cameraId: Number(e.target.value) }))}><option value={-1}>{en.select}</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label><span className="label">{en.zoom}</span><input type="number" min="1" max="1.2" step="0.01" value={mapping.zoom} onChange={e => setMapping(m => ({ ...m, zoom: Number(e.target.value) }))} /></label></div><div className="mt-6 flex flex-wrap gap-3"><button className="btn primary" disabled={busy} onClick={() => void send({ action: 'map', mapping })}>{en.save}</button><button className="btn" disabled={busy || !state.obs.mapping} onClick={() => void send({ action: 'obs-test' })}>{en.test}</button><button className="btn text-amber-200" disabled={busy || !state.obs.mapping} onClick={() => void send({ action: 'recover-main' })}>{en.recoverMain}</button></div><p className="mt-3 text-xs text-muted">{en.testHelp}</p></section>
          <section className="panel"><h2 className="font-semibold">{en.overlay}</h2><code className="my-4 block break-all rounded-lg bg-room p-4 text-accent">{state.overlayUrl}</code><p className="text-sm text-muted">{en.overlayHelp}</p></section><section className="panel"><h2 className="mb-3 font-semibold">{en.gap}</h2>{state.twitch.gaps.length ? state.twitch.gaps.map(g => <p key={g.from} className="text-sm text-muted">{date(g.from)} – {g.to ? date(g.to) : en.reconnecting}</p>) : <p className="text-sm text-muted">{en.noGap}</p>}</section>
        </div>}
        {state && tab === en.nav[3] && <section className="panel"><div className="mb-6 flex flex-wrap justify-between gap-4"><p className="text-sm text-muted">{en.historyHelp}</p><select className="max-w-48" aria-label={en.source} value={historyOrigin} onChange={e => setHistoryOrigin(e.target.value as 'REAL' | 'SIMULATION')}><option>REAL</option><option>SIMULATION</option></select></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-edge text-xs uppercase tracking-wider text-muted"><tr>{[en.time, en.source, en.status, en.reason, en.duration].map(h => <th key={h} className="px-3 py-4">{h}</th>)}</tr></thead><tbody>{(historyOrigin === 'REAL' ? state.real : state.simulation).history.map(h => <tr key={h.id} className="border-b border-edge/70"><td className="whitespace-nowrap px-3 py-4 text-xs text-muted">{date(h.at)}</td><td className="px-3 py-4 text-xs text-accent">{h.origin}</td><td className="px-3 py-4">{h.status}</td><td className="min-w-64 px-3 py-4 text-muted">{h.reason}</td><td className="px-3 py-4 text-muted">{h.duration === undefined ? '—' : `${number.format(h.duration / 1000)} s`}</td></tr>)}</tbody></table>{(historyOrigin === 'REAL' ? state.real : state.simulation).history.length === 0 && <p className="py-10 text-center text-muted">{en.noHistory}</p>}</div></section>}
      </main>
    </div>
  </div>;
}
