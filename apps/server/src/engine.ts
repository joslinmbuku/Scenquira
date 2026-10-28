import { randomUUID } from 'node:crypto';
import type { Activity, Context, DirectorState, LogEntry, Mode, NormalEvent, Origin, Overlay, Proposal, Sequence } from '../../../packages/shared/src';
import { en } from '../../../packages/shared/src/messages/en';

export interface Clock { now(): number; later(fn: () => void, ms: number): () => void }
export const clock: Clock = { now: () => Date.now(), later: (fn, ms) => { const id = setTimeout(fn, ms); return () => clearTimeout(id); } };
export interface ProductionAdapter {
  ready(): boolean;
  begin(id: string, kind: Sequence, intensity: number, valid: () => boolean): Promise<void>;
  restore(id: string): Promise<void>;
  invalidate(): void;
}
export class EventNormalizer {
  private seen = new Map<string, number>();
  constructor(private time: Clock) {}
  accept(e: NormalEvent): 'fresh' | 'duplicate' | 'stale' | 'invalid' {
    const now = this.time.now();
    for (const [id, at] of this.seen) if (now - at > 120_000) this.seen.delete(id);
    if (!e.id || !e.user || !Number.isFinite(e.at) || (e.kind === 'raid' && (!Number.isInteger(e.viewers) || e.viewers! < 0))) return 'invalid';
    if (this.seen.has(e.id)) return 'duplicate';
    this.seen.set(e.id, now);
    if (this.seen.size > 5000) this.seen.delete(this.seen.keys().next().value!);
    return now - e.at > 15_000 || e.at > now + 2000 ? 'stale' : 'fresh';
  }
}
export class ActivityAnalyzer {
  private events: { at: number; user: string; reaction: boolean }[] = [];
  private started: number;
  constructor(private time: Clock, private bot = '') { this.started = time.now(); }
  add(e: NormalEvent) {
    if (e.user === this.bot) return;
    this.prune();
    if (this.events.filter(x => x.user === e.user && x.at > this.time.now() - 10_000).length >= 3) return;
    this.events.push({ at: e.at, user: e.user, reaction: !!e.reaction || /\b(hype|pog|pogchamp|letsgo|wow|gg|bravo|incroyable|allez)\b|🔥|🎉/iu.test(e.text ?? '') });
    if (this.events.length > 10000) this.events.shift();
  }
  private prune() { this.events = this.events.filter(e => e.at > this.time.now() - 70_000); }
  metrics(): Activity {
    this.prune();
    const recent = this.events.filter(e => e.at > this.time.now() - 10_000);
    const baseline = (this.events.length - recent.length) / 60;
    const rate = recent.length / 10;
    return { messages: recent.length, participants: new Set(recent.map(e => e.user)).size, reactions: recent.filter(e => e.reaction).length, rate, baseline, ratio: rate / Math.max(baseline, 0.1), warm: this.time.now() - this.started >= 70_000 };
  }
}
export class DirectorPolicy {
  static blocked(s: DirectorState, p: Proposal, now: number, ready: boolean, approval: boolean, starts: number[], lastHype: number): string | undefined {
    if (s.paused) return en.blocked.paused;
    if (s.dnd) return en.blocked.dnd;
    if (s.mode === 'Observe') return en.blocked.observe;
    if (approval && s.mode !== 'Suggest') return en.blocked.mode;
    if (p.expires <= now) return en.blocked.stale;
    if (s.active) return en.blocked.busy;
    if (!ready) return en.blocked.mapping;
    if (s.mode === 'Auto' && !p.explicit && !s.authorized.includes(p.kind)) return en.blocked.permission;
    if (p.kind === 'Hype' && s.context !== 'Normal') return en.blocked.context;
    if (p.kind === 'Hype' && now - lastHype < 45_000) return en.blocked.cooldown;
    if (!p.explicit && starts.filter(t => now - t < 60_000).length >= 3) return en.blocked.budget;
    return undefined;
  }
}
export class Director {
  state: DirectorState;
  overlay?: Overlay;
  normalizer: EventNormalizer;
  analyzer: ActivityAnalyzer;
  private starts: number[] = [];
  private lastHype = -Infinity;
  private execution?: { id: string; cancelled: boolean; started: number; ready: Promise<void>; timer?: () => void; finishing?: Promise<void> };
  constructor(public origin: Origin, private adapter: ProductionAdapter, public time: Clock = clock, bot = '') {
    this.normalizer = new EventNormalizer(time); this.analyzer = new ActivityAnalyzer(time, bot);
    this.state = { mode: 'Observe', context: 'Normal', paused: false, dnd: false, intensity: 0.5, authorized: [], activity: this.analyzer.metrics(), proposals: [], history: [], origin };
  }
  snapshot(): DirectorState { this.state.activity = this.analyzer.metrics(); this.state.proposals = this.state.proposals.filter(p => p.expires > this.time.now()); return this.state; }
  log(status: LogEntry['status'], reason: string, kind?: Sequence, extra: Partial<LogEntry> = {}) {
    this.state.history.unshift({ id: randomUUID(), at: this.time.now(), origin: this.origin, status, reason, kind, ...extra });
    this.state.history.length = Math.min(300, this.state.history.length);
  }
  async ingest(e: NormalEvent) {
    if (e.origin !== this.origin) return;
    const received = this.time.now();
    const accepted = this.normalizer.accept(e);
    if (accepted !== 'fresh') { this.log('Blocked', en.blocked[accepted]); return; }
    if (e.kind === 'chat') {
      this.analyzer.add(e); const m = this.analyzer.metrics();
      if (!(m.warm && m.messages >= 10 && m.participants >= 5 && m.reactions >= 3 && m.ratio > 2.5)) return;
    }
    await this.propose({ id: e.id, kind: e.kind === 'raid' ? 'Raid Welcome' : 'Hype', origin: e.origin, at: e.at, expires: e.at + 15_000, reason: e.kind === 'raid' ? en.raidReason : en.hypeReason, name: e.kind === 'raid' ? e.user.slice(0, 100) : undefined, viewers: e.viewers }, false, received);
  }
  async suspense() { const at = this.time.now(); await this.propose({ id: randomUUID(), kind: 'Suspense', origin: this.origin, at, expires: at + 15_000, reason: en.suspenseReason, explicit: true }); }
  async approve(id: string) {
    const p = this.state.proposals.find(x => x.id === id);
    this.state.proposals = this.state.proposals.filter(x => x.id !== id);
    if (!p) { this.log('Blocked', en.blocked.stale); return; }
    await this.propose(p, true);
  }
  dismiss(id: string) { this.state.proposals = this.state.proposals.filter(p => p.id !== id); this.log('Info', en.dismissed); }
  private async propose(p: Proposal, approval = false, received = this.time.now()) {
    const blocked = DirectorPolicy.blocked(this.snapshot(), p, this.time.now(), this.adapter.ready(), approval, this.starts, this.lastHype);
    if (blocked) { this.log(blocked === en.blocked.observe ? 'Observed' : 'Blocked', blocked, p.kind, { decisionMs: this.time.now() - received }); return; }
    if (this.state.mode === 'Suggest' && !approval) {
      if (this.state.proposals.some(x => x.kind === p.kind)) return;
      this.state.proposals.push(p); this.log('Proposed', p.reason, p.kind); return;
    }
    const duration = p.kind === 'Hype' ? 3000 : p.kind === 'Raid Welcome' ? 5000 : 10000;
    const exec = { id: randomUUID(), cancelled: false, started: this.time.now(), ready: Promise.resolve() } as NonNullable<typeof this.execution>;
    this.execution = exec; this.state.active = { id: exec.id, kind: p.kind, ends: this.time.now() + duration }; this.state.proposals = [];
    this.starts = this.starts.filter(t => this.time.now() - t < 60_000);
    if (!p.explicit) this.starts.push(this.time.now());
    if (p.kind === 'Hype') this.lastHype = this.time.now();
    this.log('Started', p.reason, p.kind, { decisionMs: this.time.now() - received });
    try {
      exec.ready = this.adapter.begin(exec.id, p.kind, this.state.intensity, () => !exec.cancelled);
      await exec.ready;
      if (exec.cancelled) return;
      this.log('Info', en.acknowledged, p.kind, { acknowledgementMs: this.time.now() - exec.started });
      this.overlay = { kind: p.kind, ends: this.time.now() + duration, name: p.name, viewers: p.viewers, intensity: this.state.intensity, origin: this.origin };
      this.state.active!.ends = this.overlay.ends;
      exec.timer = this.time.later(() => { void this.finish(exec, false); }, duration);
    } catch { this.log('Error', en.failure, p.kind); this.state.mode = 'Observe'; await this.finish(exec, true); }
  }
  private finish(exec: NonNullable<typeof this.execution>, cancelled: boolean): Promise<void> {
    if (exec.finishing) return exec.finishing;
    exec.cancelled = true; exec.timer?.(); this.overlay = undefined;
    exec.finishing = (async () => {
      await exec.ready.catch(() => undefined);
      try { await this.adapter.restore(exec.id); } catch { this.log('Error', en.failure); this.state.mode = 'Observe'; }
      if (this.execution === exec) {
        this.log(cancelled ? 'Cancelled' : 'Completed', cancelled ? en.stop : en.completed, this.state.active?.kind, { duration: this.time.now() - exec.started });
        this.execution = undefined; this.state.active = undefined;
      }
    })();
    return exec.finishing;
  }
  async cancel(pause = false) { if (pause) this.state.paused = true; this.state.proposals = []; if (this.execution) await this.finish(this.execution, true); }
  async configure(v: { mode?: Mode; context?: Context; paused?: boolean; dnd?: boolean; intensity?: number; authorized?: Sequence[] }) {
    const stop = (v.mode !== undefined && v.mode !== this.state.mode) || v.paused === true || v.dnd === true || (v.context !== undefined && v.context !== this.state.context) || (v.authorized !== undefined && this.state.active !== undefined && !v.authorized.includes(this.state.active.kind));
    Object.assign(this.state, v);
    if (stop) await this.cancel();
  }
  async disconnected() { this.adapter.invalidate(); this.state.mode = 'Observe'; await this.cancel(); this.log('Info', en.reconnected); }
}
