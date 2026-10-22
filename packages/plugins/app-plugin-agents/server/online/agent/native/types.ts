import type { OnlineAgentSandbox } from '../../sandbox/types.js';
import type { NativeToolExecution } from '../../sandbox/execution.js';
import type { OnlineAgentResult } from '../types.js';

export type NativeExecution = {
  admitted?: boolean;
  sandbox?: Promise<OnlineAgentSandbox>;
  toolExecution?: NativeToolExecution;
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
  sandbox?: Promise<OnlineAgentSandbox>;
  toolExecution?: NativeToolExecution;
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
