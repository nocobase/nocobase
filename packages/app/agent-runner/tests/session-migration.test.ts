import * as fs from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { migratePiConversation } from '../src/agent/session-migration.ts';
import type { AdapterSession } from '../src/agent/adapters/types.ts';

vi.mock('node:fs/promises', async (load) => {
  const actual = await load<typeof fs>();
  return {
    ...actual,
    writeFile: vi.fn(actual.writeFile),
    link: vi.fn(actual.link),
  };
});
let root: string;
let session: AdapterSession;
let target: string;
let source: string;
const history =
  '\n{"type":"message","id":"first"}\n{"type":"message","id":"latest","memory":"latest memory"}\n';
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(tmpdir(), 'pi-atomic-'));
  source = path.join(root, 'old');
  const store = path.join(root, 'new');
  await fs.mkdir(source);
  const file = 'date_session-old.jsonl';
  await fs.writeFile(
    path.join(source, file),
    JSON.stringify({ type: 'session', id: 'session-old', cwd: '/old' }) +
      history,
  );
  target = path.join(store, file);
  session = {
    workDir: '/new',
    resumeSessionId: 'session-old',
    sessionStoreDir: store,
    env: { PI_CODING_AGENT_SESSION_DIR: source },
    prompt: '',
    systemPrompt: '',
    abort: new AbortController().signal,
    permission: async () => 'allow',
  };
});
afterEach(async () => {
  vi.clearAllMocks();
  await fs.rm(root, { recursive: true, force: true });
});
it('retries a partial temporary ENOSPC write with the entire original history', async () => {
  const actual = await vi.importActual<typeof fs>('node:fs/promises');
  vi.mocked(fs.writeFile).mockImplementationOnce(
    async (file, bytes, options) => {
      await actual.writeFile(
        file,
        String(bytes).split('\n').slice(0, 2).join('\n') + '\n',
        options,
      );
      throw Object.assign(new Error('injected disk failure'), {
        code: 'ENOSPC',
      });
    },
  );
  await expect(migratePiConversation(session)).rejects.toMatchObject({
    code: 'ENOSPC',
  });
  await expect(fs.stat(target)).rejects.toMatchObject({ code: 'ENOENT' });
  await migratePiConversation(session);
  expect(await fs.readFile(target, 'utf8')).toContain(history);
  expect(
    await fs.readFile(path.join(source, path.basename(target)), 'utf8'),
  ).toContain('latest memory');
});
it('preserves complete targets and subsequent messages on concurrent retries', async () => {
  await Promise.all([
    migratePiConversation(session),
    migratePiConversation(session),
  ]);
  await fs.appendFile(target, '{"type":"message","id":"new"}\n');
  const continued = await fs.readFile(target, 'utf8');
  await migratePiConversation(session);
  expect(await fs.readFile(target, 'utf8')).toBe(continued);
});
it('rejects a preexisting partial or divergent target without overwriting either copy', async () => {
  await fs.mkdir(path.dirname(target));
  const partial =
    '{"type":"session","id":"session-old","cwd":"/new"}\n{"type":"message","id":"first"}\n';
  await fs.writeFile(target, partial);
  await expect(migratePiConversation(session)).rejects.toThrow(
    'incomplete or divergent',
  );
  expect(await fs.readFile(target, 'utf8')).toBe(partial);
});
it('recovers interrupted publication without replacing later history', async () => {
  const actual = await vi.importActual<typeof fs>('node:fs/promises');
  vi.mocked(fs.link).mockImplementationOnce(async (from, to) => {
    await actual.link(from, to);
    throw new Error('interrupted after publish');
  });
  await expect(migratePiConversation(session)).rejects.toThrow('interrupted');
  await migratePiConversation(session);
  expect(await fs.readFile(target, 'utf8')).toContain('latest memory');
});
