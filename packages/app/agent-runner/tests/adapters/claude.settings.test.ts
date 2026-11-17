/**
 * Opt-in native configuration contract: set NOCOBASE_RUNNER_CLAUDE_SETTINGS_TEST to
 * an absolute Claude Code executable (>= DEFAULT_MIN_CLAUDE_VERSION). No account
 * or external provider is used: homes, settings, hooks and HTTP services are local.
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import type {
  AdapterEvent,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';

const executable = process.env.NOCOBASE_RUNNER_CLAUDE_SETTINGS_TEST;
const reply = 'configured reply';

vi.mock('@anthropic-ai/claude-agent-sdk', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('@anthropic-ai/claude-agent-sdk')>();
  return {
    ...real,
    query: (args: Parameters<typeof real.query>[0]) => {
      if (args.options?.cwd && !args.options.permissionMode) {
        // Seed the actual, freshly allocated probe cwd before the unmodified SDK
        // starts. Neither a project nor a local model override may affect discovery.
        const dir = path.join(args.options.cwd, '.claude');
        mkdirSync(dir, { recursive: true });
        for (const name of ['settings.json', 'settings.local.json'])
          writeFileSync(
            path.join(dir, name),
            JSON.stringify({
              env: { ANTHROPIC_DEFAULT_SONNET_MODEL: 'probe-poison' },
            }),
          );
      }
      return real.query(args);
    },
  };
});

describe.skipIf(!executable)(
  'native Claude settings with a local provider',
  () => {
    let root: string;
    let home: string;
    let workDir: string;
    let config: string;
    let baseUrl: string;
    let server: Server;
    let env: Record<string, string>;
    let adapter: ClaudeAdapter;
    const tokens = new Map<string, string>();
    const requests: {
      source: string;
      model: string;
      authenticated: boolean;
    }[] = [];

    beforeEach(async () => {
      root = await mkdtemp(path.join(tmpdir(), 'claude-settings-'));
      home = path.join(root, 'home');
      workDir = path.join(root, 'work');
      config = path.join(home, '.claude');
      const bin = path.join(root, 'bin');
      for (const dir of [
        home,
        config,
        workDir,
        bin,
        path.join(workDir, '.git'),
      ])
        await mkdir(dir, { recursive: true });
      await symlink(executable!, path.join(bin, 'claude'));
      tokens.clear();
      requests.length = 0;
      server = createServer(async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
        const source = req.url?.split('/')[1] ?? '';
        if (
          req.url?.includes('/messages') &&
          !req.url.includes('count_tokens')
        ) {
          // Keep only the comparison result, never a header or token, in evidence.
          requests.push({
            source,
            model: body.model,
            authenticated:
              req.headers.authorization === `Bearer ${tokens.get(source)}`,
          });
          const message = {
            id: `msg_${randomUUID()}`,
            type: 'message',
            role: 'assistant',
            model: body.model,
            content: [{ type: 'text', text: reply }],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 7, output_tokens: 2 },
          };
          if (body.stream) {
            res.writeHead(200, { 'content-type': 'text/event-stream' });
            const emit = (type: string, data: object) =>
              res.write(
                `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`,
              );
            emit('message_start', {
              message: { ...message, content: [], stop_reason: null },
            });
            emit('content_block_start', {
              index: 0,
              content_block: { type: 'text', text: '' },
            });
            emit('content_block_delta', {
              index: 0,
              delta: { type: 'text_delta', text: reply },
            });
            emit('content_block_stop', { index: 0 });
            emit('message_delta', {
              delta: { stop_reason: 'end_turn', stop_sequence: null },
              usage: { output_tokens: 2 },
            });
            emit('message_stop', {});
            res.end();
          } else {
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify(message));
          }
        } else {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ input_tokens: 7, data: [] }));
        }
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      );
      const address = server.address();
      if (!address || typeof address === 'string')
        throw new Error('No test port');
      baseUrl = `http://127.0.0.1:${address.port}`;
      env = {
        HOME: home,
        PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(
          path.delimiter,
        ),
        TMPDIR: root,
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
      };
    });

    afterEach(async () => {
      server?.closeAllConnections();
      if (server)
        await new Promise<void>((resolve) => server.close(() => resolve()));
      if (root) await rm(root, { recursive: true, force: true });
    });

    async function settings(source: string, file: string, extra: object = {}) {
      const token = randomUUID();
      tokens.set(source, token);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(
        file,
        JSON.stringify({
          model: 'sonnet',
          env: {
            ANTHROPIC_BASE_URL: `${baseUrl}/${source}`,
            ANTHROPIC_AUTH_TOKEN: token,
            ANTHROPIC_DEFAULT_SONNET_MODEL: `${source}-sonnet`,
            ANTHROPIC_DEFAULT_OPUS_MODEL: `${source}-opus`,
            ANTHROPIC_DEFAULT_HAIKU_MODEL: `${source}-haiku`,
          },
          ...extra,
        }),
      );
    }

    function createAdapter() {
      adapter = new ClaudeAdapter({ env });
      return adapter;
    }

    async function run(overrides: Partial<AdapterSession> = {}) {
      const handle = adapter.start({
        workDir,
        prompt: 'Reply briefly without tools.',
        systemPrompt: 'This is a local configuration test.',
        env,
        permission: async () => 'allow',
        abort: AbortSignal.timeout(30_000),
        ...overrides,
      });
      const events: AdapterEvent[] = [];
      for await (const event of handle.events) events.push(event);
      const result = await handle.result;
      expect(result.exit).toBe('completed');
      expect(result.summary).toBe(reply);
      // Assert a boolean so a failure cannot print the generated authentication value.
      expect(
        [...tokens.values()].some((token) =>
          JSON.stringify({ result, events }).includes(token),
        ),
      ).toBe(false);
      return { result, events };
    }

    function expectRequest(source: string, model = `${source}-sonnet`) {
      expect(
        requests.some(
          (request) =>
            request.source === source &&
            request.model === model &&
            request.authenticated,
        ),
      ).toBe(true);
    }

    it.each([false, true])(
      'loads user-only provider settings (custom config directory: %s) and resumes',
      async (custom) => {
        if (custom) {
          config = path.join(root, 'custom-config');
          env.CLAUDE_CONFIG_DIR = config;
          await settings(
            'ignored-home',
            path.join(home, '.claude/settings.json'),
          );
        }
        await settings('user', path.join(config, 'settings.json'));
        createAdapter();
        const detection = await adapter.detect(AbortSignal.timeout(15_000));
        expect(detection.authenticated).toBe(true);
        const models = await adapter.detectModels(AbortSignal.timeout(15_000));
        expect(models.modelsDetectionStatus).toBe('detected');
        expect(models.models?.map((model) => model.id)).toEqual(
          expect.arrayContaining(['user-sonnet', 'user-opus', 'user-haiku']),
        );
        expect(requests).toEqual([]);
        const first = await run();
        expect(first.result.sessionId).toBeTypeOf('string');
        expectRequest('user');
        requests.length = 0;
        const resumed = await run({
          resumeSessionId: first.result.sessionId,
          strictSession: true,
        });
        expect(resumed.result.sessionId).toBe(first.result.sessionId);
        expect(
          resumed.events.find((event) => event.content === 'started')?.meta
            ?.resumed,
        ).toBe(true);
        expectRequest('user');
        expect(requests.every((request) => request.source === 'user')).toBe(
          true,
        );
      },
    );

    it('uses local over project over user settings and keeps discovery independent of temporary project settings', async () => {
      await settings('user', path.join(config, 'settings.json'));
      await settings('project', path.join(workDir, '.claude/settings.json'));
      createAdapter();
      const models = await adapter.detectModels(AbortSignal.timeout(15_000));
      expect(models.models?.map((model) => model.id)).toContain('user-sonnet');
      await run();
      expectRequest('project');
      await settings(
        'local',
        path.join(workDir, '.claude/settings.local.json'),
      );
      requests.length = 0;
      await run();
      expectRequest('local');
    });

    it('follows native settings env precedence while keeping explicit model selection', async () => {
      await settings('user', path.join(config, 'settings.json'));
      const token = randomUUID();
      tokens.set('explicit', token);
      Object.assign(env, {
        ANTHROPIC_BASE_URL: `${baseUrl}/explicit`,
        ANTHROPIC_AUTH_TOKEN: token,
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'explicit-sonnet',
      });
      createAdapter();
      const models = await adapter.detectModels(AbortSignal.timeout(15_000));
      // Native Claude applies settings.env over inherited process variables. The
      // adapter must not invent its own merge order when enabling those settings.
      expect(models.models?.map((model) => model.id)).toContain('user-sonnet');
      await run({ model: 'explicit-choice' });
      expectRequest('user', 'explicit-choice');
    });

    it('uses explicit provider variables when settings do not replace them', async () => {
      await mkdir(config, { recursive: true });
      await writeFile(
        path.join(config, 'settings.json'),
        JSON.stringify({ model: 'opus' }),
      );
      const token = randomUUID();
      tokens.set('explicit', token);
      Object.assign(env, {
        ANTHROPIC_BASE_URL: `${baseUrl}/explicit`,
        ANTHROPIC_AUTH_TOKEN: token,
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'explicit-sonnet',
        ANTHROPIC_MODEL: 'sonnet',
      });
      createAdapter();
      const models = await adapter.detectModels(AbortSignal.timeout(15_000));
      expect(models.models?.map((model) => model.id)).toContain(
        'explicit-sonnet',
      );
      await run();
      expectRequest('explicit');
    });

    it('runs filesystem hooks and connects native user and project MCP servers', async () => {
      const hookLog = path.join(root, 'hooks.log');
      const hook = path.join(root, 'hook.mjs');
      await writeFile(
        hook,
        "import { appendFileSync } from 'node:fs'; appendFileSync(process.argv[2], process.argv[3] + '\\n');",
      );
      const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
      const hooks = (source: string) => ({
        SessionStart: [
          {
            hooks: [
              {
                type: 'command',
                command: [process.execPath, hook, hookLog, source]
                  .map(quote)
                  .join(' '),
              },
            ],
          },
        ],
      });
      await settings('user', path.join(config, 'settings.json'), {
        hooks: hooks('user'),
      });
      await mkdir(path.join(workDir, '.claude'), { recursive: true });
      await writeFile(
        path.join(workDir, '.claude/settings.local.json'),
        JSON.stringify({
          hooks: hooks('local'),
          enableAllProjectMcpServers: true,
        }),
      );
      const mcp = path.join(root, 'mcp.mjs');
      const mcpLog = path.join(root, 'mcp.log');
      await writeFile(
        mcp,
        `
import { createInterface } from 'node:readline';
import { appendFileSync } from 'node:fs';
createInterface({ input: process.stdin }).on('line', (line) => {
  const request = JSON.parse(line);
  if (!('id' in request)) return;
  appendFileSync(process.argv[2], process.argv[3] + ':' + request.method + '\\n');
  let result = {};
  if (request.method === 'initialize') result = {
    protocolVersion: request.params.protocolVersion,
    capabilities: { tools: {} }, serverInfo: { name: 'local-test', version: '1.0.0' }
  };
  if (request.method === 'tools/list') result = {
    tools: [{ name: 'echo', description: 'Local fixture', inputSchema: { type: 'object', properties: {} } }]
  };
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\\n');
});
`,
      );
      const mcpServer = (source: string) => ({
        command: process.execPath,
        args: [mcp, mcpLog, source],
      });
      // This is a generated, credential-free native config, never the runner user's config.
      await writeFile(
        path.join(home, '.claude.json'),
        JSON.stringify({ mcpServers: { userFixture: mcpServer('user') } }),
      );
      await writeFile(
        path.join(workDir, '.mcp.json'),
        JSON.stringify({
          mcpServers: { projectFixture: mcpServer('project') },
        }),
      );
      createAdapter();
      await run();
      const markers = (await readFile(hookLog, 'utf8')).trim().split('\n');
      expect(markers).toEqual(expect.arrayContaining(['user', 'local']));
      // Native tool search can defer MCP tools in the first model request. Assert
      // completed MCP discovery rather than assuming they are sent eagerly.
      const mcpCalls = (await readFile(mcpLog, 'utf8')).trim().split('\n');
      expect(mcpCalls).toEqual(
        expect.arrayContaining(['user:tools/list', 'project:tools/list']),
      );
    });
  },
);
