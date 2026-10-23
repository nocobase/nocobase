import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createRedactor,
  outputBlock,
  REDACTED,
} from '../src/protocol/index.ts';
import { GrowingRedactor } from '../src/agent/worker.ts';
import { OutputWriter } from '../src/agent/output-writer.ts';
import { EventSpool } from '../src/core/events.ts';
import type { SpoolEvent } from '../src/core/events.ts';

const event = (
  content: string,
  phase: 'delta' | 'end' = 'delta',
  id = 'block',
): SpoolEvent => ({
  type: 'text',
  content,
  meta: { output: { blockId: id, phase } },
});
afterEach(() => vi.useRealTimers());

for (const type of ['text', 'thinking'] as const) {
  for (const pieces of [
    ['你好，我正在分析。', '接下来逐步说明，', '现在仍在生成。'],
    ['你好我正在分析', '接下来逐步说明', '现在仍在生成'],
    [
      'こんにちは。分析しています。',
      '次の手順を説明します。',
      'まだ生成中です。',
    ],
    ['こんにちは分析しています', '次の手順を説明します', 'まだ生成中です'],
  ]) {
    it(`streams ${type} before block completion: ${pieces[0]}`, async () => {
      vi.useFakeTimers();
      const events: SpoolEvent[] = [];
      const writer = new OutputWriter(
        (e) => events.push(e),
        createRedactor(),
        true,
      );
      for (let i = 0; i < pieces.length; i++) {
        writer.write({ ...event(pieces[i]), type });
        await vi.advanceTimersByTimeAsync(1000);
        expect(events.map((e) => e.content).join('')).toBe(
          pieces.slice(0, i + 1).join(''),
        );
        expect(events).toHaveLength(i + 1);
        expect(
          events.every((e) => outputBlock(e.meta)?.phase === 'delta'),
        ).toBe(true);
      }
      writer.write({ ...event('', 'end'), type });
      expect(events).toHaveLength(pieces.length + 1);
      expect(events.at(-1)?.content).toBe('');
      expect(vi.getTimerCount()).toBe(0);
    });
  }

  it(`streams ${type} safely at every secret split amid unspaced text`, async () => {
    vi.useFakeTimers();
    for (const secret of [
      '跨段敏感值 含空白123456',
      'ghp_' + 'a1'.repeat(18),
    ]) {
      for (let split = 1; split < secret.length; split++) {
        const events: SpoolEvent[] = [];
        const writer = new OutputWriter(
          (e) => events.push(e),
          createRedactor([secret.startsWith('ghp_') ? undefined : secret]),
          true,
        );
        writer.write({
          ...event('开始逐步输出。' + secret.slice(0, split)),
          type,
        });
        await vi.advanceTimersByTimeAsync(1000);
        expect(events.map((e) => e.content).join('')).toBe('开始逐步输出。');
        writer.write({
          ...event(secret.slice(split) + '继续安全输出。'),
          type,
        });
        await vi.advanceTimersByTimeAsync(1000);
        expect(events.map((e) => e.content).join('')).toBe(
          `开始逐步输出。${REDACTED}继续安全输出。`,
        );
        expect(
          events.every((e) => outputBlock(e.meta)?.phase === 'delta'),
        ).toBe(true);
        writer.write({ ...event('', 'end'), type });
        expect(vi.getTimerCount()).toBe(0);
      }
    }
  });
}

it('redacts every split of a whitespace-containing value before timers, disk and transport', async () => {
  vi.useFakeTimers();
  const dir = await mkdtemp(path.join(tmpdir(), 'output-spool-'));
  const secret = 'fictional value with spaces 123456';
  try {
    const sent: unknown[] = [];
    const spool = EventSpool.open({
      runsDir: dir,
      runId: 'safe',
      firstSeq: 1,
      client: {
        request: async (_method: string, _route: string, body: unknown) => {
          sent.push(body);
          return {};
        },
      } as never,
      redactor: createRedactor([secret]),
    });
    const writer = new OutputWriter(
      (e) => {
        spool.push(e);
      },
      createRedactor([secret]),
      true,
    );
    for (let split = 1; split < secret.length; split++) {
      const id = String(split);
      writer.write(event('before ' + secret.slice(0, split), 'delta', id));
      await vi.advanceTimersByTimeAsync(1000);
      writer.write(event(secret.slice(split) + ' after', 'end', id));
    }
    writer.end();
    await spool.flush();
    const raw = await readFile(path.join(dir, 'safe.events.ndjson'), 'utf8');
    expect(raw).not.toContain(secret);
    expect(JSON.stringify(sent)).not.toContain(secret);
    const rows = raw
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    for (let split = 1; split < secret.length; split++) {
      const text = rows
        .filter((e) => outputBlock(e.meta)?.blockId === String(split))
        .map((e) => e.content)
        .join('');
      expect(text).toBe(`before ${REDACTED} after`);
    }
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it('uses newly issued credentials, keeps streams separate and safely closes interrupted tails', () => {
  const secret = 'dynamic credential with spaces 98765';
  const redactor = new GrowingRedactor(createRedactor());
  const events: SpoolEvent[] = [];
  const writer = new OutputWriter((e) => events.push(e), redactor, true);
  writer.write(event('before dynamic'));
  redactor.add([secret]);
  writer.write(event(' credential with spaces 98765 after', 'end'));
  writer.write(event('dynamic credential', 'delta', 'interrupted'));
  writer.write({ type: 'toolUse', tool: 'shell' });
  writer.end();
  writer.end();
  expect(
    events
      .filter((e) => outputBlock(e.meta)?.blockId === 'block')
      .map((e) => e.content)
      .join(''),
  ).toBe(`before ${REDACTED} after`);
  expect(
    events
      .filter((e) => outputBlock(e.meta)?.blockId === 'interrupted')
      .map((e) => e.content)
      .join(''),
  ).toBe(REDACTED);
  expect(
    events.filter((e) => outputBlock(e.meta)?.phase === 'end'),
  ).toHaveLength(2);
});

it('coalesces 300 safe deltas into three timed events plus one empty block end', async () => {
  vi.useFakeTimers();
  const events: SpoolEvent[] = [];
  const writer = new OutputWriter(
    (e) => events.push(e),
    createRedactor(),
    true,
  );
  for (let second = 0; second < 3; second++) {
    for (let i = 0; i < 100; i++) writer.write(event('x '));
    await vi.advanceTimersByTimeAsync(1000);
  }
  writer.write(event('', 'end'));
  expect(events.map((e) => e.content)).toEqual([
    'x '.repeat(100),
    'x '.repeat(100),
    'x '.repeat(100),
    '',
  ]);
  expect(vi.getTimerCount()).toBe(0);
});

it('applies the size boundary after redaction, preserves unicode and sends complete blocks when disabled', () => {
  const secret = 'fictional-secret-123456';
  for (const enabled of [false, true]) {
    const events: SpoolEvent[] = [];
    const writer = new OutputWriter(
      (e) => events.push(e),
      createRedactor([secret]),
      enabled,
    );
    const text = '你好 '.repeat(2000) + secret;
    writer.write(event(text.slice(0, -5)));
    writer.write(event(text.slice(-5), 'end'));
    expect(events.map((e) => e.content).join('')).toBe(
      '你好 '.repeat(2000) + REDACTED,
    );
    if (enabled) {
      expect(
        events.every((e) => Buffer.byteLength(e.content ?? '', 'utf8') <= 4096),
      ).toBe(true);
    } else {
      expect(events).toHaveLength(1);
      expect(events[0]!.meta?.output).toBeUndefined();
    }
  }
});

it('contains timer write failures and clears timers before exception cleanup', async () => {
  vi.useFakeTimers();
  const failure = new Error('Fixture disk failure');
  const writer = new OutputWriter(
    () => {
      throw failure;
    },
    createRedactor(),
    true,
  );
  writer.write(event('safe text '));
  await vi.advanceTimersByTimeAsync(1000);
  expect(() => writer.end()).toThrow(failure);
  expect(vi.getTimerCount()).toBe(0);
});
