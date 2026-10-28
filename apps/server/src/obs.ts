import OBSWebSocket from 'obs-websocket-js';
import type { Mapping, Sequence } from '../../../packages/shared/src';
import { en } from '../../../packages/shared/src/messages/en';
import type { ProductionAdapter } from './engine';

type Transform = Record<string, number | boolean | string>;
const writable = ['positionX', 'positionY', 'rotation', 'scaleX', 'scaleY', 'alignment', 'boundsType', 'boundsAlignment', 'boundsWidth', 'boundsHeight', 'cropTop', 'cropBottom', 'cropLeft', 'cropRight'] as const;
function clean(value: Record<string, unknown>): Transform {
  return Object.fromEntries(writable.filter(k => value[k] !== undefined).map(k => [k, value[k]])) as Transform;
}
function same(a: Transform, b: Transform) { return writable.every(k => typeof a[k] === 'number' && typeof b[k] === 'number' ? Math.abs(Number(a[k]) - Number(b[k])) < 0.001 : a[k] === b[k]); }
interface Snapshot { id: string; scene?: { before: string; after: string; owned: boolean }; camera?: { scene: string; item: number; before: Transform; after: Transform; owned: boolean } }
export class ObsAdapter implements ProductionAdapter {
  private client = new OBSWebSocket();
  status = en.disconnected as string;
  currentScene = '';
  mapping?: Mapping;
  private snapshot?: Snapshot;
  private expected: { key: string; value: string | Transform; expires: number }[] = [];
  onTakeover: () => void = () => undefined;
  onDisconnect: () => void = () => undefined;
  constructor() {
    this.client.on('ConnectionClosed', () => { this.status = en.disconnected; this.invalidate(); this.mapping = undefined; this.onDisconnect(); });
    this.client.on('ConnectionError', () => { this.status = en.disconnected; });
    this.client.on('CurrentProgramSceneChanged', e => { this.currentScene = e.sceneName; this.changed('scene', e.sceneName); });
    this.client.on('SceneItemTransformChanged', e => this.changed(`camera:${e.sceneName}:${e.sceneItemId}`, clean(e.sceneItemTransform)));
    this.client.on('SceneListChanged', () => { this.mapping = undefined; this.onTakeover(); });
    this.client.on('SceneItemRemoved', () => { this.mapping = undefined; this.onTakeover(); });
  }
  private changed(key: string, value: string | Transform) {
    this.expected = this.expected.filter(e => e.expires > Date.now());
    const i = this.expected.findIndex(e => e.key === key && (typeof value === 'string' ? e.value === value : typeof e.value !== 'string' && same(e.value, value)));
    if (i >= 0) { this.expected.splice(i, 1); return; }
    const s = this.snapshot;
    if (key === 'scene' && s) { if (s.scene) s.scene.owned = false; this.onTakeover(); }
    if (s?.camera?.owned && key === `camera:${s.camera.scene}:${s.camera.item}`) { s.camera.owned = false; this.onTakeover(); }
  }
  private expect(key: string, value: string | Transform) { this.expected.push({ key, value, expires: Date.now() + 1500 }); this.expected = this.expected.slice(-20); }
  ready() { return this.status === en.connected && !!this.mapping; }
  async connect() {
    const url = new URL(process.env.OBS_URL || 'ws://127.0.0.1:4455');
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !['ws:', 'wss:'].includes(url.protocol)) throw new Error(en.obsError);
    await this.client.disconnect().catch(() => undefined);
    this.status = en.reconnecting;
    try { await this.client.connect(url.toString(), process.env.OBS_PASSWORD, { rpcVersion: 1, eventSubscriptions: 0x7ff | (1 << 19) }); this.status = en.connected; this.currentScene = (await this.client.call('GetCurrentProgramScene')).currentProgramSceneName; this.invalidate(); return await this.scenes(); }
    catch { this.status = en.disconnected; throw new Error(en.obsError); }
  }
  async disconnect() { await this.client.disconnect(); this.status = en.disconnected; this.invalidate(); this.mapping = undefined; }
  async scenes() { const result = await this.client.call('GetSceneList'); this.currentScene = result.currentProgramSceneName; return result.scenes.map(s => ({ name: String(s.sceneName), uuid: String(s.sceneUuid ?? '') })); }
  async items(sceneName: string) { return (await this.client.call('GetSceneItemList', { sceneName })).sceneItems.map(i => ({ id: Number(i.sceneItemId), name: String(i.sourceName) })); }
  async map(mapping: Mapping) {
    const scenes = await this.scenes();
    if (![mapping.main, mapping.welcome, mapping.cameraScene].every(n => scenes.some(s => s.name === n)) || !(await this.items(mapping.cameraScene)).some(i => i.id === mapping.cameraId)) throw new Error(en.invalidMapping);
    const framing = await this.client.call('GetSceneItemTransform', { sceneName: mapping.cameraScene, sceneItemId: mapping.cameraId });
    if (framing.sceneItemTransform.boundsType !== 'OBS_BOUNDS_NONE') throw new Error(en.framingError);
    this.mapping = mapping;
  }
  invalidate() { this.snapshot = undefined; this.expected = []; }
  async begin(id: string, kind: Sequence, intensity: number, valid: () => boolean) {
    if (!this.ready()) throw new Error(en.invalidMapping);
    const m = this.mapping!;
    const scene = (await this.client.call('GetCurrentProgramScene')).currentProgramSceneName;
    if (!valid()) return;
    const s: Snapshot = { id }; this.snapshot = s;
    if (kind === 'Raid Welcome') {
      s.scene = { before: scene, after: m.welcome, owned: true };
      this.expect('scene', m.welcome);
      await this.client.call('SetCurrentProgramScene', { sceneName: m.welcome });
    } else if (scene === m.cameraScene && intensity > 0) {
      const before = clean((await this.client.call('GetSceneItemTransform', { sceneName: m.cameraScene, sceneItemId: m.cameraId })).sceneItemTransform);
      if (!valid() || this.snapshot !== s) return;
      // Bounded OBS sources do not visibly zoom through scale; use explicit free-scale framing.
      if (before.boundsType !== 'OBS_BOUNDS_NONE') throw new Error(en.framingError);
      const factor = 1 + (m.zoom - 1) * intensity;
      const after = { ...before, scaleX: Number(before.scaleX) * factor, scaleY: Number(before.scaleY) * factor };
      s.camera = { scene: m.cameraScene, item: m.cameraId, before, after, owned: true };
      this.expect(`camera:${m.cameraScene}:${m.cameraId}`, after);
      // Only write the changed scales. OBS may return zero unused bounds sizes
      // for free-scale sources but rejects those values in transform writes.
      await this.client.call('SetSceneItemTransform', { sceneName: m.cameraScene, sceneItemId: m.cameraId, sceneItemTransform: { scaleX: after.scaleX, scaleY: after.scaleY } });
    }
  }
  async restore(id: string) {
    const s = this.snapshot;
    if (!s || s.id !== id || this.status !== en.connected) return;
    if (s.camera?.owned) {
      const c = s.camera;
      const current = clean((await this.client.call('GetSceneItemTransform', { sceneName: c.scene, sceneItemId: c.item })).sceneItemTransform);
      if (this.snapshot === s && c.owned && same(current, c.after)) {
        this.expect(`camera:${c.scene}:${c.item}`, c.before);
        await this.client.call('SetSceneItemTransform', { sceneName: c.scene, sceneItemId: c.item, sceneItemTransform: { scaleX: c.before.scaleX, scaleY: c.before.scaleY } });
      }
    }
    if (s.scene?.owned) {
      const current = (await this.client.call('GetCurrentProgramScene')).currentProgramSceneName;
      if (this.snapshot === s && s.scene.owned && current === s.scene.after) { this.expect('scene', s.scene.before); await this.client.call('SetCurrentProgramScene', { sceneName: s.scene.before }); }
    }
    if (this.snapshot === s) this.snapshot = undefined;
  }
  async recoverMain() {
    // Explicit recovery after a crash: fresh state and validated mappings, no old snapshot.
    if (!this.ready()) throw new Error(en.invalidMapping);
    await this.client.call('GetCurrentProgramScene');
    this.invalidate(); this.expect('scene', this.mapping!.main);
    await this.client.call('SetCurrentProgramScene', { sceneName: this.mapping!.main });
  }
}
export class SimulatedObs implements ProductionAdapter {
  scene = 'Studio'; scale = 1; connected = true; calls: string[] = [];
  private snapshot?: { id: string; scene: string; scale: number; afterScene: string; afterScale: number; sceneOwned: boolean; scaleOwned: boolean };
  ready() { return this.connected; }
  async begin(id: string, kind: Sequence, intensity: number, valid: () => boolean) {
    if (!valid()) return;
    this.snapshot = { id, scene: this.scene, scale: this.scale, afterScene: kind === 'Raid Welcome' ? 'Welcome' : this.scene, afterScale: kind === 'Raid Welcome' ? this.scale : 1 + intensity * 0.1, sceneOwned: kind === 'Raid Welcome', scaleOwned: kind !== 'Raid Welcome' };
    this.scene = this.snapshot.afterScene; this.scale = this.snapshot.afterScale; this.calls.push(kind);
  }
  async restore(id: string) {
    const s = this.snapshot;
    if (s?.id === id) { if (s.sceneOwned && this.scene === s.afterScene) this.scene = s.scene; if (s.scaleOwned && this.scale === s.afterScale) this.scale = s.scale; this.snapshot = undefined; }
  }
  manual(property: 'scene' | 'scale') { if (property === 'scene') { this.scene = 'Manual scene'; if (this.snapshot) this.snapshot.sceneOwned = false; } else { this.scale = 1.37; if (this.snapshot) this.snapshot.scaleOwned = false; } }
  invalidate() { this.snapshot = undefined; }
}
