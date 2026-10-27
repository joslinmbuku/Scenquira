export type Mode = 'Observe' | 'Suggest' | 'Auto';
export type Context = 'Normal' | 'Explanation' | 'Suspense';
export type Sequence = 'Hype' | 'Raid Welcome' | 'Suspense';
export type Origin = 'REAL' | 'SIMULATION';
export interface Activity { messages: number; participants: number; reactions: number; rate: number; baseline: number; ratio: number; warm: boolean }
export interface NormalEvent { id: string; at: number; origin: Origin; kind: 'chat' | 'raid'; user: string; text?: string; viewers?: number; reaction?: boolean }
export interface Proposal { id: string; kind: Sequence; origin: Origin; at: number; expires: number; reason: string; name?: string; viewers?: number; explicit?: boolean }
export interface LogEntry { id: string; at: number; origin: Origin; status: 'Observed' | 'Proposed' | 'Blocked' | 'Started' | 'Completed' | 'Cancelled' | 'Error' | 'Info'; reason: string; kind?: Sequence; duration?: number; decisionMs?: number; acknowledgementMs?: number }
export interface Mapping { main: string; welcome: string; cameraScene: string; cameraId: number; zoom: number }
export interface DirectorState { mode: Mode; context: Context; paused: boolean; dnd: boolean; intensity: number; authorized: Sequence[]; activity: Activity; proposals: Proposal[]; active?: { id: string; kind: Sequence; ends: number }; history: LogEntry[]; origin: Origin }
export interface Overlay { kind: Sequence; ends: number; name?: string; viewers?: number; intensity: number; origin: Origin }
