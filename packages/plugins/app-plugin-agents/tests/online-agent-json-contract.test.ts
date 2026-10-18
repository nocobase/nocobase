import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { Tool } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { z } from 'zod';
import {
  OnlineAgentConfigurer,
  type OnlineAgentToolContext,
  type OnlineAgentToolDefinition,
} from '../server/online-agent/config.js';
import type { OnlineAgentJson } from '../server/online-agent/codec.js';
import { strictJson } from '../server/online-agent/strict-json.js';

const context: OnlineAgentToolContext = {
  user: { id: 'alice' },
  authorization: {
    identity: { principal: { type: 'user', id: 'alice' } },
  } as AuthorizationContext,
  credentials: { kind: 'fixture' },
  sessionId: 'session',
  signal: new AbortController().signal,
};
const options = { toolCallId: 'call', messages: [], context };
type BoundTool = Tool<unknown, OnlineAgentJson, OnlineAgentToolContext>;

async function bind(
  execute: () => unknown,
  toModelOutput?: BoundTool['toModelOutput'],
) {
  const configurer = new OnlineAgentConfigurer();
  configurer.registerTool('business', {
    version: '1',
    definition: {
      inputSchema: z.object({}),
      // Exercise the runtime boundary for JavaScript consumers and untrusted service results.
      execute: () => execute() as OnlineAgentJson,
      toModelOutput,
    },
  });
  const pending: Promise<unknown>[] = [];
  const config = await configurer.resolve(context, { tool: ['business'] });
  const tool = configurer.bind(config, context, undefined, (task) => {
    pending.push(task);
  }).business;
  return { tool, pending, configurer };
}

async function collect(tool: BoundTool): Promise<OnlineAgentJson[]> {
  const result = tool.execute!({}, options);
  if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
    const values: OnlineAgentJson[] = [];
    for await (const value of result) values.push(value);
    return values;
  }
  return [await result];
}

const invalidValues: [string, () => unknown][] = [
  ['undefined', () => undefined],
  ['nested undefined', () => ({ result: undefined })],
  ['array undefined', () => [undefined]],
  ['NaN', () => Number.NaN],
  ['positive infinity', () => Number.POSITIVE_INFINITY],
  ['negative infinity', () => ({ value: Number.NEGATIVE_INFINITY })],
  ['BigInt', () => 1n],
  ['function', () => () => 'not JSON'],
  ['symbol value', () => Symbol('private')],
  ['symbol key', () => ({ [Symbol('private')]: 'hidden' })],
  ['Date', () => new Date(0)],
  ['nested Date', () => ({ value: new Date(0) })],
  ['URL', () => new URL('https://example.com')],
  ['RegExp', () => /not-json/u],
  ['Map', () => new Map([['key', 'value']])],
  ['Set', () => new Set(['value'])],
  ['Buffer', () => Buffer.from('private')],
  ['typed array', () => new Uint8Array([1, 2])],
  ['ArrayBuffer', () => new ArrayBuffer(2)],
  ['DataView', () => new DataView(new ArrayBuffer(2))],
  ['sparse array', () => new Array(2)],
  ['partly sparse array', () => Object.assign(new Array(3), { 0: 1, 2: 3 })],
  ['array extra property', () => Object.assign([1], { extra: 2 })],
  ['array symbol', () => Object.assign([1], { [Symbol('extra')]: 2 })],
  ['nonplain object', () => Object.create({ inherited: true })],
  ['nonplain array', () => Object.setPrototypeOf([1], null)],
  [
    'class instance',
    () =>
      new (class Result {
        value = 1;
      })(),
  ],
  ['hidden property', () => Object.defineProperty({}, 'hidden', { value: 1 })],
  [
    'accessor',
    () =>
      Object.defineProperty({}, 'value', { enumerable: true, get: () => 1 }),
  ],
  [
    'setter',
    () =>
      Object.defineProperty({}, 'value', { enumerable: true, set: () => {} }),
  ],
  [
    'cycle',
    () => {
      const value: unknown[] = [];
      value.push(value);
      return value;
    },
  ],
  [
    'object cycle',
    () => {
      const value: Record<string, unknown> = {};
      value.self = value;
      return value;
    },
  ],
];

describe('strict tool JSON results', () => {
  it('preserves the SDK generics while constraining registered and bound output to JSON', () => {
    expectTypeOf<
      OnlineAgentToolDefinition<{ id: string }, { value: number }>['execute']
    >().toExtend<
      NonNullable<
        Tool<
          { id: string },
          { value: number },
          OnlineAgentToolContext
        >['execute']
      >
    >();
    expectTypeOf<ReturnType<OnlineAgentConfigurer['bind']>>().toEqualTypeOf<
      Record<string, BoundTool>
    >();
  });

  for (const mode of ['sync', 'promise', 'stream'] as const) {
    describe(`${mode} results`, () => {
      it.each(invalidValues)(
        'rejects %s without executing the tool again',
        async (_name, create) => {
          const execute = vi.fn(create);
          const fixture = await bind(() => {
            if (mode === 'promise') return Promise.resolve().then(execute);
            if (mode === 'stream')
              return (async function* () {
                yield execute();
              })();
            return execute();
          });
          await expect(collect(fixture.tool)).rejects.toThrow('strict JSON');
          expect(execute).toHaveBeenCalledTimes(1);
          await Promise.allSettled(fixture.pending);
          expect(execute).toHaveBeenCalledTimes(1);
        },
      );

      it('returns detached JSON, including null-prototype records and shared references', async () => {
        const shared = { value: 'original' };
        const raw = Object.assign(Object.create(null), {
          first: shared,
          second: shared,
          all: [null, true, false, 1, 'text', []],
        }) as OnlineAgentJson;
        const fixture = await bind(() => {
          if (mode === 'promise') return Promise.resolve(raw);
          if (mode === 'stream')
            return (async function* () {
              yield raw;
            })();
          return raw;
        });
        const [result] = await collect(fixture.tool);
        expect(result).toEqual(raw);
        expect(result).not.toBe(raw);
        const record = result as Record<string, OnlineAgentJson>;
        expect(record.first).not.toBe(shared);
        expect(record.first).not.toBe(record.second);
        shared.value = 'mutated';
        expect(record.first).toEqual({ value: 'original' });
        await Promise.all(fixture.pending);
      });
    });
  }

  it('does not invoke getters, toJSON or protocol accessors to repair a raw result', async () => {
    const getter = vi.fn(() => 'private');
    const toJSON = vi.fn(() => ({ converted: true }));
    const values = [
      Object.defineProperty({}, 'value', { enumerable: true, get: getter }),
      Object.defineProperty({}, 'then', { enumerable: true, get: getter }),
      Object.defineProperty({}, Symbol.asyncIterator, { get: getter }),
      { toJSON },
      Object.assign(new Date(0), { toJSON }),
    ];
    for (const value of values) {
      const fixture = await bind(() => value);
      await expect(collect(fixture.tool)).rejects.toThrow();
    }
    expect(getter).not.toHaveBeenCalled();
    expect(toJSON).not.toHaveBeenCalled();
  });

  it('detaches a synchronous result before yielding control to its caller', async () => {
    const raw = { value: 'original' };
    const { tool } = await bind(() => raw);
    const pending = tool.execute!({}, options);
    raw.value = 'mutated';
    expect(await pending).toEqual({ value: 'original' });
  });

  it('validates every stream emission, including promised values, and closes a failed iterator', async () => {
    const close = vi.fn();
    const raw = { count: 1 };
    let next = 0;
    const iterable: AsyncIterable<unknown> = {
      [Symbol.asyncIterator]: () => ({
        next: async () => ({
          done: false,
          value: Promise.resolve(next++ === 0 ? raw : { invalid: undefined }),
        }),
        return: async () => {
          close();
          return { done: true, value: undefined };
        },
      }),
    };
    const { tool, pending } = await bind(() => iterable);
    const stream = tool.execute!({}, options) as AsyncIterable<OnlineAgentJson>;
    const iterator = stream[Symbol.asyncIterator]();
    expect((await iterator.next()).value).toEqual({ count: 1 });
    raw.count = 2;
    await expect(iterator.next()).rejects.toThrow('strict JSON');
    expect(close).toHaveBeenCalledTimes(1);
    await Promise.all(pending);
  });

  it('keeps each successful emission detached even when the tool reuses a mutable object', async () => {
    const raw = { count: 1 };
    const { tool } = await bind(() =>
      (async function* () {
        yield raw;
        raw.count = 2;
        yield raw;
      })(),
    );
    expect(await collect(tool)).toEqual([{ count: 1 }, { count: 2 }]);
  });

  it('rejects an empty stream instead of letting the SDK synthesize undefined', async () => {
    const { tool, pending } = await bind(() => (async function* () {})());
    await expect(collect(tool)).rejects.toThrow('must yield a JSON value');
    await Promise.all(pending);
  });

  it('settles stream tracking when the consumer closes the iterator', async () => {
    const { tool, pending } = await bind(() =>
      (async function* () {
        yield { first: true };
        yield { second: true };
      })(),
    );
    const stream = tool.execute!({}, options) as AsyncIterable<OnlineAgentJson>;
    const iterator = stream[Symbol.asyncIterator]();
    await iterator.next();
    await iterator.return!();
    await Promise.all(pending);
  });

  it('passes detached raw JSON to toModelOutput without mutating persisted tool evidence', async () => {
    const raw = { nested: { value: 'business' } };
    const converter = vi.fn(({ output }: { output: OnlineAgentJson }) => {
      const record = output as typeof raw;
      record.nested.value = 'converted';
      return { type: 'text' as const, value: record.nested.value };
    });
    const execute = vi.fn(() => raw);
    const { tool, configurer } = await bind(execute, converter);
    const [result] = await collect(tool);
    expect(
      await tool.toModelOutput!({
        toolCallId: 'call',
        input: {},
        output: result,
      }),
    ).toEqual({
      type: 'text',
      value: 'converted',
    });
    expect(result).toEqual({ nested: { value: 'business' } });
    expect(raw).toEqual({ nested: { value: 'business' } });
    expect(converter.mock.calls[0][0].output).not.toBe(result);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(configurer.toolDefinition('business')?.inputSchema).toBeDefined();
    expect(configurer.toolDefinition('unknown')).toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('detaches live converter inputs from the SDK tool call', async () => {
    const input = { nested: { value: 'executed' } };
    const { tool } = await bind(
      () => 'raw',
      ({ input: value }) => {
        (value as typeof input).nested.value = 'converted';
        Object.assign(value as object, { invalid: new Date() });
        return { type: 'text', value: 'model' };
      },
    );
    expect(
      await tool.toModelOutput!({ toolCallId: 'call', input, output: 'raw' }),
    ).toEqual({
      type: 'text',
      value: 'model',
    });
    expect(input).toEqual({ nested: { value: 'executed' } });
  });
  it('does not let toModelOutput repair an invalid raw business result', async () => {
    const converter = vi.fn(() => ({
      type: 'text' as const,
      value: 'repaired',
    }));
    const { tool } = await bind(() => new Date(0), converter);
    await expect(collect(tool)).rejects.toThrow('strict JSON');
    expect(converter).not.toHaveBeenCalled();
  });

  it('preserves own __proto__ keys as detached data without prototype pollution', () => {
    const raw = Object.fromEntries([['__proto__', { safe: true }]]);
    const result = strictJson(raw);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.hasOwn(result as object, '__proto__')).toBe(true);
    expect(result).toEqual(raw);
    expect(strictJson(Object.freeze({ value: 1 }))).toEqual({ value: 1 });
  });
});
