import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';
export * from '../errors.ts';

export interface Clock {
  now(): number;
}
export interface Scheduler {
  setTimer(callback: () => void, delayMs: number): () => void;
}
export interface ResourceSpec {
  namespace: string;
  name: string;
  ttl: number;
  kind: 'lock';
}
export type WaitPolicy =
  | { kind: 'single' }
  | { kind: 'bounded'; deadline: number }
  | { kind: 'unbounded' };
export interface BackendAcquireRequest {
  readonly requestId: string;
  readonly token: string;
  readonly resource: ResourceSpec;
  readonly wait: WaitPolicy;
  readonly signal: AbortSignal;
}
export interface BackendGrant {
  readonly notAfter: number;
  release(): Promise<void>;
}
export interface BackendContext {
  readonly protocolVersion: 1;
  readonly managerId: string;
  readonly namespace: string;
  readonly operationTimeoutMs: number;
  readonly cleanupTimeoutMs: number;
  readonly clock: Clock;
  readonly scheduler: Scheduler;
}
export interface ConcurrentBackendSession {
  readonly protocolVersion: 1;
  validateResource(resource: ResourceSpec): Promise<void>;
  acquire(request: BackendAcquireRequest): Promise<BackendGrant | undefined>;
  close(): Promise<void>;
}
export interface ConcurrentBackend {
  openSession(context: BackendContext): Promise<ConcurrentBackendSession>;
  close(): Promise<void>;
}
export const defaultClock: Clock = Object.freeze({
  now: () => performance.now(),
});
export const defaultScheduler: Scheduler = Object.freeze({
  setTimer(callback: () => void, delayMs: number): () => void {
    const timer = setTimeout(callback, delayMs);
    return () => clearTimeout(timer);
  },
});
/** The native mutex library adds its own prefix; the lock kind is not encoded twice. */
export function encodeResourceKey(
  resource: Pick<ResourceSpec, 'namespace' | 'name'>,
): string {
  return `nb-concurrency:v2:${Buffer.from(JSON.stringify([resource.namespace, resource.name]), 'utf8').toString('base64url')}`;
}
