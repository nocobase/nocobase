/**
 * The private Node IPC channel between a supervisor and its managed App Host child, which carries the management
 * service. A request is answered by one final response; long-running requests are acknowledged first (`accepted`,
 * after which only the child's exit ends the wait), and may stream deployment log entries (`log`) before the final
 * response.
 */
import type { ChildProcess } from 'node:child_process';

import type { JournalEntry } from '@nocobase/logging';

export const IPC_CHANNEL = 'nocobase-app-host';

export interface IpcRequest {
  channel: typeof IPC_CHANNEL;
  kind: 'request';
  requestId: string;
  session: string;
  method: string;
  payload?: unknown;
}

export interface IpcResponse {
  channel: typeof IPC_CHANNEL;
  kind: 'response';
  requestId: string;
  result?: unknown;
  error?: string;
  /** A stable code for the error, when it has one (`HostManagementError`). */
  errorCode?: string;
  accepted?: boolean;
  log?: JournalEntry;
}

export interface IpcCallOptions {
  readonly session: string;
  readonly timeoutMs: number;
  readonly method: string;
  readonly payload?: unknown;
  readonly onLog?: (entry: JournalEntry) => void;
}

let sequence = 0;

/** An error answered by the child, with its stable code when it had one. */
export class IpcRemoteError extends Error {
  constructor(
    message: string,
    public readonly code: string | undefined,
  ) {
    super(message);
    this.name = 'IpcRemoteError';
  }
}

export function callIpc<T>(
  child: ChildProcess,
  options: IpcCallOptions,
): Promise<T> {
  const { method } = options;
  if (!child.connected) {
    return Promise.reject(new Error('App host IPC channel is disconnected'));
  }
  const requestId = `${process.pid}-${Date.now()}-${++sequence}`;
  const request: IpcRequest = {
    channel: IPC_CHANNEL,
    kind: 'request',
    requestId,
    session: options.session,
    method,
    payload: options.payload,
  };

  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`App host IPC request "${method}" timed out`));
    }, options.timeoutMs);
    timeout.unref?.();

    const onMessage = (message: unknown): void => {
      if (!isIpcResponse(message) || message.requestId !== requestId) {
        return;
      }
      if (message.log) {
        try {
          options.onLog?.(message.log);
        } catch (error) {
          cleanup();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
        return;
      }
      if (message.accepted) {
        // The request deadline covers acceptance only. Execution completion
        // is delivered independently and must not be discarded on timeout.
        clearTimeout(timeout);
        return;
      }
      cleanup();
      if (message.error) {
        reject(new IpcRemoteError(message.error, message.errorCode));
        return;
      }
      resolve(message.result as T);
    };
    const onExit = (): void => {
      cleanup();
      reject(new Error(`App host exited during IPC request "${method}"`));
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      child.off('message', onMessage);
      child.off('exit', onExit);
    };
    child.on('message', onMessage);
    child.once('exit', onExit);
    child.send(request, (error) => {
      if (error) {
        cleanup();
        reject(error);
      }
    });
  });
}

/** Sends a response from the child; a parent that went away is not an error worth crashing for. */
export function sendIpcResponse(response: IpcResponse): void {
  if (typeof process.send !== 'function' || process.connected === false) return;
  try {
    process.send(response, (error: Error | null) => {
      void error;
    });
  } catch {
    // The channel closed between the check and the send.
  }
}

export function isIpcRequest(value: unknown): value is IpcRequest {
  const candidate = value as Partial<IpcRequest> | null;
  return (
    typeof candidate === 'object' &&
    candidate?.channel === IPC_CHANNEL &&
    candidate.kind === 'request' &&
    typeof candidate.requestId === 'string' &&
    typeof candidate.session === 'string' &&
    typeof candidate.method === 'string'
  );
}

export function isIpcResponse(value: unknown): value is IpcResponse {
  const candidate = value as Partial<IpcResponse> | null;
  return (
    typeof candidate === 'object' &&
    candidate?.channel === IPC_CHANNEL &&
    candidate.kind === 'response' &&
    typeof candidate.requestId === 'string'
  );
}
