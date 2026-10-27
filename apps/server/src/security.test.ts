import { describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import { security, WEB_ORIGIN } from './security';
function call(path: string, method: string, headers: Record<string, string> = {}) {
  let status = 200, body: unknown, cookie = '', next = false;
  const req = { path, method, headers: { host: 'localhost:4000', ...headers } } as Request;
  const res = { setHeader() {}, status(s: number) { status = s; return this; }, json(b: unknown) { body = b; }, sendStatus(s: number) { status = s; }, cookie(name: string, value: string) { cookie = `${name}=${value}`; } } as unknown as Response;
  security(req, res, () => { next = true; }); return { status, body: body as { csrf: string }, cookie, next };
}
describe('Loopback control boundary', () => {
  it('rejects unauthenticated control and foreign session bootstraps', () => { expect(call('/command', 'POST', { origin: WEB_ORIGIN }).status).toBe(403); expect(call('/session', 'POST', { origin: 'https://attacker.example' }).status).toBe(403); });
  it('requires both a session and matching origin and CSRF token', () => { const s = call('/session', 'POST', { origin: WEB_ORIGIN }); expect(s.status).toBe(200); const headers = { cookie: s.cookie, origin: WEB_ORIGIN, 'x-scenquira-csrf': s.body.csrf }; expect(call('/command', 'POST', headers).next).toBe(true); expect(call('/command', 'POST', { ...headers, origin: 'https://attacker.example' }).status).toBe(403); expect(call('/command', 'POST', { ...headers, 'x-scenquira-csrf': 'wrong' }).status).toBe(403); });
  it('allows only read access to the overlay and rejects DNS rebinding hosts', () => { expect(call('/overlay/state', 'GET').next).toBe(true); expect(call('/overlay/state', 'POST').status).toBe(405); expect(call('/session', 'POST', { origin: WEB_ORIGIN, host: 'attacker.example:4000' }).status).toBe(403); });
});
