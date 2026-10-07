/**
 * A model gateway whose language model answers from a script: each model call is one scripted step, which streams
 * `ModelEvent`s given the request as the old single-call gateway saw it (`ModelRequest`). The executor runs its real
 * agent loop (`ToolLoopAgent`) over it, so a step's tool calls are executed and their results come back in the next
 * request, as with a real model. For tests only (`testing.ts`).
 */
import type { LanguageModel } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';

import type { ModelRef } from '../../shared/models.js';
import type {
  ModelEvent,
  ModelGateway,
  ModelMessage,
  ModelRequest,
  ModelToolSpec,
} from './gateway.js';

type LanguageModelV4CallOptions = Parameters<
  MockLanguageModelV4['doStream']
>[0];
type LanguageModelV4Prompt = LanguageModelV4CallOptions['prompt'];
type LanguageModelV4StreamPart =
  Awaited<
    ReturnType<MockLanguageModelV4['doStream']>
  >['stream'] extends ReadableStream<infer P>
    ? P
    : never;

/** One scripted model call: what it streams, given the request. */
export type Step = (request: ModelRequest) => AsyncIterable<ModelEvent>;

/** The prompt as the old gateway's messages: the system prompt, user turns, assistant turns and tool results. */
function messagesOf(prompt: LanguageModelV4Prompt): ModelMessage[] {
  const messages: ModelMessage[] = [];
  for (const message of prompt)
    switch (message.role) {
      case 'system':
        messages.push({ role: 'system', content: message.content });
        break;
      case 'user':
        messages.push({
          role: 'user',
          content: message.content
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join(''),
        });
        break;
      case 'assistant': {
        const calls = message.content.flatMap((part) =>
          part.type === 'tool-call'
            ? [{ id: part.toolCallId, name: part.toolName, args: part.input }]
            : [],
        );
        messages.push({
          role: 'assistant',
          content: message.content
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join(''),
          ...(calls.length > 0 ? { toolCalls: calls } : {}),
        });
        break;
      }
      case 'tool':
        for (const part of message.content)
          if (part.type === 'tool-result')
            messages.push({
              role: 'tool',
              toolCallId: part.toolCallId,
              content:
                part.output.type === 'text'
                  ? part.output.value
                  : JSON.stringify(part.output),
            });
        break;
      default:
        break;
    }
  return messages;
}

/** The request the old gateway would have been handed for this call. */
function requestOf(
  ref: ModelRef,
  options: LanguageModelV4CallOptions,
): ModelRequest {
  const tools: ModelToolSpec[] = (options.tools ?? []).flatMap((entry) =>
    entry.type === 'function'
      ? [
          {
            name: entry.name,
            description: entry.description ?? '',
            inputSchema: entry.inputSchema as Record<string, unknown>,
          },
        ]
      : [],
  );
  return {
    model: {
      ...ref,
      reasoning:
        options.reasoning === undefined ||
        options.reasoning === 'provider-default'
          ? null
          : options.reasoning,
    },
    messages: messagesOf(options.prompt),
    tools,
    ...(options.abortSignal ? { signal: options.abortSignal } : {}),
  };
}

/** A step's events as the parts a provider streams. */
async function* partsOf(
  events: AsyncIterable<ModelEvent>,
): AsyncGenerator<LanguageModelV4StreamPart> {
  yield { type: 'stream-start', warnings: [] };
  let text = false;
  let reasoning = false;
  for await (const event of events)
    switch (event.type) {
      case 'text':
        if (!text) yield { type: 'text-start', id: 't' };
        text = true;
        yield { type: 'text-delta', id: 't', delta: event.delta };
        break;
      case 'reasoning':
        if (!reasoning) yield { type: 'reasoning-start', id: 'r' };
        reasoning = true;
        yield { type: 'reasoning-delta', id: 'r', delta: event.delta };
        break;
      case 'toolCall':
        yield {
          type: 'tool-call',
          toolCallId: event.call.id,
          toolName: event.call.name,
          input: JSON.stringify(event.call.args ?? {}),
        };
        break;
      case 'finish': {
        if (reasoning) yield { type: 'reasoning-end', id: 'r' };
        if (text) yield { type: 'text-end', id: 't' };
        yield { type: 'response-metadata', modelId: event.model };
        const { usage } = event;
        const cacheRead = usage.cacheReadTokens ?? 0;
        const cacheWrite = usage.cacheWriteTokens ?? 0;
        yield {
          type: 'finish',
          finishReason: {
            unified: event.reason === 'toolCalls' ? 'tool-calls' : 'stop',
            raw: event.reason,
          },
          usage: {
            inputTokens: {
              total: usage.inputTokens + cacheRead + cacheWrite,
              noCache: usage.inputTokens,
              cacheRead,
              cacheWrite,
            },
            outputTokens: {
              total: usage.outputTokens,
              text: usage.outputTokens - (usage.reasoningTokens ?? 0),
              reasoning: usage.reasoningTokens,
            },
          },
        };
        break;
      }
      default:
        break;
    }
}

function streamOf(
  parts: AsyncGenerator<LanguageModelV4StreamPart>,
): ReadableStream<LanguageModelV4StreamPart> {
  return new ReadableStream({
    async pull(controller) {
      try {
        const next = await parts.next();
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export interface ScriptedModels extends Pick<ModelGateway, 'languageModel'> {
  /** Every model call, as the old gateway would have been asked it. */
  readonly requests: ModelRequest[];
}

/** A gateway answering each model call with `next(request)`. */
export function scriptedModels(next: Step): ScriptedModels {
  const requests: ModelRequest[] = [];
  return {
    requests,
    languageModel(ref) {
      const model: LanguageModel = new MockLanguageModelV4({
        modelId: ref.model,
        doStream: (options) => {
          const request = requestOf(ref, options);
          requests.push(request);
          return Promise.resolve({ stream: streamOf(partsOf(next(request))) });
        },
      });
      return Promise.resolve(model);
    },
  };
}

/** A gateway answering `steps` in order, one per model call, the last one again after them. */
export function scriptedSteps(steps: readonly Step[]): ScriptedModels {
  let at = 0;
  return scriptedModels((request) => {
    const step = steps[Math.min(at, steps.length - 1)];
    at += 1;
    return step(request);
  });
}
