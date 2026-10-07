// A scriptable stand-in for a coding tool, used to develop and test the runner without one.
//
// The turn prompt is read line by line; each line is one step:
//
//   say <text>              a text event
//   think <text>            a thinking event
//   system                  a text event with the system prompt the run got
//   skills                  a text event listing the run's skills and their folder
//   bash <command>          asks permission for Bash, then runs the command with `sh -c` in the work directory
//   write <path> <text>     asks permission for Write, then writes the file
//   read <path>             asks permission for Read, then reads the file
//   sleep <ms>              waits
//   hang                    starts `sleep 3600` and waits until stopped
//   hang-hard               like hang, but the child ignores SIGTERM
//   wait-input              waits for an input sent through steer(), then echoes it
//   fail <reason> <message> ends the turn with an error
//   usage <model> <input> <output> [cacheRead] [cacheWrite]
//                           reports these tokens as the turn's usage (a `usage` event, and the result's)
//
// Any other line is echoed as text. Children run in the worker's process group, so killing the group kills them.
import { spawn, type ChildProcess } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  AdapterEvent,
  AdapterHandle,
  AdapterResult,
  AdapterSession,
  AgentAdapter,
  FailureReason,
  PermissionDecision,
  ToolKind,
  Usage,
} from './types.ts';

type AdapterKind = ToolKind;

export interface EchoAdapterOptions {
  /** The tool kind the echo adapter stands in for. */
  kind?: AdapterKind;
}

export function createEchoAdapter(
  options: EchoAdapterOptions = {},
): AgentAdapter {
  const kind = options.kind ?? 'claude';
  return {
    kind,
    detect: () =>
      Promise.resolve({
        installed: true,
        version: 'echo',
        path: 'echo',
        authenticated: true,
      }),
    features: () => ['steer'],
    start: (session) => startEcho(kind, session),
  };
}

/** An async queue an adapter pushes events into and the runner iterates. */
export class EventQueue<T> implements AsyncIterable<T> {
  private readonly items: T[] = [];
  private waiting: ((result: IteratorResult<T>) => void) | undefined;
  private closed = false;

  push(item: T): void {
    if (this.closed) return;
    if (this.waiting !== undefined) {
      const resolve = this.waiting;
      this.waiting = undefined;
      resolve({ value: item, done: false });
    } else {
      this.items.push(item);
    }
  }

  close(): void {
    this.closed = true;
    if (this.waiting !== undefined) {
      const resolve = this.waiting;
      this.waiting = undefined;
      resolve({ value: undefined, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => {
        const item = this.items.shift();
        if (item !== undefined)
          return Promise.resolve({ value: item, done: false });
        if (this.closed)
          return Promise.resolve({ value: undefined, done: true });
        return new Promise((resolve) => {
          this.waiting = resolve;
        });
      },
    };
  }
}

class Aborted extends Error {}

function startEcho(kind: AdapterKind, session: AdapterSession): AdapterHandle {
  const events = new EventQueue<AdapterEvent>();
  const children = new Set<ChildProcess>();
  const steered: { text: string; inputId?: string }[] = [];
  let steerWaiter: (() => void) | undefined;
  const stopper = new AbortController();
  const signal = AbortSignal.any([session.abort, stopper.signal]);
  let outputTokens = 0;
  let scripted: Usage | undefined;
  const turnUsage = (): Usage => scripted ?? usage(kind, session, outputTokens);
  let finished = false;

  const killChildren = (): void => {
    for (const child of children) {
      child.kill('SIGTERM');
      setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null)
          child.kill('SIGKILL');
      }, 2000).unref();
    }
  };
  signal.addEventListener('abort', () => {
    killChildren();
    steerWaiter?.();
  });

  let lastText: string | undefined;
  const emit = (event: Omit<AdapterEvent, 'at'>): void => {
    outputTokens += (event.content ?? '').length;
    if (event.type === 'text') lastText = event.content;
    events.push({ ...event, at: new Date().toISOString() });
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Aborted());
      const timer = setTimeout(resolve, ms);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new Aborted());
        },
        { once: true },
      );
    });

  const run = (
    command: string,
    args: string[],
  ): Promise<{ code: number | null; output: string }> =>
    new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Aborted());
      const child = spawn(command, args, {
        cwd: session.workDir,
        env: session.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      children.add(child);
      let output = '';
      child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
      child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));
      child.on('error', (error) => {
        children.delete(child);
        reject(error);
      });
      // 'exit', not 'close': a grandchild left holding the pipes must not keep the step waiting.
      child.on('exit', (code) => {
        children.delete(child);
        if (signal.aborted) reject(new Aborted());
        else setImmediate(() => resolve({ code, output }));
      });
    });

  // Like a real adapter, the echo adapter records refusals itself; the permission callback only decides.
  const allowed = async (
    tool: string,
    input: Record<string, unknown>,
  ): Promise<boolean> => {
    const decision: PermissionDecision = await session.permission(tool, input);
    if (decision === 'allow') return true;
    const reason =
      typeof decision === 'object'
        ? decision.deny
        : 'Denied by the tool policy.';
    emit({
      type: 'permission',
      tool,
      input,
      content: reason,
      meta: { decision: 'deny', reason },
    });
    return false;
  };

  const step = async (line: string): Promise<AdapterResult | undefined> => {
    const [word = '', ...rest] = line.split(' ');
    const tail = rest.join(' ');
    switch (word) {
      case 'say':
        emit({ type: 'text', content: tail });
        return undefined;
      case 'think':
        emit({ type: 'thinking', content: tail });
        return undefined;
      case 'system':
        emit({ type: 'text', content: session.systemPrompt });
        return undefined;
      case 'skills':
        emit({
          type: 'text',
          content: `skills: ${(session.skills?.slugs ?? []).join(',') || '-'} at ${session.skills?.dir ?? '-'}`,
        });
        return undefined;
      case 'sleep':
        await sleep(Number(tail));
        return undefined;
      case 'bash': {
        const input = { command: tail };
        emit({ type: 'toolUse', tool: 'Bash', input });
        if (!(await allowed('Bash', input))) {
          emit({ type: 'toolResult', tool: 'Bash', output: 'denied' });
          return undefined;
        }
        const { code, output } = await run('sh', ['-c', tail]);
        emit({
          type: 'toolResult',
          tool: 'Bash',
          output,
          meta: { exitCode: code },
        });
        return undefined;
      }
      case 'write': {
        const [file = '', ...text] = rest;
        const input = { file_path: file, content: text.join(' ') };
        emit({ type: 'toolUse', tool: 'Write', input });
        if (!(await allowed('Write', input))) {
          emit({ type: 'toolResult', tool: 'Write', output: 'denied' });
          return undefined;
        }
        await writeFile(path.resolve(session.workDir, file), input.content);
        emit({ type: 'toolResult', tool: 'Write', output: 'ok' });
        return undefined;
      }
      case 'read': {
        const input = { file_path: tail };
        emit({ type: 'toolUse', tool: 'Read', input });
        if (!(await allowed('Read', input))) {
          emit({ type: 'toolResult', tool: 'Read', output: 'denied' });
          return undefined;
        }
        const content = await readFile(
          path.resolve(session.workDir, tail),
          'utf8',
        );
        emit({ type: 'toolResult', tool: 'Read', output: content });
        return undefined;
      }
      case 'hang':
        await run('sleep', ['3600']);
        return undefined;
      case 'hang-hard':
        await run('sh', ['-c', 'trap "" TERM; sleep 3600']);
        return undefined;
      case 'wait-input': {
        while (steered.length === 0) {
          if (signal.aborted) throw new Aborted();
          await new Promise<void>((resolve) => {
            steerWaiter = resolve;
          });
          steerWaiter = undefined;
        }
        emit({
          type: 'text',
          content: `got input: ${steered.shift()?.text ?? ''}`,
        });
        return undefined;
      }
      case 'usage': {
        const [model = 'echo', ...counts] = rest;
        const [input, output, cacheRead, cacheWrite] = counts.map((value) =>
          Math.max(0, Math.trunc(Number(value) || 0)),
        );
        scripted = {
          tool: kind,
          model,
          inputTokens: input ?? 0,
          outputTokens: output ?? 0,
          ...(cacheRead === undefined ? {} : { cacheReadTokens: cacheRead }),
          ...(cacheWrite === undefined ? {} : { cacheWriteTokens: cacheWrite }),
        };
        emit({ type: 'usage', meta: { usage: [scripted] } });
        return undefined;
      }
      case 'fail': {
        const [reason = 'toolProcess', ...message] = rest;
        return {
          usage: [turnUsage()],
          exit: 'error',
          error: {
            reason: reason as FailureReason,
            message: message.join(' '),
          },
        };
      }
      default:
        emit({ type: 'text', content: line });
        return undefined;
    }
  };

  const result = (async (): Promise<AdapterResult> => {
    const sessionId =
      session.resumeSessionId ?? `echo-${Date.now().toString(36)}`;
    try {
      const lines = session.prompt.split('\n').map((line) => line.trim());
      const script = lines.filter((line) => line !== '');
      if (script.length === 0)
        emit({ type: 'text', content: 'echo: (empty prompt)' });
      for (const line of script) {
        if (signal.aborted) throw new Aborted();
        const ended = await step(line);
        if (ended !== undefined) return { ...ended, sessionId };
      }
      return {
        sessionId,
        usage: [turnUsage()],
        exit: 'completed',
        ...(lastText === undefined ? {} : { summary: lastText }),
      };
    } catch (error) {
      if (error instanceof Aborted || signal.aborted) {
        return {
          sessionId,
          usage: [turnUsage()],
          exit: 'aborted',
        };
      }
      return {
        sessionId,
        usage: [turnUsage()],
        exit: 'error',
        error: {
          reason: 'toolProcess',
          message: error instanceof Error ? error.message : String(error),
        },
      };
    } finally {
      finished = true;
      events.close();
    }
  })();

  return {
    events,
    steer: (input, inputId) => {
      if (signal.aborted || finished) return Promise.resolve(false);
      steered.push({
        text: input,
        ...(inputId === undefined ? {} : { inputId }),
      });
      // The echo session takes an input in as soon as it is steered.
      emit({ type: 'input', content: input, meta: { inputId } });
      steerWaiter?.();
      return Promise.resolve(true);
    },
    stop: async () => {
      stopper.abort();
      await result;
    },
    result,
  };
}

function usage(
  kind: AdapterKind,
  session: AdapterSession,
  outputTokens: number,
): Usage {
  return {
    tool: kind,
    model: session.model ?? 'echo',
    inputTokens: session.prompt.length + session.systemPrompt.length,
    outputTokens,
  };
}
