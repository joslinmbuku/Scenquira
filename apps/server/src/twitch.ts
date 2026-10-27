import { randomBytes } from 'node:crypto';
import WebSocket from 'ws';
import { en } from '../../../packages/shared/src/messages/en';
import type { NormalEvent } from '../../../packages/shared/src';

interface Token { access_token: string; refresh_token: string; expires_in: number }
interface Validation { client_id: string; user_id: string; scopes: string[]; expires_in: number }
interface Envelope {
  metadata: { message_id: string; message_type: string; message_timestamp: string; subscription_type?: string };
  payload: { session?: { id: string; keepalive_timeout_seconds?: number; reconnect_url?: string }; subscription?: { type: string; status: string }; event?: { broadcaster_user_id?: string; chatter_user_id?: string; message?: { text: string; fragments?: { type: string }[] }; from_broadcaster_user_name?: string; to_broadcaster_user_id?: string; viewers?: number } };
}
export function normalizeTwitch(m: Envelope, broadcaster: string): NormalEvent | undefined {
  const e = m.payload.event;
  if (!e || m.metadata.message_type !== 'notification') return;
  const common = { id: m.metadata.message_id, at: Date.parse(m.metadata.message_timestamp), origin: 'REAL' as const };
  const type = m.payload.subscription?.type ?? m.metadata.subscription_type;
  if (type === 'channel.chat.message' && e.broadcaster_user_id === broadcaster && e.chatter_user_id && typeof e.message?.text === 'string') return { ...common, kind: 'chat', user: e.chatter_user_id, text: e.message.text.slice(0, 2000), reaction: e.message.fragments?.some(f => f.type === 'emote') };
  if (type === 'channel.raid' && e.to_broadcaster_user_id === broadcaster && e.from_broadcaster_user_name && Number.isInteger(e.viewers)) return { ...common, kind: 'raid', user: e.from_broadcaster_user_name, viewers: e.viewers };
}
export class TwitchConnector {
  status: string = en.disconnected;
  userId = '';
  lastChatAt?: number;
  gaps: { from: number; to?: number }[] = [];
  private tokens?: Token;
  private oauth?: { state: string; session: string; expires: number };
  private socket?: WebSocket;
  private candidate?: WebSocket;
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private validationTimer?: ReturnType<typeof setInterval>;
  private retry?: ReturnType<typeof setTimeout>;
  private stopped = true;
  private refreshInFlight?: Promise<void>;
  constructor(private onEvent: (event: NormalEvent) => Promise<void>, private log: (reason: string, error?: boolean) => void) {}
  private config() {
    const client = process.env.TWITCH_CLIENT_ID, secret = process.env.TWITCH_CLIENT_SECRET;
    if (!client || !secret) throw new Error(en.notConfigured);
    return { client, secret, redirect: process.env.TWITCH_REDIRECT_URI || 'http://localhost:4000/auth/twitch/callback' };
  }
  authorize(session: string) {
    const c = this.config();
    this.oauth = { state: randomBytes(32).toString('hex'), session, expires: Date.now() + 600_000 };
    return `https://id.twitch.tv/oauth2/authorize?${new URLSearchParams({ client_id: c.client, redirect_uri: c.redirect, response_type: 'code', scope: 'user:read:chat', state: this.oauth.state, force_verify: 'true' })}`;
  }
  async callback(code: string, state: string, session: string) {
    const expected = this.oauth; this.oauth = undefined;
    if (!expected || expected.state !== state || expected.session !== session || expected.expires < Date.now() || !code) throw new Error(en.authError);
    const c = this.config();
    await this.disconnect(false);
    const response = await fetch('https://id.twitch.tv/oauth2/token', { method: 'POST', body: new URLSearchParams({ client_id: c.client, client_secret: c.secret, code, grant_type: 'authorization_code', redirect_uri: c.redirect }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(en.authError);
    this.tokens = await response.json() as Token;
    try {
      await this.validate(); this.stopped = false; this.open();
      this.validationTimer = setInterval(() => { void this.validate().catch(() => this.failAuthorization()); }, 55 * 60_000);
    } catch { await this.disconnect(false); throw new Error(en.authError); }
  }
  private async refresh() {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = (async () => {
      const c = this.config(), token = this.tokens;
      if (!token?.refresh_token) throw new Error(en.authError);
      const r = await fetch('https://id.twitch.tv/oauth2/token', { method: 'POST', body: new URLSearchParams({ client_id: c.client, client_secret: c.secret, grant_type: 'refresh_token', refresh_token: token.refresh_token }), signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(en.authError);
      const next = await r.json() as Token;
      if (this.tokens === token) this.tokens = next;
    })().finally(() => { this.refreshInFlight = undefined; });
    return this.refreshInFlight;
  }
  private async validate() {
    if (!this.tokens) throw new Error(en.authError);
    const request = () => fetch('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: `OAuth ${this.tokens!.access_token}` }, signal: AbortSignal.timeout(10000) });
    let r = await request();
    if (r.status === 401) { await this.refresh(); r = await request(); }
    if (!r.ok) throw new Error(en.authError);
    const v = await r.json() as Validation;
    if (v.client_id !== this.config().client || !v.user_id || !v.scopes.includes('user:read:chat') || (this.userId && this.userId !== v.user_id)) throw new Error(en.authError);
    this.userId = v.user_id;
    if (v.expires_in < 3600) await this.refresh();
  }
  private async subscribe(sessionId: string) {
    const subscriptions = [
      { type: 'channel.chat.message', condition: { broadcaster_user_id: this.userId, user_id: this.userId } },
      { type: 'channel.raid', condition: { to_broadcaster_user_id: this.userId } },
    ];
    await Promise.all(subscriptions.map(async subscription => {
      const send = () => fetch('https://api.twitch.tv/helix/eventsub/subscriptions', { method: 'POST', headers: { Authorization: `Bearer ${this.tokens!.access_token}`, 'Client-Id': this.config().client, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...subscription, version: '1', transport: { method: 'websocket', session_id: sessionId } }), signal: AbortSignal.timeout(8000) });
      let r = await send(); if (r.status === 401) { await this.refresh(); r = await send(); }
      if (!r.ok) throw new Error(en.authError);
    }));
  }
  private arm(seconds: number) { clearTimeout(this.timer); this.timer = setTimeout(() => this.lost(), seconds * 1000 + 1000); }
  private open(url = 'wss://eventsub.wss.twitch.tv/ws', migration = false) {
    if (this.stopped) return;
    const parsed = new URL(url);
    if (parsed.protocol !== 'wss:' || parsed.hostname !== 'eventsub.wss.twitch.tv') { this.lost(); return; }
    const generation = this.generation;
    const previous = this.socket;
    const ws = new WebSocket(url);
    if (migration) this.candidate = ws; else { this.socket = ws; this.status = en.reconnecting; }
    let timeout = 10;
    const welcomeTimeout = setTimeout(() => { if (this.candidate === ws || this.socket === ws) this.lost(); }, 12_000);
    ws.on('message', data => { void (async () => {
      if (this.stopped || generation !== this.generation) return;
      const m = JSON.parse(data.toString()) as Envelope;
      if (m.metadata.message_type === 'session_welcome') {
        clearTimeout(welcomeTimeout);
        const session = m.payload.session;
        if (!session?.id) throw new Error(en.authError);
        timeout = session.keepalive_timeout_seconds ?? 10;
        if (migration) { this.socket = ws; this.candidate = undefined; previous?.close(); }
        else await this.subscribe(session.id);
        if (this.stopped || generation !== this.generation) return;
        this.status = en.connected; this.arm(timeout);
        const gap = this.gaps.at(-1); if (gap && !gap.to) gap.to = Date.now();
        this.log(en.twitchReady); return;
      }
      if (ws === this.socket) this.arm(timeout);
      if (m.metadata.message_type === 'session_reconnect') {
        if (!this.candidate && m.payload.session?.reconnect_url) this.open(m.payload.session.reconnect_url, true);
      } else if (m.metadata.message_type === 'revocation') { await this.failAuthorization(); }
      else {
        const event = normalizeTwitch(m, this.userId);
        if (event) { if (event.kind === 'chat') { this.lastChatAt = Date.now(); this.log(en.chatReceived); } await this.onEvent(event); }
      }
    })().catch(() => { if (!this.stopped && generation === this.generation) void this.failAuthorization(); }); });
    ws.on('close', () => { clearTimeout(welcomeTimeout); if (!this.stopped && generation === this.generation && (this.socket === ws || this.candidate === ws)) this.lost(); });
    ws.on('error', () => { /* Close event handles transport failures without leaking credentials. */ });
  }
  private lost() {
    if (this.stopped) return;
    this.generation++; clearTimeout(this.timer); clearTimeout(this.retry);
    this.socket?.terminate(); this.candidate?.terminate(); this.socket = undefined; this.candidate = undefined;
    this.status = en.reconnecting;
    if (!this.gaps.at(-1) || this.gaps.at(-1)!.to) { this.gaps.push({ from: Date.now() }); this.gaps = this.gaps.slice(-20); this.log(en.eventGap); }
    this.retry = setTimeout(() => { void this.validate().then(() => this.open()).catch(() => this.failAuthorization()); }, 3000);
  }
  private async failAuthorization() { this.log(en.twitchRevoked, true); await this.disconnect(false); }
  async disconnect(revoke = true) {
    const token = this.tokens;
    this.stopped = true; this.generation++; clearTimeout(this.timer); clearTimeout(this.retry); clearInterval(this.validationTimer);
    this.socket?.close(); this.candidate?.close(); this.socket = undefined; this.candidate = undefined; this.tokens = undefined; this.userId = ''; this.status = en.disconnected;
    if (token && revoke) {
      const c = this.config();
      await fetch('https://id.twitch.tv/oauth2/revoke', { method: 'POST', body: new URLSearchParams({ client_id: c.client, token: token.access_token }), signal: AbortSignal.timeout(8000) }).catch(() => this.log(en.revokeHelp, true));
    }
  }
}
