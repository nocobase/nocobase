import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_MIN_PI_VERSION,
  PiAdapter,
  denialMessage,
} from '../../src/agent/adapters/pi.ts';
import { JsonlSplitter } from '../../src/agent/adapters/pi/util.ts';
import { loadAdapters } from '../../src/agent/adapters/registry.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterSession,
  PermissionCheck,
} from '../../src/agent/adapters/types.ts';
import {
  MODELS_TABLE,
  adapterWith,
  assistantMessage,
  fakePiDir,
  fakeSpawn,
  permissionRequest,
  steeredMessage,
  toolCall,
  toolExecution,
  userMessage,
} from './pi-fake.ts';
import type { FakePi } from './pi-fake.ts';

function session(overrides: Partial<AdapterSession> = {}): AdapterSession {
  return {
    workDir: '/work',
    prompt: 'Write hello.txt',
    systemPrompt: 'You are a Acme agent.',
    env: { PATH: '/usr/bin', HOME: '/home/agent' },
    permission: () => Promise.resolve('allow'),
    abort: new AbortController().signal,
    ...overrides,
  };
}

async function collect(handle: AdapterHandle): Promise<AdapterEvent[]> {
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) events.push(event);
  return events;
}

function writeAll(pi: FakePi, records: readonly Record<string, unknown>[]) {
  for (const record of records) pi.write(record);
}

const settled = [
  { type: 'agent_end', messages: [], willRetry: false },
  { type: 'agent_settled' },
];

describe('detect', () => {
  it('reports the installed version and whether a model has credentials', async () => {
    const dir = await fakePiDir();
    const calls: string[][] = [];
    const adapter = new PiAdapter({
      searchPath: dir,
      exec: (_file, args) => {
        calls.push(args);
        return Promise.resolve(
          args[0] === '--version'
            ? { code: 0, stdout: '0.99.2\n' }
            : { code: 0, stdout: MODELS_TABLE },
        );
      },
    });
    expect(await adapter.detect()).toEqual({
      installed: true,
      version: '0.99.2',
      path: path.join(dir, 'pi'),
      authenticated: true,
    });
    expect(calls).toEqual([['--version'], ['--offline', '--list-models']]);
    expect(adapter.features()).toEqual(['steer']);
  });

  it('is not authenticated when no model is available', async () => {
    const adapter = new PiAdapter({
      searchPath: await fakePiDir(),
      exec: (_file, args) =>
        Promise.resolve(
          args[0] === '--version'
            ? { code: 0, stdout: '0.99.2\n' }
            : {
                code: 0,
                stdout: 'No models available. Use /login or set an API key.\n',
              },
        ),
    });
    expect((await adapter.detect()).authenticated).toBe(false);
  });

  it('is not installed without pi on PATH', async () => {
    const adapter = new PiAdapter({ searchPath: '/nonexistent' });
    expect(await adapter.detect()).toEqual({
      installed: false,
      authenticated: false,
    });
  });

  it('is registered for the pi tool kind', () => {
    expect(loadAdapters({}).get('pi')).toBeInstanceOf(PiAdapter);
  });
});

describe('start', () => {
  it('runs pi in RPC mode with the bridge, brief, model and whitelisted env', async () => {
    let brief = '';
    let extension = '';
    const { spawn, processes } = fakeSpawn((pi) => {
      void (async () => {
        const args = pi.args;
        brief = await readFile(
          args[args.indexOf('--append-system-prompt') + 1]!,
          'utf8',
        );
        extension = await readFile(
          args[args.indexOf('--extension') + 1]!,
          'utf8',
        );
        const prompt = await pi.next('prompt');
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [
          { type: 'agent_start' },
          { type: 'turn_start' },
          ...userMessage('Write hello.txt'),
          ...assistantMessage([{ type: 'text', text: 'Done.' }]),
          ...settled,
        ]);
      })();
    });
    const adapter = await adapterWith(spawn);
    const handle = adapter.start(
      session({ model: 'anthropic/claude-sonnet-4-5', effort: 'high' }),
    );
    await collect(handle);
    const result = await handle.result;

    const pi = processes[0]!;
    expect(pi.file).toMatch(/\/pi$/);
    expect(pi.args.slice(0, 3)).toEqual(['--mode', 'rpc', '--extension']);
    expect(pi.args).toContain('--model');
    expect(pi.args[pi.args.indexOf('--model') + 1]).toBe(
      'anthropic/claude-sonnet-4-5',
    );
    expect(pi.args[pi.args.indexOf('--thinking') + 1]).toBe('high');
    expect(pi.args).not.toContain('--session-id');
    expect(pi.options).toEqual({
      cwd: '/work',
      env: { PATH: '/usr/bin', HOME: '/home/agent' },
    });
    expect(brief).toBe('You are a Acme agent.');
    expect(extension).toContain('nocobase-runner-permission/v1');
    expect(pi.commands.map((c) => c.type)).toEqual([
      'get_commands',
      'get_state',
      'prompt',
    ]);
    expect(pi.commands[2]).toMatchObject({ message: 'Write hello.txt' });
    expect(result).toMatchObject({
      exit: 'completed',
      sessionId: 'pi-session-1',
      summary: 'Done.',
    });
  });

  it('passes the resumed session id and ignores unknown efforts', async () => {
    const { spawn, processes } = fakeSpawn((pi) => {
      void pi.next('prompt').then((prompt) => {
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [
          ...assistantMessage([{ type: 'text', text: 'ok' }]),
          ...settled,
        ]);
      });
    });
    const handle = (await adapterWith(spawn)).start(
      session({ resumeSessionId: 'pi-session-0', effort: 'ultra' }),
    );
    await handle.result;
    const args = processes[0]!.args;
    expect(args[args.indexOf('--session-id') + 1]).toBe('pi-session-0');
    expect(args).not.toContain('--thinking');
    expect(args).not.toContain('--skill');
  });

  it("loads each of the run's skills with --skill", async () => {
    const { spawn, processes } = fakeSpawn((pi) => {
      void pi.next('prompt').then((prompt) => {
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [
          ...assistantMessage([{ type: 'text', text: 'ok' }]),
          ...settled,
        ]);
      });
    });
    const handle = (await adapterWith(spawn)).start(
      session({
        skills: {
          root: '/work/.nocobase-runner/plugin',
          dir: '/work/.nocobase-runner/plugin/skills',
          slugs: ['a', 'b'],
        },
      }),
    );
    await handle.result;
    const args = processes[0]!.args;
    expect(
      args.flatMap((arg, index) =>
        arg === '--skill' ? [args[index + 1]] : [],
      ),
    ).toEqual([
      '/work/.nocobase-runner/plugin/skills/a',
      '/work/.nocobase-runner/plugin/skills/b',
    ]);
  });

  it('maps the event stream and sums usage per model', async () => {
    const write = toolExecution(
      'call_1',
      'write',
      { path: 'hello.txt', content: 'hi' },
      'Wrote hello.txt',
    );
    const { spawn } = fakeSpawn((pi) => {
      void pi.next('prompt').then((prompt) => {
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [
          { type: 'agent_start' },
          { type: 'turn_start' },
          ...userMessage('Write hello.txt'),
          ...assistantMessage(
            [
              { type: 'thinking', thinking: 'I should write the file.' },
              { type: 'text', text: 'Writing it.' },
              toolCall('call_1', 'write', { path: 'hello.txt', content: 'hi' }),
            ],
            { stopReason: 'toolUse', input: 100, output: 20 },
          ),
          write.start,
          write.end,
          { type: 'turn_end' },
          { type: 'turn_start' },
          ...assistantMessage([{ type: 'text', text: 'Done.' }], {
            input: 50,
            output: 5,
          }),
          { type: 'compaction_start', reason: 'threshold' },
          {
            type: 'compaction_end',
            reason: 'threshold',
            aborted: false,
            willRetry: false,
          },
          ...settled,
        ]);
      });
    });
    const handle = (await adapterWith(spawn)).start(session());
    const events = await collect(handle);
    const result = await handle.result;

    const shape = events.map((e) => [e.type, e.content ?? e.tool ?? '']);
    expect(shape).toEqual([
      ['status', 'started'],
      ['thinking', 'I should write the file.'],
      ['text', 'Writing it.'],
      ['toolUse', 'write'],
      ['toolResult', 'write'],
      ['text', 'Done.'],
      ['status', 'compacting'],
      ['status', 'compacted'],
      ['status', 'turnCompleted'],
      ['usage', ''],
    ]);
    const toolUse = events.find((e) => e.type === 'toolUse')!;
    expect(toolUse.input).toEqual({ path: 'hello.txt', content: 'hi' });
    expect(toolUse.meta).toEqual({ toolUseId: 'call_1' });
    const toolResult = events.find((e) => e.type === 'toolResult')!;
    expect(toolResult).toMatchObject({
      output: 'Wrote hello.txt',
      meta: { toolUseId: 'call_1', isError: false },
    });
    expect(events[0]!.meta).toMatchObject({
      sessionId: 'pi-session-1',
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
      piVersion: '0.99.2',
    });
    expect(result.usage).toEqual([
      {
        tool: 'pi',
        model: 'claude-sonnet-4-5',
        inputTokens: 150,
        outputTokens: 25,
        cacheReadTokens: 20,
        cacheWriteTokens: 10,
      },
    ]);
  });

  it('frames records on LF only', () => {
    const lines: string[] = [];
    const splitter = new JsonlSplitter((line) => lines.push(line));
    const record = JSON.stringify({ text: 'a b c — ü' });
    const bytes = Buffer.from(`${record}\r\n${record}\n{"x":1}`);
    // Split inside a multi-byte character.
    const cut = bytes.indexOf(Buffer.from('ü')) + 1;
    splitter.write(bytes.subarray(0, cut));
    splitter.write(bytes.subarray(cut));
    splitter.end();
    expect(lines).toEqual([record, record, '{"x":1}']);
    expect(JSON.parse(lines[0]!)).toEqual({ text: 'a b c — ü' });
  });
});

describe('permissions', () => {
  it('asks the policy about every call and blocks denials', async () => {
    const asked: [string, Record<string, unknown>][] = [];
    const permission: PermissionCheck = (tool, input) => {
      asked.push([tool, input]);
      return Promise.resolve(
        tool === 'bash' && String(input.command).startsWith('rm')
          ? { deny: 'rm is not allowed' }
          : 'allow',
      );
    };
    const answers: Record<string, unknown> = {};
    const { spawn } = fakeSpawn((pi) => {
      pi.on(
        'command',
        (command: { type: string; id?: string; value?: string }) => {
          if (command.type === 'extension_ui_response')
            answers[command.id!] = command.value ?? command;
        },
      );
      void (async () => {
        const prompt = await pi.next('prompt');
        pi.respond(prompt, { disposition: 'started' });
        pi.write(
          permissionRequest('ui-1', 'call_1', 'read', { path: 'a.txt' }),
        );
        pi.write(
          permissionRequest('ui-2', 'call_2', 'bash', { command: 'ls' }),
        );
        pi.write(
          permissionRequest('ui-3', 'call_3', 'bash', { command: 'rm -rf x' }),
        );
        pi.write(permissionRequest('ui-4', 'call_4', 'ls', { path: '..' }));
        pi.write({
          type: 'extension_ui_request',
          id: 'ui-5',
          method: 'confirm',
          title: 'Clear session?',
          message: 'All messages will be lost.',
        });
        for (let i = 0; i < 5; i += 1) await pi.next('extension_ui_response');
        writeAll(pi, [
          ...assistantMessage([{ type: 'text', text: 'ok' }]),
          ...settled,
        ]);
      })();
    });
    const handle = (await adapterWith(spawn)).start(session({ permission }));
    const events = await collect(handle);
    expect((await handle.result).exit).toBe('completed');

    expect(asked).toEqual([
      ['read', { path: 'a.txt' }],
      ['bash', { command: 'ls' }],
      ['bash', { command: 'rm -rf x' }],
      ['list', { path: '..' }],
    ]);
    expect(JSON.parse(answers['ui-1'] as string)).toEqual({ allow: true });
    expect(JSON.parse(answers['ui-2'] as string)).toEqual({ allow: true });
    expect(JSON.parse(answers['ui-3'] as string)).toEqual({
      allow: false,
      message: denialMessage('rm is not allowed'),
    });
    expect(answers['ui-5']).toMatchObject({ cancelled: true });

    const permissions = events.filter((e) => e.type === 'permission');
    expect(permissions).toEqual([
      expect.objectContaining({
        tool: 'bash',
        input: { command: 'ls' },
        meta: { decision: 'allow', toolUseId: 'call_2' },
      }),
      expect.objectContaining({
        tool: 'bash',
        input: { command: 'rm -rf x' },
        meta: {
          decision: 'deny',
          reason: 'rm is not allowed',
          toolUseId: 'call_3',
        },
      }),
    ]);
    expect(events.some((e) => e.content === 'dialogCancelled')).toBe(true);
  });

  it('denies when the policy throws', async () => {
    const answers: string[] = [];
    const { spawn } = fakeSpawn((pi) => {
      void (async () => {
        const prompt = await pi.next('prompt');
        pi.respond(prompt, { disposition: 'started' });
        pi.write(
          permissionRequest('ui-1', 'call_1', 'bash', { command: 'ls' }),
        );
        answers.push(String((await pi.next('extension_ui_response')).value));
        writeAll(pi, settled);
      })();
    });
    const handle = (await adapterWith(spawn)).start(
      session({ permission: () => Promise.reject(new Error('boom')) }),
    );
    await handle.result;
    expect(JSON.parse(answers[0]!)).toMatchObject({ allow: false });
    expect(JSON.parse(answers[0]!).message).toContain('Policy error: boom');
  });

  it('refuses to run when the permission bridge did not load', async () => {
    const { spawn, processes } = fakeSpawn(() => {}, { bridge: false });
    const handle = (await adapterWith(spawn)).start(session());
    const events = await collect(handle);
    const result = await handle.result;
    expect(result.exit).toBe('error');
    expect(result.error?.reason).toBe('setupFailed');
    expect(processes[0]!.commands.map((c) => c.type)).not.toContain('prompt');
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      meta: { reason: 'setupFailed' },
    });
  });
});

describe('steer', () => {
  it('queues a steer and reports it once the agent picks it up', async () => {
    const ref: { handle?: AdapterHandle } = {};
    const steered: boolean[] = [];
    const { spawn, processes } = fakeSpawn((pi) => {
      void (async () => {
        const prompt = await pi.next('prompt');
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [
          { type: 'agent_start' },
          ...assistantMessage([toolCall('call_1', 'read', { path: 'a' })], {
            stopReason: 'toolUse',
          }),
        ]);
        steered.push(await ref.handle!.steer('Also write world.txt', 'in-1'));
        const steer = await pi.next('steer');
        writeAll(pi, [
          ...steeredMessage('Also write world.txt'),
          ...assistantMessage([{ type: 'text', text: 'Both done.' }]),
          ...settled,
        ]);
        void steer;
      })();
      pi.on('command', (command: { type: string }) => {
        if (command.type === 'steer')
          pi.respond(command as never, { disposition: 'queued' });
      });
    });
    const adapter = await adapterWith(spawn);
    const handle = adapter.start(session());
    ref.handle = handle;
    const events = await collect(handle);
    const result = await handle.result;

    expect(steered).toEqual([true]);
    expect(
      processes[0]!.commands.find((c) => c.type === 'steer'),
    ).toMatchObject({
      message: 'Also write world.txt',
    });
    expect(events.filter((e) => e.type === 'input')).toEqual([
      expect.objectContaining({
        content: 'Also write world.txt',
        meta: { inputId: 'in-1' },
      }),
    ]);
    expect(result).toMatchObject({ exit: 'completed', summary: 'Both done.' });
    expect(await handle.steer('after the end')).toBe(false);
  });

  it('re-prompts steers the agent settled without', async () => {
    const ref: { handle?: AdapterHandle } = {};
    const { spawn, processes } = fakeSpawn((pi) => {
      pi.on('command', (command: { type: string }) => {
        if (command.type === 'steer')
          pi.respond(command as never, { disposition: 'queued' });
        if (command.type === 'clear_queue')
          pi.respond(command as never, {
            steering: ['Late steer'],
            followUp: [],
          });
      });
      void (async () => {
        const prompt = await pi.next('prompt');
        pi.respond(prompt, { disposition: 'started' });
        expect(await ref.handle!.steer('Late steer', 'in-2')).toBe(true);
        writeAll(pi, [
          ...assistantMessage([{ type: 'text', text: 'First.' }]),
          ...settled,
        ]);
        const second = await pi.next('prompt');
        expect(second.message).toBe('Late steer');
        pi.respond(second, { disposition: 'started' });
        writeAll(pi, [
          ...userMessage('Late steer'),
          ...assistantMessage([{ type: 'text', text: 'Second.' }]),
          ...settled,
        ]);
      })();
    });
    const handle = (await adapterWith(spawn)).start(session());
    ref.handle = handle;
    const events = await collect(handle);
    const result = await handle.result;
    expect(processes[0]!.commands.map((c) => c.type)).toEqual([
      'get_commands',
      'get_state',
      'prompt',
      'steer',
      'clear_queue',
      'prompt',
    ]);
    expect(events.filter((e) => e.type === 'input')).toEqual([
      expect.objectContaining({
        content: 'Late steer',
        meta: { inputId: 'in-2' },
      }),
    ]);
    expect(result.summary).toBe('Second.');
  });
});

describe('failures and stop', () => {
  it('classifies a failed model call', async () => {
    const { spawn } = fakeSpawn((pi) => {
      void pi.next('prompt').then((prompt) => {
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [
          {
            type: 'auto_retry_start',
            attempt: 1,
            maxAttempts: 3,
            delayMs: 2000,
            errorMessage: '429 Too Many Requests',
          },
          ...assistantMessage([], {
            stopReason: 'error',
            errorMessage: '429 rate limit exceeded',
          }),
          {
            type: 'auto_retry_end',
            success: false,
            attempt: 3,
            finalError: '429',
          },
          ...settled,
        ]);
      });
    });
    const handle = (await adapterWith(spawn)).start(session());
    const events = await collect(handle);
    const result = await handle.result;
    expect(result.exit).toBe('error');
    expect(result.error).toEqual({
      reason: 'toolRateLimit',
      message: '429 rate limit exceeded',
    });
    expect(events.some((e) => e.content === 'retrying')).toBe(true);
  });

  it('reports missing credentials as toolAuth', async () => {
    const { spawn } = fakeSpawn((pi) => {
      void pi
        .next('prompt')
        .then((prompt) =>
          pi.respond(
            prompt,
            undefined,
            false,
            'No API key found for anthropic. Use /login or set an API key.',
          ),
        );
    });
    const result = await (await adapterWith(spawn)).start(session()).result;
    expect(result.exit).toBe('error');
    expect(result.error?.reason).toBe('toolAuth');
  });

  it('reports a process that dies mid-run as toolProcess', async () => {
    const { spawn } = fakeSpawn((pi) => {
      void pi.next('prompt').then((prompt) => {
        pi.respond(prompt, { disposition: 'started' });
        pi.stderr.write('fatal: out of memory\n');
        setTimeout(() => pi.exit(1), 10);
      });
    });
    const result = await (await adapterWith(spawn)).start(session()).result;
    expect(result.exit).toBe('error');
    expect(result.error?.reason).toBe('toolProcess');
    expect(result.error?.message).toContain('out of memory');
  });

  it('refuses a pi older than the minimum version', async () => {
    const { spawn, processes } = fakeSpawn(() => {});
    const result = await (await adapterWith(spawn, '0.73.1')).start(session())
      .result;
    expect(processes).toHaveLength(0);
    expect(result.error?.reason).toBe('toolProcess');
    expect(result.error?.message).toContain(DEFAULT_MIN_PI_VERSION);
  });

  it('aborts when the agent exceeds maxTurns', async () => {
    const { spawn, processes } = fakeSpawn((pi) => {
      pi.on('command', (command: { type: string }) => {
        if (command.type === 'abort') {
          writeAll(pi, [
            ...assistantMessage([], { stopReason: 'aborted' }),
            ...settled,
          ]);
        }
      });
      void pi.next('prompt').then((prompt) => {
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [
          { type: 'turn_start' },
          ...assistantMessage([toolCall('c1', 'read', { path: 'a' })], {
            stopReason: 'toolUse',
          }),
          { type: 'turn_start' },
        ]);
      });
    });
    const result = await (
      await adapterWith(spawn)
    ).start(session({ maxTurns: 1 })).result;
    expect(processes[0]!.commands.map((c) => c.type)).toContain('abort');
    expect(result.exit).toBe('error');
    expect(result.error?.message).toContain('turn limit');
  });

  it('stops with abort and closes stdin', async () => {
    const { spawn, processes } = fakeSpawn((pi) => {
      void pi.next('prompt').then((prompt) => {
        pi.respond(prompt, { disposition: 'started' });
        writeAll(pi, [{ type: 'agent_start' }, { type: 'turn_start' }]);
      });
    });
    const handle = (await adapterWith(spawn)).start(session());
    const events: AdapterEvent[] = [];
    for await (const event of handle.events) {
      events.push(event);
      if (event.content === 'started') {
        await new Promise((resolve) => setTimeout(resolve, 20));
        await handle.stop();
      }
    }
    const result = await handle.result;
    expect(result.exit).toBe('aborted');
    expect(result.error?.reason).toBe('cancelled');
    expect(processes[0]!.commands.map((c) => c.type)).toEqual(
      expect.arrayContaining(['clear_queue', 'abort']),
    );
    expect(processes[0]!.signals).toEqual([]);
  });

  it('kills a pi that ignores the shutdown within five seconds', async () => {
    const abort = new AbortController();
    const { spawn, processes } = fakeSpawn(
      (pi) => {
        void pi
          .next('prompt')
          .then((prompt) => pi.respond(prompt, { disposition: 'started' }));
      },
      { exitOnStdinEnd: false },
    );
    const handle = (await adapterWith(spawn)).start(
      session({ abort: abort.signal }),
    );
    await processes.length;
    await new Promise((resolve) => setTimeout(resolve, 50));
    const started = Date.now();
    abort.abort();
    const result = await handle.result;
    expect(Date.now() - started).toBeLessThan(5000);
    expect(result.exit).toBe('aborted');
    expect(processes[0]!.signals).toEqual(['SIGTERM']);
  });
});
