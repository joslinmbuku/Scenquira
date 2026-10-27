import 'reflect-metadata';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { Controller, Get, Post, Body, Query, Req, Res, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { Director } from './engine';
import { ObsAdapter } from './obs';
import { TwitchConnector } from './twitch';
import { Simulator } from './simulator';
import { security, sessionId, WEB_ORIGIN } from './security';
import { en } from '../../../packages/shared/src/messages/en';

config({ path: resolve(__dirname, '../../../.env'), quiet: true });
config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
config({ path: resolve(process.cwd(), '.env'), quiet: true });
const obs = new ObsAdapter();
const real = new Director('REAL', obs, undefined, process.env.TWITCH_BOT_USER_ID);
const sim = new Simulator();
obs.onTakeover = () => { real.log('Info', en.takeover); void real.cancel(); };
obs.onDisconnect = () => { void real.disconnected(); };
const twitch = new TwitchConnector(e => real.ingest(e), (reason, error) => real.log(error ? 'Error' : 'Info', reason));
const sequence = z.enum(['Hype', 'Raid Welcome', 'Suspense']);
const configuration = z.object({ mode: z.enum(['Observe', 'Suggest', 'Auto']).optional(), context: z.enum(['Normal', 'Explanation', 'Suspense']).optional(), paused: z.boolean().optional(), dnd: z.boolean().optional(), intensity: z.number().min(0).max(1).optional(), authorized: z.array(sequence).max(3).optional() }).strict();
const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('configure'), target: z.enum(['REAL', 'SIMULATION']), value: configuration }),
  z.object({ action: z.enum(['suspense', 'cancel', 'restore']), target: z.enum(['REAL', 'SIMULATION']) }),
  z.object({ action: z.enum(['approve', 'dismiss']), target: z.enum(['REAL', 'SIMULATION']), id: z.string().max(200) }),
  z.object({ action: z.literal('simulate'), scenario: z.enum(['warm', 'hype', 'raid', 'spam', 'stale', 'duplicate', 'manual', 'reset']) }),
  z.object({ action: z.enum(['obs-connect', 'obs-disconnect', 'obs-test', 'recover-main', 'twitch-connect', 'twitch-disconnect']) }),
  z.object({ action: z.literal('map'), mapping: z.object({ main: z.string().min(1).max(500), welcome: z.string().min(1).max(500), cameraScene: z.string().min(1).max(500), cameraId: z.number().int().min(0), zoom: z.number().min(1).max(1.2) }) })
]);
let testRunning = false;
@Controller()
class AppController {
  @Get('state') state() { return { real: real.snapshot(), simulation: sim.director.snapshot(), simOverlay: sim.director.overlay, simScene: sim.adapter.scene, simNow: sim.clock.now(), obs: { status: obs.status, scene: obs.currentScene, mapping: obs.mapping }, twitch: { status: twitch.status, lastChatAt: twitch.lastChatAt, gaps: twitch.gaps }, overlayUrl: 'http://localhost:4000/overlay' }; }
  @Get('scenes') async scenes(@Res() res: Response) { try { res.json(await obs.scenes()); } catch { res.status(400).json({ error: en.obsError }); } }
  @Get('items') async items(@Query('scene') scene: string, @Res() res: Response) { try { if (!scene || scene.length > 500) throw new Error(); res.json(await obs.items(scene)); } catch { res.status(400).json({ error: en.invalidMapping }); } }
  @Post('command') async command(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const parsed = command.safeParse(body);
    if (!parsed.success) { res.status(400).json({ error: en.invalidCommand }); return; }
    const c = parsed.data;
    try {
      if ('target' in c) {
        const d = c.target === 'REAL' ? real : sim.director;
        if (c.action === 'configure') {
          if (c.target === 'REAL' && c.value.mode === 'Auto' && (!obs.ready() || testRunning)) throw new Error(en.blocked.mapping);
          await d.configure(c.value);
        }
        if (c.action === 'suspense') await d.suspense();
        if (c.action === 'cancel') await d.cancel();
        if (c.action === 'restore') await d.cancel(true);
        if (c.action === 'approve') await d.approve(c.id);
        if (c.action === 'dismiss') d.dismiss(c.id);
      } else if (c.action === 'simulate') await sim.run(c.scenario);
      else if (c.action === 'obs-connect') { await real.cancel(true); await obs.connect(); await real.disconnected(); }
      else if (c.action === 'obs-disconnect') { await real.cancel(true); await obs.disconnect(); }
      else if (c.action === 'map') { await real.cancel(true); await obs.map(c.mapping); real.log('Info', en.mappingSaved); }
      else if (c.action === 'twitch-connect') { res.json({ url: twitch.authorize(sessionId(req)) }); return; }
      else if (c.action === 'twitch-disconnect') { await real.cancel(); await twitch.disconnect(); }
      else if (c.action === 'recover-main') { await real.cancel(true); await obs.recoverMain(); }
      else if (c.action === 'obs-test') {
        if (!obs.ready() || testRunning) throw new Error(en.blocked.mapping);
        testRunning = true;
        try {
          await real.cancel(true);
          // Route explicit scene tests through the same cancellable ownership scheduler.
          await real.configure({ mode: 'Suggest', paused: false });
          await real.ingest({ id: `test-${Date.now()}`, at: Date.now(), origin: 'REAL', kind: 'raid', user: 'Connection test', viewers: 0 });
          const p = real.state.proposals.at(-1); if (p) await real.approve(p.id);
        } finally { testRunning = false; }
      }
      res.json({ ok: true });
    } catch (error) { const known = new Set<string>([en.obsError, en.invalidMapping, en.framingError, en.blocked.mapping, en.notConfigured, en.authError]); const reason = error instanceof Error && known.has(error.message) ? error.message : en.error; real.log('Error', reason); res.status(400).json({ error: reason }); }
  }
  @Get('auth/twitch/callback') async callback(@Query('code') code: string, @Query('state') state: string, @Req() req: Request, @Res() res: Response) {
    try { await twitch.callback(code, state, sessionId(req)); res.redirect(`${WEB_ORIGIN}/?twitch=connected`); }
    catch { real.log('Error', en.authError); res.redirect(`${WEB_ORIGIN}/?twitch=error`); }
  }
  @Get('overlay/state') overlayState() { return { overlay: real.overlay ?? null, now: Date.now() }; }
  @Get('overlay') overlay(@Res() res: Response) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'");
    res.type('html').send(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Scenquira overlay</title><style>body{margin:0;background:transparent;color:white;font-family:system-ui}#effect{position:fixed;bottom:9%;left:10%;right:10%;text-align:center;text-shadow:0 2px 8px #000}h1{font-size:64px}p{font-size:30px}.card{display:inline-block;padding:20px 60px;border-radius:24px;background:#25163ae8;border:2px solid #bca0ff}</style><div id="effect" aria-live="polite"></div><script>const root=document.getElementById('effect');async function tick(){try{const r=await fetch('/overlay/state',{cache:'no-store'});if(!r.ok)throw Error();const s=await r.json();root.replaceChildren();const o=s.overlay;if(o&&o.ends>s.now){const card=document.createElement('div');card.className='card';card.style.opacity=String(.65+.35*o.intensity);const h=document.createElement('h1');h.textContent=o.kind==='Hype'?${JSON.stringify(en.hypeTitle)}:o.kind==='Raid Welcome'?${JSON.stringify(en.welcomeTitle)}:String(Math.ceil((o.ends-s.now)/1000));card.append(h);if(o.kind==='Raid Welcome'){const p=document.createElement('p');p.textContent=o.name+' · '+new Intl.NumberFormat('en').format(o.viewers)+' viewers';card.append(p)}root.append(card)}}catch{root.replaceChildren()}}setInterval(tick,200);tick();</script></html>`);
  }
}
@Module({ controllers: [AppController] })
class AppModule {}
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'], bodyParser: true });
  app.use(security);
  await app.listen(4000, '127.0.0.1');
  console.log('Scenquira local service: http://localhost:4000');
  const shutdown = () => { void Promise.all([real.cancel(true), sim.director.cancel(true), twitch.disconnect(false)]).finally(() => app.close()); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}
void bootstrap();
