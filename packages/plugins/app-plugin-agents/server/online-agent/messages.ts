import {
  convertToModelMessages,
  isToolUIPart,
  jsonSchema,
  toolModelMessageSchema,
  validateUIMessages,
  type ModelMessage,
  type ToolSet,
  type ToolResultPart,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import type { ServiceResolver } from '@nocobase/service-provider';
import {
  appUIDataSchemas,
  appUIMessageMetadataSchema,
  validateAppUIMessages,
  type AppUIMessage,
  type AppUIMessageMetadata,
} from '../../shared/online-agent.js';
import type { OnlineAgentConfigurator } from './config.js';
import { jsonSafe } from './codec.js';
import { strictJson } from './strict-json.js';
import type { NativeUIChunk } from './native.js';

/** The one persisted SDK message: raw tool results and provider/approval evidence stay here. */
export type NativeMessage = UIMessage<AppUIMessageMetadata>;
type ToolPart = Extract<UIMessage['parts'][number], { toolCallId: string }>;
type PublicPart = AppUIMessage['parts'][number];
const toolError = 'The tool could not complete.';
const conversionError =
  'The saved tool result could not be converted for the model.';

function pick(value: object, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(
    keys.flatMap((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor &&
        'value' in descriptor &&
        descriptor.value !== undefined
        ? [[key, structuredClone(descriptor.value)]]
        : [];
    }),
  );
}

function toolName(part: ToolPart): string {
  return part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5);
}

/** Detach transient SDK outputs too: model file output can contain URLs and binary data. */
function cloneModelValue(
  value: unknown,
  ancestors = new Set<object>(),
): unknown {
  if (value === null || typeof value !== 'object')
    return structuredClone(value);
  if (value instanceof URL) return new URL(value.href);
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value))
    return structuredClone(value);
  if (ancestors.has(value)) throw new Error('Cyclic model output.');
  const prototype: unknown = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  )
    throw new Error('Unsupported model output value.');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const length = Object.getOwnPropertyDescriptor(value, 'length')!
        .value as number;
      if (Reflect.ownKeys(value).length !== length + 1)
        throw new Error('Invalid model output array.');
      return Array.from({ length }, (_, index) => {
        const descriptor = Object.getOwnPropertyDescriptor(
          value,
          String(index),
        );
        if (!descriptor?.enumerable || !('value' in descriptor))
          throw new Error('Invalid model output array item.');
        return cloneModelValue(descriptor.value, ancestors);
      });
    }
    return Object.fromEntries(
      Reflect.ownKeys(value).map((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
        if (
          typeof key !== 'string' ||
          !descriptor.enumerable ||
          !('value' in descriptor)
        )
          throw new Error('Invalid model output property.');
        return [key, cloneModelValue(descriptor.value, ancestors)];
      }),
    );
  } finally {
    ancestors.delete(value);
  }
}

/** Central conversions from immutable, private SDK originals, never a second saved projection. */
export class NativeMessages {
  constructor(
    private configurator: OnlineAgentConfigurator,
    private resolver: ServiceResolver | undefined = undefined,
  ) {}

  async validate(messages: unknown[]): Promise<NativeMessage[]> {
    if (!messages.length) return [];
    // SDK optional properties may be undefined, but actual tool values must remain lossless.
    for (const message of messages) {
      if (!message || typeof message !== 'object') continue;
      const parts = Object.getOwnPropertyDescriptor(message, 'parts');
      if (!parts || !('value' in parts) || !Array.isArray(parts.value))
        continue;
      for (const part of parts.value as unknown[]) {
        if (!part || typeof part !== 'object') continue;
        const type = Object.getOwnPropertyDescriptor(part, 'type')
          ?.value as unknown;
        const state = Object.getOwnPropertyDescriptor(part, 'state')
          ?.value as unknown;
        if (
          typeof type !== 'string' ||
          !(type === 'dynamic-tool' || type.startsWith('tool-'))
        )
          continue;
        const value = (key: string): unknown => {
          const descriptor = Object.getOwnPropertyDescriptor(part, key);
          if (descriptor && !('value' in descriptor))
            throw new Error('Tool values must not contain accessors.');
          return descriptor?.value;
        };
        if (state === 'output-available') strictJson(value('output'));
        if (state !== 'input-streaming' && state !== 'output-error')
          strictJson(value('input'));
        else if (state === 'output-error' && value('input') !== undefined)
          strictJson(value('input'));
      }
    }
    // Finalize SDK construction's optional properties only after checking raw tool values.
    const values = jsonSafe(structuredClone(messages));
    const result = await validateUIMessages<NativeMessage>({
      messages: values,
      metadataSchema: appUIMessageMetadataSchema,
    });
    const ids = new Set<string>();
    for (const message of result) {
      if (!message.id || ids.has(message.id))
        throw new Error('Invalid or duplicate UI message ID.');
      ids.add(message.id);
    }
    return structuredClone(result);
  }

  async public(
    messages: UIMessage[],
    allowedTools?: string[],
  ): Promise<AppUIMessage[]> {
    if (!messages.length) return [];
    const result: AppUIMessage[] = [];
    for (const message of structuredClone(messages)) {
      const parts: PublicPart[] = [];
      for (const part of message.parts) {
        const projected = isToolUIPart(part)
          ? await this.publicTool(part, allowedTools)
          : this.publicPart(part);
        if (projected) parts.push(projected);
      }
      const metadata = appUIMessageMetadataSchema.parse(
        pick(message.metadata ?? {}, [
          'conversationId',
          'createdAt',
          'agentId',
          'turnId',
          'clientId',
          'executionId',
          'seq',
          'revision',
          'context',
          'sourceRecords',
        ]),
      );
      result.push({ id: message.id, role: message.role, metadata, parts });
    }
    return validateAppUIMessages(result);
  }

  private publicPart(part: UIMessage['parts'][number]): PublicPart | undefined {
    let clean: Record<string, unknown>;
    switch (part.type) {
      case 'text':
        clean = pick(part, ['type', 'text', 'state']);
        break;
      case 'file':
        clean = pick(part, ['type', 'url', 'mediaType', 'filename']);
        break;
      case 'source-url':
        clean = pick(part, ['type', 'sourceId', 'url', 'title']);
        break;
      case 'source-document':
        clean = pick(part, [
          'type',
          'sourceId',
          'mediaType',
          'title',
          'filename',
        ]);
        break;
      case 'step-start':
        clean = { type: 'step-start' };
        break;
      default:
        if (part.type === 'data-notice' || part.type === 'data-business') {
          const schema =
            appUIDataSchemas[
              part.type === 'data-notice' ? 'notice' : 'business'
            ];
          const parsed = schema.safeParse(structuredClone(part.data));
          if (!parsed.success) return undefined;
          clean = { ...pick(part, ['type', 'id']), data: parsed.data };
        } else return undefined;
    }
    return strictJson(clean) as unknown as PublicPart;
  }

  private async publicTool(
    part: ToolPart,
    allowedTools?: string[],
  ): Promise<PublicPart | undefined> {
    if (part.state === 'input-streaming') return undefined;
    const name = toolName(part);
    if (allowedTools && !allowedTools.includes(name)) return undefined;
    try {
      const definition = this.configurator.toolDefinition(name, this.resolver);
      if (!definition?.public) return undefined;
      // SDK tool inputs have already passed inputSchema, including its transforms.
      // Persisted SDK tool metadata distinguishes invalid model inputs without rerunning transforms.
      if (part.toolMetadata?.nativeInputInvalid === true) return undefined;
      const clean: Record<string, unknown> = {
        type: part.type,
        ...(part.type === 'dynamic-tool' ? { toolName: name } : {}),
        toolCallId: part.toolCallId,
        state: part.state,
        input: strictJson(definition.public.input(structuredClone(part.input))),
      };
      if (part.state === 'output-available') {
        clean.output = strictJson(
          definition.public.output(strictJson(part.output)),
        );
        if (part.preliminary !== undefined)
          clean.preliminary = part.preliminary;
      }
      if (part.state === 'output-error') clean.errorText = toolError;
      if (part.approval)
        clean.approval = pick(part.approval, ['id', 'approved', 'reason']);
      return strictJson(clean) as unknown as PublicPart;
    } catch {
      // A missing factory, invalid schema or formatter must never fall back to raw evidence.
      return undefined;
    }
  }

  stream(
    allowedTools: string[],
    original?: UIMessage,
  ): { project(chunk: UIMessageChunk): Promise<NativeUIChunk | undefined> } {
    const calls = new Map<string, ToolPart>();
    const approvals = new Map<string, string>();
    const hidden = new Set<string>();
    for (const part of structuredClone(original?.parts ?? [])) {
      if (!isToolUIPart(part)) continue;
      calls.set(part.toolCallId, part);
      if (part.approval) approvals.set(part.approval.id, part.toolCallId);
    }
    return {
      project: async (raw) => {
        const chunk = structuredClone(raw);
        if (
          chunk.type === 'tool-input-start' ||
          chunk.type === 'tool-input-delta'
        )
          return undefined;
        if (chunk.type === 'tool-input-error') {
          hidden.add(chunk.toolCallId);
          return undefined;
        }
        if (chunk.type === 'tool-input-available') {
          const part: ToolPart = {
            type: 'dynamic-tool',
            toolName: chunk.toolName,
            toolCallId: chunk.toolCallId,
            state: 'input-available',
            input: chunk.input,
          };
          calls.set(chunk.toolCallId, part);
          if (hidden.has(chunk.toolCallId)) return undefined;
          const projected = await this.publicTool(part, allowedTools);
          if (!projected || !isToolUIPart(projected)) {
            hidden.add(chunk.toolCallId);
            return undefined;
          }
          return {
            type: chunk.type,
            toolCallId: chunk.toolCallId,
            toolName: chunk.toolName,
            input: projected.input,
            ...(chunk.dynamic !== undefined ? { dynamic: chunk.dynamic } : {}),
          };
        }
        if (chunk.type === 'tool-approval-response') {
          const id = approvals.get(chunk.approvalId);
          const part = id ? calls.get(id) : undefined;
          if (
            !part ||
            hidden.has(part.toolCallId) ||
            !(await this.publicTool(part, allowedTools))
          )
            return undefined;
          return {
            type: chunk.type,
            approvalId: chunk.approvalId,
            approved: chunk.approved,
            ...(chunk.reason !== undefined ? { reason: chunk.reason } : {}),
          };
        }
        if ('toolCallId' in chunk) {
          if (hidden.has(chunk.toolCallId)) return undefined;
          const part = calls.get(chunk.toolCallId);
          if (!part) return undefined;
          const candidate =
            chunk.type === 'tool-output-available'
              ? { ...part, state: 'output-available', output: chunk.output }
              : part;
          const projected = await this.publicTool(
            candidate as ToolPart,
            allowedTools,
          );
          if (!projected || !isToolUIPart(projected)) {
            hidden.add(chunk.toolCallId);
            return undefined;
          }
          switch (chunk.type) {
            case 'tool-output-available':
              return {
                type: chunk.type,
                toolCallId: chunk.toolCallId,
                output:
                  projected.state === 'output-available'
                    ? projected.output
                    : null,
                ...(chunk.preliminary !== undefined
                  ? { preliminary: chunk.preliminary }
                  : {}),
              };
            case 'tool-output-error':
              return {
                type: chunk.type,
                toolCallId: chunk.toolCallId,
                errorText: toolError,
              };
            case 'tool-output-denied':
              return { type: chunk.type, toolCallId: chunk.toolCallId };
            case 'tool-approval-request':
              approvals.set(chunk.approvalId, chunk.toolCallId);
              return {
                type: chunk.type,
                toolCallId: chunk.toolCallId,
                approvalId: chunk.approvalId,
              };
            default:
              return undefined;
          }
        }
        switch (chunk.type) {
          case 'text-start':
          case 'text-end':
            return { type: chunk.type, id: chunk.id };
          case 'text-delta':
            return { type: chunk.type, id: chunk.id, delta: chunk.delta };
          case 'source-url':
          case 'source-document':
          case 'file':
            return this.publicPart(chunk) as NativeUIChunk | undefined;
          case 'start-step':
          case 'finish-step':
          case 'reset-step':
            return { type: chunk.type };
          case 'abort':
            return { type: 'abort' };
          case 'error':
            return {
              type: 'error',
              errorText: 'The response could not complete.',
            };
          case 'start':
          case 'finish':
          case 'message-metadata': {
            const metadata =
              'messageMetadata' in chunk && chunk.messageMetadata !== undefined
                ? appUIMessageMetadataSchema.safeParse(chunk.messageMetadata)
                : undefined;
            if (metadata && !metadata.success) return undefined;
            return {
              ...pick(chunk, ['type', 'messageId', 'finishReason']),
              ...(metadata?.success
                ? { messageMetadata: structuredClone(metadata.data) }
                : {}),
            } as NativeUIChunk;
          }
          default:
            if (
              chunk.type === 'data-notice' ||
              chunk.type === 'data-business'
            ) {
              const part = this.publicPart(chunk);
              return part
                ? ({
                    ...part,
                    ...('transient' in chunk && chunk.transient !== undefined
                      ? { transient: chunk.transient }
                      : {}),
                  } as NativeUIChunk)
                : undefined;
            }
            return undefined;
        }
      },
    };
  }

  async model(messages: UIMessage[]): Promise<ModelMessage[]> {
    const originals = structuredClone(messages);
    const tools: ToolSet = Object.create(null) as ToolSet;
    for (const message of originals) {
      // Notifications and cards are UI-only, including system-only notification records.
      message.parts = message.parts.filter(
        (part) => !part.type.startsWith('data-'),
      );
      for (const part of message.parts) {
        if (!isToolUIPart(part)) continue;
        const name = toolName(part);
        if (Object.hasOwn(tools, name)) continue;
        tools[name] = {
          inputSchema: jsonSchema({}),
          toModelOutput: async ({
            toolCallId,
            input,
            output,
          }: {
            toolCallId: string;
            input: unknown;
            output: unknown;
          }): Promise<ToolResultPart['output']> => {
            try {
              const definition = this.configurator.toolDefinition(
                name,
                this.resolver,
              );
              if (!definition) throw new Error('Unavailable tool.');
              if (definition.toModelOutput) {
                const converted = await definition.toModelOutput({
                  toolCallId,
                  input: structuredClone(input),
                  output: strictJson(output),
                });
                const detached = cloneModelValue(converted);
                // The SDK schema validates rich content without coercing JSON or file data.
                const validated = toolModelMessageSchema.parse({
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolCallId,
                      toolName: name,
                      output: detached,
                    },
                  ],
                }).content[0];
                if (validated.type !== 'tool-result')
                  throw new Error('Invalid model output.');
                if (
                  validated.output.type === 'json' ||
                  validated.output.type === 'error-json'
                )
                  strictJson(validated.output.value);
                return validated.output;
              }
              return typeof output === 'string'
                ? { type: 'text', value: output }
                : { type: 'json', value: strictJson(output) };
            } catch {
              return { type: 'error-text', value: conversionError };
            }
          },
        };
      }
    }
    return convertToModelMessages(
      originals.filter((message) =>
        message.parts.some((part) => part.type !== 'step-start'),
      ),
      { tools, ignoreIncompleteToolCalls: true },
    );
  }
}
