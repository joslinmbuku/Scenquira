import { randomUUID } from 'node:crypto';
import { Director, type Clock } from './engine';
import { SimulatedObs } from './obs';
export class Simulator {
  offset = 0;
  clock: Clock = { now: () => Date.now() + this.offset, later: (fn, ms) => { const id = setTimeout(fn, ms); return () => clearTimeout(id); } };
  adapter = new SimulatedObs();
  director = new Director('SIMULATION', this.adapter, this.clock);
  async run(scenario: string) {
    const raid = { id: randomUUID(), at: this.clock.now(), origin: 'SIMULATION' as const, kind: 'raid' as const, user: 'CommunityGuest', viewers: 42 };
    if (scenario === 'warm') { if (!this.director.state.active) this.offset += 70_000; }
    if (scenario === 'raid') await this.director.ingest(raid);
    if (scenario === 'stale') await this.director.ingest({ ...raid, at: raid.at - 60_000 });
    if (scenario === 'duplicate') { await this.director.ingest(raid); await this.director.ingest(raid); }
    if (scenario === 'hype' || scenario === 'spam') {
      for (let i = 0; i < 10; i++) await this.director.ingest({ id: randomUUID(), at: this.clock.now(), origin: 'SIMULATION', kind: 'chat', user: scenario === 'spam' ? 'OneViewer' : `Viewer${i % 5}`, text: 'HYPE bravo 🎉' });
    }
    if (scenario === 'manual') { this.adapter.manual(this.director.state.active?.kind === 'Raid Welcome' ? 'scene' : 'scale'); await this.director.cancel(); }
    if (scenario === 'reset') { await this.director.cancel(); this.offset = 0; this.adapter = new SimulatedObs(); this.director = new Director('SIMULATION', this.adapter, this.clock); }
  }
}
