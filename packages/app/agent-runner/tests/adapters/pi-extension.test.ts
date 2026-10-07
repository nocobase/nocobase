/**
 * Runs the permission extension's source against a stand-in for Pi's
 * ExtensionAPI: `pi.registerCommand`, `pi.on('tool_call', …)`, and the
 * handler context's `ui.input` and `signal`, as declared in
 * @earendil-works/pi-coding-agent 0.99.2 dist/core/extensions/types.d.ts.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import {
  PERMISSION_COMMAND,
  PERMISSION_DIALOG_TITLE,
  PERMISSION_EXTENSION_SOURCE,
  parsePermissionRequest,
} from '../../src/agent/adapters/pi/extension.ts';

type ToolCallHandler = (
  event: Record<string, unknown>,
  ctx: Record<string, unknown>,
) => Promise<{ block?: boolean; reason?: string } | undefined>;

let handler: ToolCallHandler;
const commands: string[] = [];

beforeAll(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-pi-ext-'));
  // Pi loads the `.ts` file through jiti; the source is plain JavaScript, so Node can import it as `.mjs`.
  const file = path.join(dir, 'nocobase-runner-permission.mjs');
  await writeFile(file, PERMISSION_EXTENSION_SOURCE);
  const factory = (
    (await import(pathToFileURL(file).href)) as {
      default: (pi: unknown) => void;
    }
  ).default;
  factory({
    registerCommand: (name: string) => commands.push(name),
    on: (event: string, fn: ToolCallHandler) => {
      if (event === 'tool_call') handler = fn;
    },
  });
});

const event = {
  type: 'tool_call',
  toolCallId: 'call_1',
  toolName: 'bash',
  input: { command: 'ls' },
};

function ctx(answer: () => Promise<string | undefined>) {
  const asked: unknown[][] = [];
  return {
    asked,
    ctx: {
      signal: undefined,
      ui: {
        input: (...args: unknown[]) => {
          asked.push(args);
          return answer();
        },
      },
    },
  };
}

describe('permission extension', () => {
  it('registers the readiness command', () => {
    expect(commands).toEqual([PERMISSION_COMMAND]);
  });

  it('asks the adapter with the call and lets an allowed call run', async () => {
    const { asked, ctx: context } = ctx(() =>
      Promise.resolve(JSON.stringify({ allow: true })),
    );
    expect(await handler(event, context)).toBeUndefined();
    expect(asked).toHaveLength(1);
    expect(asked[0]![0]).toBe(PERMISSION_DIALOG_TITLE);
    expect(parsePermissionRequest(asked[0]![1])).toEqual({
      toolCallId: 'call_1',
      toolName: 'bash',
      input: { command: 'ls' },
    });
  });

  it('blocks a denied call with the adapter message', async () => {
    const { ctx: context } = ctx(() =>
      Promise.resolve(JSON.stringify({ allow: false, message: 'no rm' })),
    );
    expect(await handler(event, context)).toEqual({
      block: true,
      reason: 'no rm',
    });
  });

  it('fails closed on a cancelled dialog, garbage or an error', async () => {
    for (const answer of [
      () => Promise.resolve(undefined),
      () => Promise.resolve('not json'),
      () => Promise.reject(new Error('rpc gone')),
    ]) {
      const result = await handler(event, ctx(answer).ctx);
      expect(result?.block).toBe(true);
      expect(result?.reason).toContain('runner policy denied');
    }
  });
});
