import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  isToolUIPart,
  type ToolResultPart,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import { ServiceContainer } from '@nocobase/service-provider';
import { OnlineAgentConfigurator } from '../server/online-agent/config.js';
import {
  NativeMessages,
  type NativeMessage,
} from '../server/online-agent/messages.js';

const metadata = {
  conversationId: 'conversation',
  createdAt: '2026-01-01T00:00:00.000Z',
  revision: 1,
  seq: 1,
  executionId: 'execution',
};
const message = (parts: UIMessage['parts']): NativeMessage => ({
  id: 'message',
  role: 'assistant',
  metadata: structuredClone(metadata),
  parts,
});
const result = (
  name = 'business',
  output: unknown = { display: 'visible', secret: 'private' },
): UIMessage['parts'][number] => ({
  type: `tool-${name}`,
  toolCallId: name,
  state: 'output-available',
  input: { value: 'input', secret: 'private' },
  output,
  callProviderMetadata: { provider: { secret: 'call-private' } },
  resultProviderMetadata: { provider: { secret: 'result-private' } },
});
function fixture() {
  const configurator = new OnlineAgentConfigurator();
  const input = vi.fn((value: { value: string; secret?: string }) => ({
    value: value.value,
  }));
  const output = vi.fn((value: { display: string; secret: string }) => ({
    display: value.display,
  }));
  configurator.registerTool('business', {
    version: '1',
    definition: {
      inputSchema: z.object({
        value: z.string(),
        secret: z.string().optional(),
      }),
      execute: async () => ({ display: 'visible', secret: 'private' }),
      public: { input, output },
    },
  });
  return {
    configurator,
    input,
    output,
    messages: new NativeMessages(configurator),
  };
}
function toolOutputs(messages: Awaited<ReturnType<NativeMessages['model']>>) {
  return messages.flatMap((item) =>
    item.role === 'tool'
      ? item.content
          .filter((part) => part.type === 'tool-result')
          .map((part) => part.output)
      : [],
  );
}

describe('NativeMessages private SDK originals', () => {
  it('validates SDK internals independently of the public validator and detaches originals', async () => {
    const { messages } = fixture();
    const original = message([
      {
        type: 'reasoning',
        text: 'private reasoning',
        providerMetadata: { provider: { signature: 'private' } },
      },
      {
        type: 'tool-business',
        toolCallId: 'approval',
        state: 'approval-requested',
        input: { value: 'input' },
        approval: {
          id: 'approval',
          inputSchemaInput: { value: 'raw' },
          descriptor: { secret: 'private' },
          signature: 'private',
          requestReason: 'private',
          isAutomatic: true,
        },
      },
      result(),
    ]);
    const before = structuredClone(original);
    const validated = await messages.validate([original]);
    expect(validated).toEqual([before]);
    expect(original).toEqual(before);
    validated[0].parts.length = 0;
    expect(original).toEqual(before);
    await expect(messages.validate([original, original])).rejects.toThrow(
      'duplicate',
    );
    await expect(messages.validate([{ ...original, id: '' }])).rejects.toThrow(
      'Invalid',
    );
    await expect(
      messages.validate([{ ...original, parts: [{ type: 'text', text: 42 }] }]),
    ).rejects.toThrow();
    expect(await messages.validate([])).toEqual([]);
  });

  it('rejects lossy raw tool values before normalizing optional SDK properties', async () => {
    const { messages } = fixture();
    for (const output of [
      undefined,
      { nested: undefined },
      [undefined],
      new Date(),
      Infinity,
    ])
      await expect(
        messages.validate([
          message([{ ...result(), output } as UIMessage['parts'][number]]),
        ]),
      ).rejects.toThrow();
    const getter = vi.fn(() => 'private');
    const output = Object.defineProperty({}, 'secret', {
      enumerable: true,
      get: getter,
    });
    await expect(
      messages.validate([message([result('business', output)])]),
    ).rejects.toThrow();
    expect(getter).not.toHaveBeenCalled();
    const withOptional = message([
      { type: 'text', text: 'hello', state: undefined },
    ]);
    expect((await messages.validate([withOptional]))[0].parts).toEqual([
      { type: 'text', text: 'hello' },
    ]);
    await expect(
      messages.validate([
        message([
          {
            type: 'tool-business',
            toolCallId: 'invalid',
            state: 'input-available',
            input: { nested: undefined },
          },
        ]),
      ]),
    ).rejects.toThrow();
  });

  it('projects current registered public tools, never provider annotations or approval internals', async () => {
    const { messages, configurator } = fixture();
    configurator.registerTool('private', {
      version: '1',
      definition: { inputSchema: z.unknown(), execute: async () => 'private' },
    });
    const original = message([
      {
        type: 'text',
        text: 'hello',
        providerMetadata: { provider: { secret: 'private' } },
      },
      { type: 'reasoning', text: 'private' },
      result(),
      result('private'),
      result('missing'),
      {
        type: 'tool-business',
        toolCallId: 'approval',
        state: 'approval-responded',
        input: { value: 'input' },
        approval: {
          id: 'approval',
          approved: true,
          reason: 'user reason',
          signature: 'private',
          descriptor: 'private',
          inputSchemaInput: 'private',
          requestReason: 'private',
          isAutomatic: true,
        },
      },
    ]);
    const before = structuredClone(original);
    const visible = await messages.public([original]);
    expect(visible[0].parts).toEqual([
      { type: 'text', text: 'hello' },
      {
        type: 'tool-business',
        toolCallId: 'business',
        state: 'output-available',
        input: { value: 'input' },
        output: { display: 'visible' },
      },
      {
        type: 'tool-business',
        toolCallId: 'approval',
        state: 'approval-responded',
        input: { value: 'input' },
        approval: { id: 'approval', approved: true, reason: 'user reason' },
      },
    ]);
    expect(original).toEqual(before);
    expect((await messages.public([original], []))[0].parts).toEqual([
      { type: 'text', text: 'hello' },
    ]);
    const replacement = new OnlineAgentConfigurator();
    replacement.registerTool('business', {
      version: '2',
      definition: {
        inputSchema: z.object({ value: z.string() }),
        execute: async () => 'ignored',
        public: { input: () => 'new input', output: () => 'new output' },
      },
    });
    const reread = await new NativeMessages(replacement).public([original]);
    expect(reread[0].parts.find(isToolUIPart)).toMatchObject({
      input: 'new input',
      output: 'new output',
    });
  });

  it('does not invoke typed formatters for invalid input, including failed SDK calls', async () => {
    const { messages, input, output } = fixture();
    const original = message([
      {
        type: 'tool-business',
        toolCallId: 'invalid',
        state: 'output-error',
        input: { value: 42 },
        toolMetadata: { nativeInputInvalid: true },
        errorText: 'SDK rejected the input',
      },
      {
        type: 'tool-business',
        toolCallId: 'failed',
        state: 'output-error',
        input: { value: 42 },
        toolMetadata: { nativeInputInvalid: true },
        errorText: 'private',
      },
      {
        type: 'tool-business',
        toolCallId: 'streaming',
        state: 'input-streaming',
        input: { value: 'partial' },
      },
    ]);
    expect((await messages.public([original]))[0].parts).toEqual([]);
    expect(input).not.toHaveBeenCalled();
    expect(output).not.toHaveBeenCalled();
  });

  it.each([
    z.number().transform((value) => value * 100),
    z.string().transform((value) => Number(value) * 100),
  ])(
    'projects SDK-parsed approval inputs without running schema transforms again',
    async (amount) => {
      const configurator = new OnlineAgentConfigurator();
      const input = vi.fn((value: { amount: number }) => value);
      configurator.registerTool('business', {
        version: '1',
        definition: {
          inputSchema: z.object({ amount }),
          execute: () => 'ok',
          public: { input, output: (value) => value },
        },
      });
      const messages = new NativeMessages(configurator);
      const original = message([
        {
          type: 'tool-business',
          toolCallId: 'call',
          state: 'approval-requested',
          input: { amount: 200 },
          approval: { id: 'approval' },
        },
      ]);
      expect((await messages.public([original]))[0].parts[0]).toMatchObject({
        input: { amount: 200 },
        approval: { id: 'approval' },
      });
      const adapter = messages.stream(['business']);
      expect(
        await adapter.project({
          type: 'tool-input-available',
          toolCallId: 'call',
          toolName: 'business',
          input: { amount: 200 },
        }),
      ).toMatchObject({ input: { amount: 200 } });
      expect(
        await adapter.project({
          type: 'tool-approval-request',
          toolCallId: 'call',
          approvalId: 'approval',
        }),
      ).toMatchObject({ approvalId: 'approval' });
      expect(original.parts[0]).toMatchObject({ input: { amount: 200 } });
    },
  );
  it('fails closed for throwing factories, throwing formatters and non-JSON projections', async () => {
    const { messages, configurator, output } = fixture();
    configurator.registerTool('factory', {
      version: '1',
      definition: () => {
        throw new Error('private');
      },
    });
    output.mockImplementationOnce(() => {
      throw new Error('private');
    });
    expect(
      (await messages.public([message([result(), result('factory')])]))[0]
        .parts,
    ).toEqual([]);
    output.mockImplementationOnce(
      () => ({ display: undefined }) as unknown as { display: string },
    );
    expect((await messages.public([message([result()])]))[0].parts).toEqual([]);
  });

  it('clones public callback arguments and returned projection values', async () => {
    const configurator = new OnlineAgentConfigurator();
    const projected = { nested: { value: 'public' } };
    configurator.registerTool('business', {
      version: '1',
      definition: {
        inputSchema: z.object({ value: z.string() }).transform((value) => {
          value.value = 'schema';
          return value;
        }),
        execute: async () => ({ value: 'raw' }),
        public: {
          input: (value) => {
            value.value = 'formatter';
            return projected;
          },
          output: (value) => {
            value.value = 'formatter';
            return projected;
          },
        },
      },
    });
    const original = message([result('business', { value: 'raw' })]);
    const before = structuredClone(original);
    const visible = await new NativeMessages(configurator).public([original]);
    projected.nested.value = 'changed later';
    expect(visible[0].parts[0]).toMatchObject({
      input: { nested: { value: 'public' } },
      output: { nested: { value: 'public' } },
    });
    expect(original).toEqual(before);
  });

  it('sanitizes failed tool text while keeping private errors in the original', async () => {
    const { messages } = fixture();
    const original = message([
      {
        type: 'tool-business',
        toolCallId: 'error',
        state: 'output-error',
        input: { value: 'valid' },
        errorText: 'provider secret',
      },
    ]);
    expect((await messages.public([original]))[0].parts[0]).toMatchObject({
      errorText: 'The tool could not complete.',
    });
    expect(original.parts[0]).toMatchObject({ errorText: 'provider secret' });
  });
});

describe('NativeMessages stream projection', () => {
  it('reuses projection rules and does not mutate chunks', async () => {
    const { messages } = fixture();
    const adapter = messages.stream(['business']);
    const chunks: UIMessageChunk[] = [
      {
        type: 'tool-input-start',
        toolCallId: 'business',
        toolName: 'business',
      },
      {
        type: 'tool-input-delta',
        toolCallId: 'business',
        inputTextDelta: 'private',
      },
      {
        type: 'tool-input-available',
        toolCallId: 'business',
        toolName: 'business',
        input: { value: 'input', secret: 'private' },
        providerMetadata: { provider: { secret: 'private' } },
        toolMetadata: { secret: 'private' },
      },
      {
        type: 'tool-approval-request',
        toolCallId: 'business',
        approvalId: 'approval',
        reason: 'private',
        approvalDescriptor: 'private',
        inputSchemaInput: 'private',
        signature: 'private',
        isAutomatic: true,
      },
      {
        type: 'tool-approval-response',
        approvalId: 'approval',
        approved: true,
        reason: 'user reason',
      },
      {
        type: 'tool-output-available',
        toolCallId: 'business',
        output: { display: 'visible', secret: 'private' },
        providerMetadata: { provider: { secret: 'private' } },
      },
      { type: 'reasoning-delta', id: 'reason', delta: 'private' },
      {
        type: 'text-delta',
        id: 'text',
        delta: 'hello',
        providerMetadata: { provider: { secret: 'private' } },
      },
    ];
    const before = structuredClone(chunks);
    const projected = [];
    for (const chunk of chunks) projected.push(await adapter.project(chunk));
    expect(projected).toEqual([
      undefined,
      undefined,
      {
        type: 'tool-input-available',
        toolCallId: 'business',
        toolName: 'business',
        input: { value: 'input' },
      },
      {
        type: 'tool-approval-request',
        toolCallId: 'business',
        approvalId: 'approval',
      },
      {
        type: 'tool-approval-response',
        approvalId: 'approval',
        approved: true,
        reason: 'user reason',
      },
      {
        type: 'tool-output-available',
        toolCallId: 'business',
        output: { display: 'visible' },
      },
      undefined,
      { type: 'text-delta', id: 'text', delta: 'hello' },
    ]);
    expect(chunks).toEqual(before);
  });

  it('seeds approval continuations from the raw original without exposing internals', async () => {
    const { messages } = fixture();
    const original = message([
      {
        type: 'tool-business',
        toolCallId: 'business',
        state: 'approval-responded',
        input: { value: 'input' },
        approval: { id: 'approval', approved: true, signature: 'private' },
      },
    ]);
    const adapter = messages.stream(['business'], original);
    expect(
      await adapter.project({
        type: 'tool-approval-response',
        approvalId: 'approval',
        approved: true,
        reason: 'user reason',
      }),
    ).toEqual({
      type: 'tool-approval-response',
      approvalId: 'approval',
      approved: true,
      reason: 'user reason',
    });
    expect(
      await adapter.project({
        type: 'tool-output-available',
        toolCallId: 'business',
        output: { display: 'visible', secret: 'private' },
      }),
    ).toMatchObject({ output: { display: 'visible' } });
    expect(
      await messages.stream([], original).project({
        type: 'tool-approval-response',
        approvalId: 'approval',
        approved: true,
      }),
    ).toBeUndefined();
  });

  it('permanently suppresses invalid inputs and projection errors without typed formatter invocation', async () => {
    const { messages, input, output } = fixture();
    const adapter = messages.stream(['business']);
    expect(
      await adapter.project({
        type: 'tool-input-error',
        toolCallId: 'invalid',
        toolName: 'business',
        input: { value: 42 },
        errorText: 'SDK rejected the input',
      }),
    ).toBeUndefined();
    expect(
      await adapter.project({
        type: 'tool-output-available',
        toolCallId: 'invalid',
        output: 'private',
      }),
    ).toBeUndefined();
    expect(
      await adapter.project({
        type: 'tool-input-error',
        toolCallId: 'sdk-invalid',
        toolName: 'business',
        input: {},
        errorText: 'private',
      }),
    ).toBeUndefined();
    expect(
      await adapter.project({
        type: 'tool-output-error',
        toolCallId: 'sdk-invalid',
        errorText: 'private',
      }),
    ).toBeUndefined();
    expect(input).not.toHaveBeenCalled();
    expect(output).not.toHaveBeenCalled();
    await adapter.project({
      type: 'tool-input-available',
      toolCallId: 'valid',
      toolName: 'business',
      input: { value: 'input' },
    });
    output.mockImplementationOnce(() => {
      throw new Error('private');
    });
    expect(
      await adapter.project({
        type: 'tool-output-available',
        toolCallId: 'valid',
        output: { display: 'visible', secret: 'private' },
      }),
    ).toBeUndefined();
    expect(
      await adapter.project({
        type: 'tool-output-error',
        toolCallId: 'valid',
        errorText: 'private',
      }),
    ).toBeUndefined();
    expect(
      await adapter.project({ type: 'error', errorText: 'provider private' }),
    ).toEqual({ type: 'error', errorText: 'The response could not complete.' });
  });
});

describe('NativeMessages model conversion', () => {
  it('converts raw outputs with current custom toModelOutput through the application resolver', async () => {
    const resolver = new ServiceContainer();
    const configurator = new OnlineAgentConfigurator();
    const returned = { type: 'text' as const, value: 'model output' };
    const convert = vi.fn(
      ({
        input,
        output,
      }: {
        input: { value: string };
        output: { secret: string };
      }) => {
        expect(output.secret).toBe('private');
        input.value = 'mutated';
        output.secret = 'mutated';
        return returned;
      },
    );
    const factory = vi.fn((services) => {
      expect(services).toBe(resolver);
      return {
        inputSchema: z.object({ value: z.string() }),
        execute: async () => ({ secret: 'private' }),
        toModelOutput: convert,
      };
    });
    configurator.registerTool('business', {
      version: '1',
      definition: factory,
    });
    const original = message([result()]);
    const before = structuredClone(original);
    const model = await new NativeMessages(configurator, resolver).model([
      original,
    ]);
    expect(toolOutputs(model)).toEqual([
      { type: 'text', value: 'model output' },
    ]);
    expect(convert).toHaveBeenCalledOnce();
    expect(factory).toHaveBeenCalledOnce();
    returned.value = 'mutated after conversion';
    expect(toolOutputs(model)).toEqual([
      { type: 'text', value: 'model output' },
    ]);
    expect(original).toEqual(before);
  });

  it('uses text for default strings and json for raw JSON objects, without canonical nesting', async () => {
    const configurator = new OnlineAgentConfigurator();
    for (const name of ['string', 'json'])
      configurator.registerTool(name, {
        version: '1',
        definition: { inputSchema: z.unknown(), execute: async () => null },
      });
    const model = await new NativeMessages(configurator).model([
      message([
        result('string', 'actual string'),
        result('json', { type: 'text', value: 'ordinary JSON' }),
      ]),
    ]);
    expect(toolOutputs(model)).toEqual([
      { type: 'text', value: 'actual string' },
      { type: 'json', value: { type: 'text', value: 'ordinary JSON' } },
    ]);
  });

  it('uses explicit safe failures for missing tools, unavailable factories and converter exceptions', async () => {
    const configurator = new OnlineAgentConfigurator();
    configurator.registerTool('throws', {
      version: '1',
      definition: {
        inputSchema: z.unknown(),
        execute: async () => null,
        toModelOutput: () => {
          throw new Error('private conversion error');
        },
      },
    });
    configurator.registerTool('factory', {
      version: '1',
      definition: () => {
        throw new Error('private factory error');
      },
    });
    const outputs = toolOutputs(
      await new NativeMessages(configurator).model([
        message([result('missing'), result('throws'), result('factory')]),
      ]),
    );
    expect(outputs).toHaveLength(3);
    expect(outputs.every((output) => output.type === 'error-text')).toBe(true);
    expect(JSON.stringify(outputs)).not.toContain('private');
  });

  it('validates custom converter output with the SDK and never falls back to raw results', async () => {
    const invalidOutputs: unknown[] = [
      { type: 'json', value: new Date() },
      { type: 'json', value: { nested: undefined } },
      { type: 'text', value: 42 },
      {
        type: 'content',
        value: [
          { type: 'file', data: { type: 'data', data: new Uint8Array([1]) } },
        ],
      },
      { type: 'unknown', value: 'private' },
      undefined,
    ];
    for (const invalid of invalidOutputs) {
      const configurator = new OnlineAgentConfigurator();
      configurator.registerTool('business', {
        version: '1',
        definition: {
          inputSchema: z.unknown(),
          execute: async () => 'raw private',
          toModelOutput: () => invalid as ToolResultPart['output'],
        },
      });
      expect(
        toolOutputs(
          await new NativeMessages(configurator).model([message([result()])]),
        ),
      ).toEqual([
        {
          type: 'error-text',
          value: 'The saved tool result could not be converted for the model.',
        },
      ]);
    }
  });

  it('supports detached binary and URL content in transient custom model output', async () => {
    const configurator = new OnlineAgentConfigurator();
    const bytes = new Uint8Array([1, 2, 3]);
    const url = new URL('https://example.com/model-only');
    configurator.registerTool('business', {
      version: '1',
      definition: {
        inputSchema: z.unknown(),
        execute: async () => 'raw',
        toModelOutput: () => ({
          type: 'content',
          value: [
            {
              type: 'file',
              mediaType: 'application/octet-stream',
              data: { type: 'data', data: bytes },
            },
            {
              type: 'file',
              mediaType: 'text/plain',
              data: { type: 'url', url },
            },
          ],
        }),
      },
    });
    const outputs = toolOutputs(
      await new NativeMessages(configurator).model([message([result()])]),
    );
    expect(outputs).toEqual([
      {
        type: 'content',
        value: [
          {
            type: 'file',
            mediaType: 'application/octet-stream',
            data: { type: 'data', data: new Uint8Array([1, 2, 3]) },
          },
          {
            type: 'file',
            mediaType: 'text/plain',
            data: {
              type: 'url',
              url: new URL('https://example.com/model-only'),
            },
          },
        ],
      },
    ]);
    bytes[0] = 99;
    url.pathname = '/changed';
    expect(outputs[0]).toMatchObject({
      type: 'content',
      value: [
        { data: { data: new Uint8Array([1, 2, 3]) } },
        { data: { url: new URL('https://example.com/model-only') } },
      ],
    });
  });

  it('excludes UI-only records and incomplete calls, retaining raw provider evidence for the model', async () => {
    const { messages } = fixture();
    const original = message([
      { type: 'step-start' },
      {
        type: 'tool-business',
        toolCallId: 'partial',
        state: 'input-streaming',
        input: {},
      },
      {
        type: 'tool-business',
        toolCallId: 'preliminary',
        state: 'output-available',
        input: { value: 'input' },
        output: 'partial',
        preliminary: true,
      },
      {
        type: 'tool-business',
        toolCallId: 'pending',
        state: 'approval-requested',
        input: { value: 'input' },
        approval: { id: 'pending' },
      },
      {
        type: 'text',
        text: 'model text',
        providerMetadata: { provider: { signature: 'private' } },
      },
      {
        type: 'data-business',
        data: { kind: 'card', id: 'card', payload: 'UI only' },
      },
    ]);
    const notice: NativeMessage = {
      id: 'notice',
      role: 'system',
      metadata,
      parts: [
        { type: 'data-notice', data: { type: 'notice', title: 'UI only' } },
      ],
    };
    const model = await messages.model([notice, original]);
    expect(model).toEqual([
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'model text',
            providerOptions: { provider: { signature: 'private' } },
          },
        ],
      },
    ]);
    expect(original.parts).toHaveLength(6);
  });
});
