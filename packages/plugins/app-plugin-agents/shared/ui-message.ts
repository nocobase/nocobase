import { validateUIMessages, type UIMessage } from 'ai';
import { z } from 'zod';

/** JSON persisted without a tagged codec or lossy serialization. */
export type AppUIJson =
  null | boolean | number | string | AppUIJson[] | { [key: string]: AppUIJson };

/** Reject values that JSON.stringify would drop, coerce or execute. */
export function isAppUIJson(value: unknown): value is AppUIJson {
  const ancestors = new Set<object>();
  function visit(item: unknown): boolean {
    if (
      item === null ||
      typeof item === 'string' ||
      typeof item === 'boolean'
    ) {
      return true;
    }
    if (typeof item === 'number') return Number.isFinite(item);
    if (typeof item !== 'object' || ancestors.has(item)) return false;
    const array = Array.isArray(item);
    const prototype: unknown = Object.getPrototypeOf(item);
    if (!array && prototype !== Object.prototype && prototype !== null)
      return false;
    ancestors.add(item);
    const keys = Reflect.ownKeys(item);
    const valid =
      (!array || keys.length === item.length + 1) &&
      keys.every((key) => {
        if (array && key === 'length') return true;
        if (typeof key !== 'string') return false;
        if (
          array &&
          (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= item.length)
        )
          return false;
        const descriptor = Object.getOwnPropertyDescriptor(item, key);
        return (
          descriptor !== undefined &&
          descriptor.enumerable === true &&
          'value' in descriptor &&
          visit(descriptor.value)
        );
      });
    ancestors.delete(item);
    return valid;
  }
  return visit(value);
}

export const appUIJsonSchema: z.ZodType<AppUIJson> = z.custom<AppUIJson>(
  isAppUIJson,
  'Expected lossless JSON data',
);

const identity = z.string().min(1);

/** Public identity and ordering only; configuration and credentials are private. */
export interface AppUIMessageMetadata {
  conversationId: string;
  createdAt: string;
  agentId?: string;
  turnId?: string;
  /** Accepted browser input correlation; never a database primary key. */
  clientId?: string;
  executionId?: string;
  /** Absent before the first save. Never used as an update cursor. */
  seq?: number;
  /** Zero before saving; increases when the same message is updated. */
  revision: number;
  sourceRecords?: {
    recordId: string;
    seq: number;
    partId: string;
    /** Index in ordered parts; SDK text parts do not retain their stream ID. */
    partIndex: number;
  }[];
}

export const appUIMessageMetadataSchema: z.ZodType<AppUIMessageMetadata> =
  z.strictObject({
    conversationId: identity,
    createdAt: z.iso.datetime({ offset: true }),
    agentId: identity.optional(),
    turnId: identity.optional(),
    clientId: identity.optional(),
    executionId: identity.optional(),
    /** Absent before the first save. Never used as an update cursor. */
    seq: z.number().int().positive().optional(),
    /** Zero before saving; increases when the same message is updated. */
    revision: z.number().int().nonnegative(),
    /** Runner aggregation keeps distinct database records and stable part identities. */
    sourceRecords: z
      .array(
        z.strictObject({
          recordId: identity,
          seq: z.number().int().positive(),
          partId: identity,
          partIndex: z.number().int().nonnegative(),
        }),
      )
      .optional(),
  });

export type AppUIData = {
  notice: { type: string; title: string; params?: Record<string, string> };
  business: { kind: string; id: string; payload: AppUIJson };
};

/** Display data does not enter model context unless the server explicitly converts it. */
export const appUIDataSchemas: {
  [KEY in keyof AppUIData]: z.ZodType<AppUIData[KEY]>;
} = {
  notice: z.strictObject({
    type: identity,
    title: z.string(),
    params: z.record(z.string(), z.string()).optional(),
  }),
  /** Application cards use an authorized business reference and public JSON payload. */
  business: z.strictObject({
    kind: identity,
    id: identity,
    payload: appUIJsonSchema,
  }),
};

/** Only deliberately public tool inputs and outputs belong in a UI message. */
export type AppUITools = Record<
  string,
  { input: AppUIJson; output: AppUIJson }
>;

/** The SDK message itself, without an application message envelope or codec. */
export type AppUIMessage = UIMessage<
  AppUIMessageMetadata,
  AppUIData,
  AppUITools
>;

/**
 * Validate trusted server history/public output before persistence or SDK conversion.
 * This is structural validation, not authorization or a browser-history write API.
 */
export async function validateAppUIMessages(
  messages: unknown,
): Promise<AppUIMessage[]> {
  appUIJsonSchema.parse(messages);
  const validated = await validateUIMessages<AppUIMessage>({
    messages,
    metadataSchema: appUIMessageMetadataSchema,
    dataSchemas: appUIDataSchemas,
  });
  const ids = new Set<string>();
  for (const message of validated) {
    identity.parse(message.id);
    if (ids.has(message.id)) throw new Error('Duplicate UI message ID');
    ids.add(message.id);
    appUIMessageMetadataSchema.parse(message.metadata);
    for (const part of message.parts) {
      // Provider annotations can contain private execution data. Projection owns removal.
      if (
        Object.keys(part).some(
          (key) => key.endsWith('Metadata') || key === 'providerReference',
        )
      ) {
        throw new Error(
          'Private provider or tool metadata is not public UI data',
        );
      }
    }
  }
  return validated;
}

/** Text projection for search and extensions; the ordered parts remain authoritative. */
export function appUIMessageText(message: AppUIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

/** A control response to a real pending SDK approval, never client-supplied tool output. */
export type AppUIToolApprovalInput = {
  messageId: string;
  executionId: string;
  approval: { id: string; approved: boolean; reason?: string };
};
export const appUIToolApprovalInputSchema: z.ZodType<AppUIToolApprovalInput> =
  z.strictObject({
    messageId: z.string().min(1).max(64),
    executionId: z.string().min(1).max(64),
    approval: z.strictObject({
      id: z.string().min(1).max(200),
      approved: z.boolean(),
      reason: z.string().max(1000).optional(),
    }),
  });
