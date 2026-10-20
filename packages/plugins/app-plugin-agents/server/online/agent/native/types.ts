import type { OnlineAgentResult } from '../types.js';

export type NativeExecution = {
  admitted?: boolean;
  abort: AbortController;
  task?: Promise<void>;
  finalize?: () => Promise<void>;
  finalizing?: Promise<void>;
};
export type Observation = { result: OnlineAgentResult } | { error: unknown };
export type OnlineAgentExecution = {
  admitted?: boolean;
  observation?: Observation;
  observers: Set<(value: Observation) => void>;
  abort: AbortController;
  task?: Promise<void>;
  finalize?: () => Promise<void>;
  finalizing?: Promise<void>;
};

export type NativeAcceptance = {
  resolve(seq: number): void;
  reject(error: unknown): void;
};
export type OnlineAgentAcceptance = {
  promise: Promise<number>;
  resolve(seq: number): void;
  reject(error: unknown): void;
};
