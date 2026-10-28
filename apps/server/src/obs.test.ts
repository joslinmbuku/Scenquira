import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const model = vi.hoisted(() => ({ scene: 'Studio', transform: { positionX: 10, positionY: 20, scaleX: 1, scaleY: 1, rotation: 0, boundsType: 'OBS_BOUNDS_NONE' }, writes: [] as string[], client: undefined as EventEmitter | undefined }));
vi.mock('obs-websocket-js', async () => { const { EventEmitter } = await import('node:events'); return ({ default: class extends EventEmitter {
  constructor() { super(); model.client = this; }
  async connect() {} async disconnect() {}
  async call(name: string, data: Record<string, unknown> = {}) {
    if (name === 'GetSceneList') return { currentProgramSceneName: model.scene, scenes: ['Studio', 'Welcome'].map(sceneName => ({ sceneName, sceneUuid: sceneName })) };
    if (name === 'GetCurrentProgramScene') return { currentProgramSceneName: model.scene };
    if (name === 'GetSceneItemList') return { sceneItems: [{ sceneItemId: 1, sourceName: 'Camera' }] };
    if (name === 'GetSceneItemTransform') return { sceneItemTransform: { ...model.transform } };
    if (name === 'SetSceneItemTransform') {
      const transform = data.sceneItemTransform as Record<string, unknown>;
      for (const key of ['boundsWidth', 'boundsHeight']) {
        if (transform[key] !== undefined && Number(transform[key]) < 1) throw new Error('OBS rejects bounds dimensions below 1');
      }
    }
    if (name === 'SetCurrentProgramScene') { model.scene = String(data.sceneName); model.writes.push(name); this.emit('CurrentProgramSceneChanged', { sceneName: model.scene }); }
    if (name === 'SetSceneItemTransform') { model.transform = { ...model.transform, ...(data.sceneItemTransform as object) }; model.writes.push(name); this.emit('SceneItemTransformChanged', { sceneName: data.sceneName, sceneItemId: data.sceneItemId, sceneItemTransform: { ...model.transform } }); }
    return {};
  }
} }); });
import { ObsAdapter } from './obs';
const mapping = { main: 'Studio', welcome: 'Welcome', cameraScene: 'Studio', cameraId: 1, zoom: 1.1 };
async function setup() { const obs = new ObsAdapter(); await obs.connect(); await obs.map(mapping); return obs; }
beforeEach(() => { model.scene = 'Studio'; model.transform = { positionX: 10, positionY: 20, scaleX: 1, scaleY: 1, rotation: 0, boundsType: 'OBS_BOUNDS_NONE' }; model.writes = []; });
describe('OBS ownership and mapping', () => {
  it('zooms and restores free-scale cameras whose unused bounds dimensions are zero', async () => {
    Object.assign(model.transform, { boundsWidth: 0, boundsHeight: 0 });
    const obs = await setup();
    const original = { ...model.transform };
    const takeover = vi.fn(); obs.onTakeover = takeover;
    await obs.begin('zero-bounds', 'Suspense', 0.5, () => true);
    expect(model.transform.scaleX).toBeCloseTo(1.05);
    expect(takeover).not.toHaveBeenCalled();
    await obs.restore('zero-bounds');
    expect(model.transform).toEqual(original);
    expect(model.writes).toHaveLength(2);
  });
  it('correlates expected scene events and restores the exact original scene', async () => { const obs = await setup(); const manual = vi.fn(); obs.onTakeover = manual; await obs.begin('one', 'Raid Welcome', 0.5, () => true); expect(manual).not.toHaveBeenCalled(); expect(model.scene).toBe('Welcome'); await obs.restore('one'); expect(model.scene).toBe('Studio'); });
  it('preserves a subsequent manual scene change', async () => { const obs = await setup(); const manual = vi.fn(); obs.onTakeover = manual; await obs.begin('one', 'Raid Welcome', 0.5, () => true); model.scene = 'Manual'; model.client!.emit('CurrentProgramSceneChanged', { sceneName: 'Manual' }); await obs.restore('one'); expect(manual).toHaveBeenCalledOnce(); expect(model.scene).toBe('Manual'); });
  it('restores exact transforms and leaves untouched properties intact', async () => { const obs = await setup(); const original = { ...model.transform }; await obs.begin('one', 'Hype', 0.5, () => true); expect(model.transform.scaleX).toBeCloseTo(1.05); await obs.restore('one'); expect(model.transform).toEqual(original); });
  it('detects manual framing even when the user returns to the expected value later', async () => { const obs = await setup(); await obs.begin('one', 'Hype', 0.5, () => true); const expected = { ...model.transform }; model.transform.scaleX = 1.5; model.client!.emit('SceneItemTransformChanged', { sceneName: 'Studio', sceneItemId: 1, sceneItemTransform: model.transform }); model.transform = expected; await obs.restore('one'); expect(model.transform.scaleX).toBeCloseTo(1.05); });
  it('yields on manual scene changes during a camera effect', async () => { const obs = await setup(); const manual = vi.fn(); obs.onTakeover = manual; await obs.begin('one', 'Suspense', 0.5, () => true); model.scene = 'Welcome'; model.client!.emit('CurrentProgramSceneChanged', { sceneName: 'Welcome' }); expect(manual).toHaveBeenCalledOnce(); await obs.restore('one'); expect(model.scene).toBe('Welcome'); expect(model.transform.scaleX).toBe(1); });
  it('does not restore invalidated snapshots after a connection loss', async () => { const obs = await setup(); await obs.begin('one', 'Hype', 0.5, () => true); model.client!.emit('ConnectionClosed'); await obs.restore('one'); expect(model.transform.scaleX).toBeCloseTo(1.05); expect(obs.ready()).toBe(false); });
  it('rejects missing mappings without production writes', async () => { const obs = new ObsAdapter(); await obs.connect(); await expect(obs.map({ ...mapping, cameraId: 999 })).rejects.toThrow(); expect(model.writes).toEqual([]); });
});
