import {
  type ModelMessage,
  type UIMessage,
  jsonSchema,
  type JSONSchema7,
  type Schema,
} from 'ai';
import { invalid } from '../../../kernel/errors.js';
import { jsonSafe } from './json.js';
import { Ajv, type CodeOptions } from 'ajv';
import addFormats from 'ajv-formats';
import { RE2JS } from 're2js';
import type { OnlineAgentJson } from '../types.js';

/** Normalize trusted background user input to the SDK's JSON-persistable UI parts. */
export function nativeInputParts(message: ModelMessage): UIMessage['parts'] {
  if (message.role !== 'user')
    throw invalid('Input must contain user messages.');
  if (typeof message.content === 'string')
    return [{ type: 'text', text: message.content }];
  return message.content.map((part): UIMessage['parts'][number] => {
    const providerMetadata = part.providerOptions
      ? (jsonSafe(part.providerOptions) as NonNullable<
          typeof part.providerOptions
        >)
      : undefined;
    if (part.type === 'text')
      return {
        type: 'text',
        text: part.text,
        ...(providerMetadata ? { providerMetadata } : {}),
      };
    let data = part.type === 'image' ? part.image : part.data;
    const mediaType = part.mediaType ?? 'image';
    let url: string;
    let providerReference: Extract<
      UIMessage['parts'][number],
      { type: 'file' }
    >['providerReference'];
    const stringDataUrl = (value: string): string =>
      URL.canParse(value) ? value : `data:${mediaType};base64,${value}`;
    if (data instanceof URL) {
      url = data.href;
    } else if (
      typeof data === 'object' &&
      data !== null &&
      !(data instanceof Uint8Array) &&
      !(data instanceof ArrayBuffer)
    ) {
      if ('type' in data && data.type === 'url') url = data.url.href;
      else if ('type' in data && data.type === 'text')
        url = `data:${mediaType};base64,${Buffer.from(data.text).toString('base64')}`;
      else if ('type' in data && data.type === 'data') {
        data = data.data;
        if (typeof data === 'string' && data.startsWith('data:'))
          throw invalid(
            'Data URLs must use a URL input, not tagged inline data.',
          );
        url =
          typeof data === 'string'
            ? `data:${mediaType};base64,${data}`
            : stringDataUrl(
                Buffer.from(
                  data instanceof ArrayBuffer ? new Uint8Array(data) : data,
                ).toString('base64'),
              );
      } else {
        providerReference =
          'type' in data && data.type === 'reference' ? data.reference : data;
        url = '';
      }
    } else {
      url =
        typeof data === 'string'
          ? stringDataUrl(data)
          : stringDataUrl(
              Buffer.from(
                data instanceof ArrayBuffer ? new Uint8Array(data) : data,
              ).toString('base64'),
            );
    }
    return {
      type: 'file',
      mediaType,
      url,
      ...(part.type === 'file' && part.filename
        ? { filename: part.filename }
        : {}),
      ...(providerReference ? { providerReference } : {}),
      ...(providerMetadata ? { providerMetadata } : {}),
    };
  });
}
function invalidSchema(message: string): ReturnType<typeof invalid> {
  return invalid(message, { field: 'schema' });
}

const draft = 'http://json-schema.org/draft-07/schema#';
const linearRegExp: NonNullable<CodeOptions['regExp']> = Object.assign(
  (pattern: string, flags: string) =>
    RE2JS.compile(RE2JS.translateRegExp(new RegExp(pattern, flags))),
  { code: 'linearRegExp' },
);

/** Compile one call's JSON Schema without retaining user schemas in a shared cache. */
export function createOutputSchema(
  schema: JSONSchema7,
): Schema<OnlineAgentJson> {
  let nodes = 0;
  const checkSize = (value: unknown, depth: number): void => {
    if (++nodes > 4096 || depth > 32)
      throw invalidSchema('The output JSON Schema is too complex.');
    if (value !== null && typeof value === 'object')
      for (const child of Object.values(value)) checkSize(child, depth + 1);
  };
  checkSize(schema, 0);
  const snapshot = jsonSafe(schema) as JSONSchema7;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot))
    throw invalidSchema('An output JSON Schema object is required.');
  if (Buffer.byteLength(JSON.stringify(snapshot)) > 65536)
    throw invalidSchema('The output JSON Schema exceeds 64 KiB.');
  if (snapshot.$schema !== undefined && snapshot.$schema !== draft)
    throw invalidSchema('The output JSON Schema must use Draft-07.');
  if ('$async' in snapshot)
    throw invalidSchema('Asynchronous output JSON Schemas are not supported.');

  const checkReferences = (node: JSONSchema7 | boolean): void => {
    if (typeof node !== 'object' || node === null) return;
    if ('nullable' in node)
      throw invalidSchema('Use a JSON Schema null type instead of nullable.');
    if (node.$ref !== undefined && !node.$ref.startsWith('#'))
      throw invalidSchema('Output JSON Schema references must be local.');
    for (const map of [
      node.properties,
      node.patternProperties,
      node.definitions,
      node.dependencies,
    ])
      for (const child of Object.values(map ?? {}))
        if (!Array.isArray(child)) checkReferences(child);
    for (const child of [
      node.additionalProperties,
      node.additionalItems,
      node.contains,
      node.propertyNames,
      node.not,
      node.if,
      node.then,
      node.else,
      ...(Array.isArray(node.items) ? node.items : [node.items]),
      ...(node.allOf ?? []),
      ...(node.anyOf ?? []),
      ...(node.oneOf ?? []),
    ])
      if (child !== undefined) checkReferences(child);
  };

  try {
    const ajv = new Ajv({
      strictSchema: true,
      strictTypes: false,
      strictTuples: false,
      ownProperties: true,
      coerceTypes: false,
      useDefaults: false,
      removeAdditional: false,
      code: { regExp: linearRegExp },
    });
    addFormats.default(ajv);
    if (!ajv.validateSchema(snapshot)) throw new Error(ajv.errorsText());
    checkReferences(snapshot);
    const validate = ajv.compile<OnlineAgentJson>(snapshot);
    return jsonSchema<OnlineAgentJson>(snapshot, {
      validate: (value) =>
        validate(value)
          ? { success: true, value }
          : {
              success: false,
              error: new Error(
                'The model output does not match the JSON Schema.',
              ),
            },
    });
  } catch (error) {
    throw invalidSchema(
      `Invalid output JSON Schema: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
