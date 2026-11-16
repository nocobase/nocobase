import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { afterEach, expect, it, vi } from 'vitest';
const counts = vi.hoisted(() => ({ opens: 0, writes: 0, closes: 0 }));
vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>();
  return {
    ...actual,
    open: async (...args: Parameters<typeof actual.open>) => {
      counts.opens++;
      const handle = await actual.open(...args);
      const write = handle.writeFile.bind(handle);
      const close = handle.close.bind(handle);
      handle.writeFile = (...values) => {
        counts.writes++;
        return write(...values);
      };
      handle.close = () => {
        counts.closes++;
        return close();
      };
      return handle;
    },
  };
});
import { DiagnosticsWriter } from '../server/runners/diagnostics-writer.js';
let root: string | undefined;
afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  counts.opens = counts.writes = counts.closes = 0;
});
it('一千条小日志共用句柄和有界缓冲，结束时刷新并关闭', async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'diagnostics-writer-'));
  const writer = new DiagnosticsWriter(root);
  const line =
    JSON.stringify({
      time: '2026-11-01T00:00:00Z',
      level: 'info',
      msg: 'fixture',
    }) + '\n';
  for (let index = 0; index < 1000; index++)
    await writer.write('runner.log', line);
  await writer.close();
  expect(await readFile(path.join(root, 'runner.log'), 'utf8')).toBe(
    line.repeat(1000),
  );
  expect(counts.opens).toBe(1);
  expect(counts.closes).toBe(1);
  expect(counts.writes).toBeLessThanOrEqual(2);
});
it('超过句柄缓存的交错来源仍保留全部数据，释放后可重复关闭', async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'diagnostics-writer-many-'));
  await mkdir(path.join(root, 'runs'));
  const writer = new DiagnosticsWriter(root);
  for (let round = 0; round < 2; round++)
    for (let index = 0; index < 80; index++)
      await writer.write(`runs/${index}.log`, `round-${round}\n`);
  await writer.close();
  await writer.close();
  for (let index = 0; index < 80; index++)
    expect(
      await readFile(path.join(root, 'runs', `${index}.log`), 'utf8'),
    ).toBe('round-0\nround-1\n');
  expect(counts.opens).toBe(counts.closes);
});
