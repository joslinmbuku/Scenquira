import { randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { en } from '../../../packages/shared/src/messages/en';
export const WEB_ORIGIN = 'http://localhost:3000';
const sessions = new Map<string, { csrf: string; expires: number }>();
export function sessionId(req: Request) { return /(?:^|;\s*)scenquira=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1] ?? ''; }
export function session(req: Request) { const s = sessions.get(sessionId(req)); return s && s.expires > Date.now() ? s : undefined; }
export function allowedOrigin(req: Request) { return req.headers.origin === WEB_ORIGIN; }
export function security(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'no-store');
  if (!['localhost:4000', '127.0.0.1:4000'].includes(req.headers.host ?? '')) { res.status(403).json({ error: en.sessionError }); return; }
  if (allowedOrigin(req)) {
    res.setHeader('Access-Control-Allow-Origin', WEB_ORIGIN); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Scenquira-CSRF'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') { res.sendStatus(allowedOrigin(req) ? 204 : 403); return; }
  if (req.path === '/overlay' || req.path === '/overlay/state') { if (req.method !== 'GET') { res.sendStatus(405); return; } next(); return; }
  if (req.path === '/session' && req.method === 'POST') {
    if (!allowedOrigin(req)) { res.status(403).json({ error: en.sessionError }); return; }
    for (const [id, s] of sessions) if (s.expires < Date.now()) sessions.delete(id);
    let id = sessionId(req), s = session(req);
    if (!s) { id = randomBytes(32).toString('hex'); s = { csrf: randomBytes(32).toString('hex'), expires: Date.now() + 12 * 60 * 60_000 }; if (sessions.size >= 32) sessions.delete(sessions.keys().next().value!); sessions.set(id, s); }
    res.cookie('scenquira', id, { httpOnly: true, sameSite: 'lax', maxAge: 12 * 60 * 60_000, path: '/' }); res.json({ csrf: s.csrf }); return;
  }
  if (!session(req) || (req.method !== 'GET' && (!allowedOrigin(req) || req.headers['x-scenquira-csrf'] !== session(req)!.csrf))) { res.status(403).json({ error: en.sessionError }); return; }
  if (req.headers.origin && !allowedOrigin(req)) { res.status(403).json({ error: en.sessionError }); return; }
  next();
}
