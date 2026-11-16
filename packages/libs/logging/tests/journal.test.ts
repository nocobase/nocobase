import {
  mkdtemp,
  readFile,
  rm,
  appendFile,
  symlink,
  utimes,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appendJournal, readJournal, pruneJournals } from '../src/journal.js';
import { normalizeFileOptions } from '../src/output.js';
import { createLogging } from '../src/logging.js';
const roots: string[] = [];
it('按时间清理不展开受保护路径列表，也不对每份文件 resolve', async () => {
  const root = await directory();
  await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      writeFile(path.join(root, 'run-' + index + '.log'), 'fresh'),
    ),
  );
  const resolve = vi.spyOn(path, 'resolve');
  try {
    await pruneJournals(root, { retentionDays: 7 }, undefined, {
      retentionOnly: true,
    });
    expect(
      resolve.mock.calls.filter(([directory]) => directory === root),
    ).toHaveLength(0);
    expect(await readdir(root)).toHaveLength(20);
  } finally {
    resolve.mockRestore();
  }
});
it('按时间清理所有过期侧车，空文件不获通用豁免，单文件保护保持有效', async () => {
  const root = await directory();
  const names = [
    'expired.stderr',
    'expired-full.stderr',
    'fresh.stderr',
    'protected.stderr',
  ];
  for (const name of names)
    await writeFile(
      path.join(root, name),
      name === 'expired-full.stderr' ? 'crash' : '',
    );
  for (const name of names.filter((name) => name !== 'fresh.stderr'))
    await utimes(path.join(root, name), new Date(0), new Date(0));
  await pruneJournals(root, { retentionDays: 7 }, 'protected.stderr', {
    retentionOnly: true,
  });
  expect(await readdir(root)).toEqual(['fresh.stderr', 'protected.stderr']);
});
async function directory(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'journal-'));
  roots.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
describe('persistent journals', () => {
  it('appends errors with redaction and reads incrementally without consuming a partial line', async () => {
    const root = await directory();
    const file = path.join(root, 'deployment.log');
    appendJournal(file, {
      time: new Date().toISOString(),
      level: 'error',
      msg: 'Failed',
      err: new Error('password=private'),
      config: { secret: 'private' },
    });
    await appendFile(
      file,
      '{"time":"2026-09-17","level":"info","msg":"partial',
    );
    const first = await readJournal(root, { fromStart: true });
    expect(first.entries).toHaveLength(1);
    expect(JSON.stringify(first.entries)).not.toContain('private');
    expect(first.entries[0]?.err).toHaveProperty('stack');
    await appendFile(file, '"}\n');
    const next = await readJournal(root, { cursor: first.cursor });
    expect(next.entries.map((entry) => entry.msg)).toEqual(['partial']);
  });
  it('never follows a log symlink', async () => {
    const root = await directory();
    const outside = await directory();
    appendJournal(path.join(outside, 'private.log'), {
      time: '',
      level: 'info',
      msg: 'private',
    });
    await symlink(
      path.join(outside, 'private.log'),
      path.join(root, 'linked.log'),
    );
    expect((await readJournal(root)).entries).toEqual([]);
  });
  it('persists multiple named loggers with console disabled and closes cleanly', async () => {
    const root = await directory();
    const logging = createLogging({
      file: { directory: root },
      console: { enabled: false },
    });
    logging.getLogger('system').error({ err: new Error('failure') }, 'Failed');
    logging.getLogger('request').info('GET / completed');
    await logging.close();
    const result = await readJournal(root, { fromStart: true });
    expect(result.entries.map((entry) => entry.logger).sort()).toEqual([
      'request',
      'system',
    ]);
    expect(
      await readFile(
        path.join(
          root,
          `app.${new Date().toISOString().slice(0, 10)}.000000.log`,
        ),
        'utf8',
      ),
    ).toContain('failure');
  });
});

it('detects replacement and tolerates truncated files and invalid cursors', async () => {
  const root = await directory();
  const file = path.join(root, 'system.log');
  appendJournal(file, { time: '2026-09-17', level: 50, msg: 'first' });
  const first = await readJournal(root, { fromStart: true, level: 'error' });
  await rm(file);
  appendJournal(file, { time: '2026-09-17', level: 50, msg: 'next' });
  const next = await readJournal(root, {
    cursor: first.cursor,
    level: 'error',
  });
  expect(next.reset).toBe(true);
  expect(next.entries[0]?.msg).toBe('next');
  await expect(readJournal(root, { cursor: '../../private' })).rejects.toThrow(
    'Invalid log cursor',
  );
});

it('rotates output within the total budget and expires old files without removing the protected file', async () => {
  const root = await directory();
  const logging = createLogging({
    file: { directory: root, maxSizeMB: 0.02 },
    console: { enabled: false },
  });
  for (let index = 0; index < 70; index++)
    logging.getLogger('system').info({ index }, 'x'.repeat(500));
  await logging.close();
  const files = await readdir(root);
  expect(files.some((file) => !file.includes('000000'))).toBe(true);
  expect(
    (
      await Promise.all(
        files.map(async (file) => (await stat(path.join(root, file))).size),
      )
    ).reduce((a, b) => a + b, 0),
  ).toBeLessThanOrEqual(0.02 * 1024 * 1024);
  const old = new Date(Date.now() - 10 * 86400000);
  await Promise.all(
    files.map((file) => utimes(path.join(root, file), old, old)),
  );
  await pruneJournals(root, { retentionDays: 1 }, files[0]);
  expect(await readdir(root)).toEqual([files[0]]);
});

it('routes sources to shared or explicit files without duplicates, including a disabled source', async () => {
  const root = await directory();
  const logging = createLogging({
    file: { directory: root },
    console: { enabled: false },
    loggers: {
      request: { file: { name: 'request' } },
      workflow: { file: { name: 'tasks' } },
      queue: { file: { name: 'tasks' } },
      hidden: { file: { enabled: false } },
    },
  });
  for (const name of [
    'system',
    'notification',
    'request',
    'workflow',
    'queue',
    'hidden',
  ])
    logging.getLogger(name).info(name);
  await logging.close();
  const files = await readdir(root);
  expect(files.map((file) => file.split('.')[0]).sort()).toEqual([
    'app',
    'request',
    'tasks',
  ]);
  expect(
    (await readJournal(root, { fromStart: true })).entries
      .map((entry) => entry.msg)
      .sort(),
  ).toEqual(['system', 'notification', 'request', 'workflow', 'queue'].sort());
  const tasks = files.find((file) => file.startsWith('tasks.'))!;
  expect(
    (await readJournal(root, { fromStart: true }, tasks)).entries
      .map((entry) => entry.logger)
      .sort(),
  ).toEqual(['queue', 'workflow']);
});

it('preserves every record across shared rotation and allows a remaining owner to keep writing', async () => {
  const root = await directory();
  const options = {
    file: { directory: root, maxFileSizeMB: 0.002, maxTotalSizeMB: 1 },
    console: { enabled: false },
  };
  const first = createLogging(options);
  const second = createLogging(options);
  for (let i = 0; i < 50; i++) {
    first.getLogger('workflow').info({ index: i }, 'a'.repeat(100));
    second.getLogger('lifecycle').info({ index: i }, 'b'.repeat(100));
  }
  await first.close();
  second.getLogger('lifecycle').info('after close');
  await second.close();
  expect((await readJournal(root, { fromStart: true })).entries).toHaveLength(
    101,
  );
});

it('global file disable cannot be overridden by a named logger', async () => {
  const root = await directory();
  const logging = createLogging({
    file: { directory: root, enabled: false },
    console: { enabled: false },
    loggers: { workflow: { file: { enabled: true } } },
  });
  logging.getLogger('workflow').error('not persisted');
  await logging.close();
  expect(await readdir(root)).toEqual([]);
});

it('keeps legacy total-size limits effective when merged with new defaults', () => {
  expect(
    normalizeFileOptions({ maxSizeMB: 20, maxTotalSizeMB: 500 }).maxTotalSizeMB,
  ).toBe(20);
  expect(() =>
    normalizeFileOptions({ maxFileSizeMB: 50, maxTotalSizeMB: 10 }),
  ).toThrow('must not exceed');
});

it('keeps readable console diagnostics when file output fails', async () => {
  const root = await directory();
  const blocked = path.join(root, 'blocked');
  await appendFile(blocked, 'not a directory');
  const stdout = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation(() => true);
  const stderr = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation(() => true);
  const logging = createLogging({
    file: { directory: blocked },
    console: { enabled: true, pretty: true, color: false },
  });
  try {
    logging
      .getLogger('workflow')
      .error({ executionId: 'run-1', err: new Error('failure') }, 'failed');
    await logging.close();
    expect(stdout.mock.calls[0]?.[0]).toContain('ERROR [workflow] failed');
    expect(stdout.mock.calls[0]?.[0]).toContain('run-1');
    expect(stdout.mock.calls[0]?.[0]).toContain('failure');
    expect(stderr).toHaveBeenCalled();
  } finally {
    await logging.close();
    stdout.mockRestore();
    stderr.mockRestore();
  }
});

it('resumes the latest segment after restart without losing boundary records', async () => {
  const root = await directory();
  const options = {
    file: { directory: root, maxFileSizeMB: 0.002, maxTotalSizeMB: 1 },
    console: { enabled: false },
  };
  for (let run = 0; run < 2; run++) {
    const logging = createLogging(options);
    for (let index = 0; index < 50; index++)
      logging
        .getLogger('system')
        .info({ index: run * 50 + index }, 'x'.repeat(300));
    await logging.close();
  }
  const records = (await readJournal(root, { fromStart: true })).entries;
  expect(records).toHaveLength(100);
  expect(new Set(records.map((entry) => entry.index)).size).toBe(100);
});

it('continues reading hundreds of files with a URL-safe cursor and isolates its scope', async () => {
  const root = await directory();
  for (let index = 0; index < 450; index++)
    appendJournal(
      path.join(root, `app.2026-09-17.${String(index).padStart(6, '0')}.log`),
      {
        time: '2026-09-17',
        level: 30,
        msg: `Record ${index}`,
      },
    );
  const first = await readJournal(root, { fromStart: true });
  expect(first.entries).toHaveLength(450);
  expect(first.cursor.length).toBeLessThan(1024);
  expect((await readJournal(root, { cursor: first.cursor })).entries).toEqual(
    [],
  );
  appendJournal(path.join(root, 'app.2026-09-17.000449.log'), {
    time: '2026-09-18',
    level: 30,
    msg: 'Next record',
  });
  expect(
    (await readJournal(root, { cursor: first.cursor })).entries.map(
      (entry) => entry.msg,
    ),
  ).toEqual(['Next record']);
  await expect(
    readJournal(await directory(), { cursor: first.cursor }),
  ).rejects.toThrow('Invalid log cursor');
});

it('merges interleaved sources across pages without gaps, duplicates, or backwards timestamps', async () => {
  const root = await directory();
  const records = Array.from({ length: 1400 }, (_, index) => ({
    time: new Date(Date.UTC(2026, 8, 17) + index * 1000).toISOString(),
    level: 30,
    msg: `Record ${index} ${'x'.repeat(500)}`,
    index,
  }));
  for (const [name, parity] of [
    ['app', 1],
    ['workflow', 0],
  ] as const)
    await writeFile(
      path.join(root, `${name}.log`),
      records
        .filter((entry) => entry.index % 2 === parity)
        .map((entry) => JSON.stringify(entry))
        .join('\n') + '\n',
    );
  const received = [];
  let cursor: string | undefined;
  let pages = 0;
  for (;;) {
    const page = await readJournal(root, { fromStart: true, cursor });
    if (cursor) {
      const retried = await readJournal(root, { fromStart: true, cursor });
      expect(retried.entries).toEqual(page.entries);
    }
    received.push(...page.entries);
    cursor = page.cursor;
    expect(++pages).toBeLessThan(20);
    if (!page.hasMore) break;
  }
  expect(pages).toBeGreaterThan(1);
  expect(received.map((entry) => entry.index)).toEqual(
    records.map((entry) => entry.index),
  );
});

it('finishes bounded lookahead before emitting a later file, including filtered pages', async () => {
  const root = await directory();
  await writeFile(
    path.join(root, 'app.log'),
    Array.from({ length: 1200 }, (_, index) =>
      JSON.stringify({
        time: '2026-09-17',
        level: 30,
        msg: 'x'.repeat(500),
        index,
      }),
    ).join('\n') + '\n',
  );
  appendJournal(path.join(root, 'workflow.log'), {
    time: '2026-09-16',
    level: 50,
    msg: 'Earlier error',
  });
  let page = await readJournal(root, { fromStart: true, level: 'error' });
  expect(page.entries).toEqual([]);
  expect(page.hasMore).toBe(true);
  for (let scans = 0; page.hasMore && scans < 10; scans++)
    page = await readJournal(root, { cursor: page.cursor, level: 'error' });
  expect(page.entries.map((entry) => entry.msg)).toEqual(['Earlier error']);
  expect(page.hasMore).toBe(false);
});

it('reports expired checkpoints and can restart history reading', async () => {
  const root = await directory();
  appendJournal(path.join(root, 'app.log'), {
    time: '2026-09-17',
    level: 30,
    msg: 'Still retained',
  });
  const first = await readJournal(root, { fromStart: true });
  const clock = vi
    .spyOn(Date, 'now')
    .mockReturnValue(Date.now() + 6 * 60 * 1000);
  try {
    const reset = await readJournal(root, {
      cursor: first.cursor,
      fromStart: true,
    });
    expect(reset.reset).toBe(true);
    expect(reset.entries.map((entry) => entry.msg)).toEqual(['Still retained']);
  } finally {
    clock.mockRestore();
  }
});

it('follows a previously inactive source without dropping its first new record', async () => {
  const root = await directory();
  for (let index = 0; index < 5; index++) {
    const file = path.join(root, `source-${index}.log`);
    appendJournal(file, { time: '2026-09-17', level: 30, msg: `Old ${index}` });
    const modified = new Date(Date.UTC(2026, 8, 17) + index * 1000);
    await utimes(file, modified, modified);
  }
  const first = await readJournal(root);
  expect(first.entries.some((entry) => entry.msg === 'Old 0')).toBe(false);
  appendJournal(path.join(root, 'source-0.log'), {
    time: '2026-09-18',
    level: 30,
    msg: 'First new record',
  });
  const next = await readJournal(root, { cursor: first.cursor });
  expect(next.entries.map((entry) => entry.msg)).toEqual(['First new record']);
});

it('preserves correlation and error details when truncating oversized Unicode and escaped payloads', async () => {
  const root = await directory();
  const file = path.join(root, 'app.log');
  const identities = {
    logger: 'workflow',
    appId: 'app-1',
    deploymentId: 'deploy-1',
    runtimeId: 'runtime-1',
    requestId: 'request-1',
    workflowId: 1,
    executionId: 2,
    nodeId: 3,
    nodeKey: 'run',
  };
  appendJournal(file, {
    time: '2026-09-17',
    level: 50,
    msg: 'Failure',
    ...identities,
    err: new Error('Execution failed', {
      cause: new Error('password=hidden-value'),
    }),
    details: '\u0000中文'.repeat(40000),
  });
  const page = await readJournal(root, { fromStart: true, source: 'workflow' });
  expect(page.entries).toHaveLength(1);
  expect(page.entries[0]).toMatchObject({
    ...identities,
    truncated: true,
    err: {
      message: 'Execution failed',
      stack: expect.stringContaining('Execution failed'),
      cause: { message: 'password=[REDACTED]' },
    },
  });
  const content = await readFile(file, 'utf8');
  expect(Buffer.byteLength(content)).toBeLessThanOrEqual(32 * 1024);
  expect(content).not.toContain('hidden-value');
});
