import { expect, it, vi, afterEach } from 'vitest';
import {
  createRedactor,
  createOutputRedactor,
  MAX_OUTPUT_HELD,
  outputBlock,
  REDACTED,
} from '../src/protocol/index.ts';
import { OutputWriter } from '../src/agent/output-writer.ts';
import { GrowingRedactor } from '../src/agent/worker.ts';
import type { SpoolEvent } from '../src/core/events.ts';
const event = (
  content: string | undefined,
  phase: 'delta' | 'end' = 'delta',
  id = 'block',
): SpoolEvent => ({
  type: 'text',
  ...(content === undefined ? {} : { content }),
  meta: { output: { blockId: id, phase } },
});
afterEach(() => vi.useRealTimers());
for (const type of ['text', 'thinking'] as const)
  for (const pieces of [
    ['你好，我正在分析。', '继续无空格输出', '现在仍在生成。'],
    ['こんにちは分析しています', '次の手順を説明します。', 'まだ生成中です'],
  ])
    it(`previews ${type} without persistence before completion (${pieces[0]})`, async () => {
      vi.useFakeTimers();
      const saved: SpoolEvent[] = [];
      const live: SpoolEvent[] = [];
      const writer = new OutputWriter(
        (e) => saved.push(e),
        createRedactor(),
        true,
        (e) => live.push(e),
      );
      for (const [i, piece] of pieces.entries()) {
        writer.write({ ...event(piece), type });
        await vi.advanceTimersByTimeAsync(1000);
        expect(live.map((e) => e.content).join('')).toBe(
          pieces.slice(0, i + 1).join(''),
        );
        expect(saved).toHaveLength(0);
      }
      writer.write({ ...event(pieces.join(''), 'end'), type });
      expect(saved).toHaveLength(1);
      expect(saved[0]?.content).toBe(pieces.join(''));
      expect(outputBlock(saved[0]?.meta)?.phase).toBe('end');
      expect(vi.getTimerCount()).toBe(0);
    });
it('keeps the three ordinary-word examples unchanged on the legacy path', () => {
  const saved: SpoolEvent[] = [];
  const live: SpoolEvent[] = [];
  const writer = new OutputWriter(
    (e) => saved.push(e),
    createRedactor(['sample-secret']),
    false,
    (e) => live.push(e),
  );
  const samples = [
    'run all the tests',
    'Southeast Asia.',
    'Run npm_config_registry',
  ];
  for (const text of samples) writer.write({ type: 'text', content: text });
  writer.end();
  expect(saved.map((e) => e.content)).toEqual(samples);
  expect(live).toHaveLength(0);
});
it('redacts known credentials at every split, including whitespace and dynamically added values', async () => {
  vi.useFakeTimers();
  for (const secret of [
    'fictional value with spaces 123456',
    '跨段敏感值 含空白123456',
  ])
    for (let split = 1; split < secret.length; split++) {
      const redact = new GrowingRedactor(createRedactor());
      const saved: SpoolEvent[] = [];
      const live: SpoolEvent[] = [];
      const writer = new OutputWriter(
        (e) => saved.push(e),
        redact,
        true,
        (e) => live.push(e),
      );
      redact.add([secret]);
      writer.write(event('正文。' + secret.slice(0, split)));
      await vi.advanceTimersByTimeAsync(1000);
      writer.write(event(secret.slice(split) + '继续。'));
      await vi.advanceTimersByTimeAsync(1000);
      writer.write(event('正文。' + secret + '继续。', 'end'));
      expect(live.map((e) => e.content).join('')).toBe(
        '正文。' + REDACTED + '继续。',
      );
      expect(saved[0]?.content).toBe('正文。' + REDACTED + '继续。');
    }
});
it('closes interrupted previews without storing unfinished blocks', () => {
  const saved: SpoolEvent[] = [];
  const live: SpoolEvent[] = [];
  const writer = new OutputWriter(
    (e) => saved.push(e),
    createRedactor(['fictional value 123456']),
    true,
    (e) => live.push(e),
  );
  writer.write(event('safe fictional value'));
  writer.end();
  writer.end();
  expect(saved).toHaveLength(0);
  expect(live.map((e) => e.content).join('')).toBe('safe ' + REDACTED);
  expect(live.filter((e) => outputBlock(e.meta)?.phase === 'end')).toHaveLength(
    1,
  );
});
it('retains a full canonical snapshot and splits previews at UTF-8 boundaries', () => {
  const saved: SpoolEvent[] = [];
  const live: SpoolEvent[] = [];
  const text = '你好'.repeat(4000);
  const writer = new OutputWriter(
    (e) => saved.push(e),
    createRedactor(),
    true,
    (e) => live.push(e),
  );
  writer.write(event(text));
  writer.write(event(text, 'end'));
  expect(live.every((e) => Buffer.byteLength(e.content ?? '') <= 4096)).toBe(
    true,
  );
  expect(live.map((e) => e.content).join('')).toBe(text);
  expect(saved.map((e) => e.content)).toEqual([text]);
});
it('bounds unresolved ASCII tails while allowing ordinary long tokens to progress', () => {
  const redact = createOutputRedactor(() => createRedactor());
  let out = '';
  const text = 'a'.repeat(100_000);
  for (let i = 0; i < text.length; i += 20)
    out += redact.write(text.slice(i, i + 20));
  expect(out + redact.end()).toBe(text);
  expect(redact.peakHeld).toBeLessThanOrEqual(MAX_OUTPUT_HELD);
});

it('spools one complete body and retains the complete fallback summary', async () => {
  const { EventSpool, spoolPaths } = await import('../src/core/events.ts');
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = await import('node:path');
  const { ApiClient } = await import('../src/lib/http.ts');
  const dir = await mkdtemp(path.join(tmpdir(), 'output-spool-'));
  try {
    const spool = EventSpool.open({
      runsDir: dir,
      runId: 'preview',
      client: new ApiClient({ server: 'http://127.0.0.1:1' }),
      firstSeq: 1,
    });
    const writer = new OutputWriter(
      (e) => {
        spool.push(e);
      },
      createRedactor(),
      true,
    );
    writer.write(event('First part '));
    writer.flush();
    writer.write(event('and last part'));
    writer.flush();
    expect(spool.size).toBe(0);
    writer.write(event('First part and last part', 'end'));
    writer.write(event('First part and last part', 'end'));
    expect(spool.size).toBe(1);
    expect(spool.lastText).toBe('First part and last part');
    const rows = (await readFile(spoolPaths(dir, 'preview').spool, 'utf8'))
      .trim()
      .split('\n')
      .map((row) => JSON.parse(row));
    expect(rows.map((row) => row.content)).toEqual([
      'First part and last part',
    ]);
    writer.end();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
