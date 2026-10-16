import { jsonSchema, type JSONSchema7, type Schema } from 'ai';
import { Ajv, type CodeOptions } from 'ajv';
import addFormats from 'ajv-formats';
import { RE2JS } from 're2js';
import { jsonSafe, type OnlineAgentJson } from './codec.js';
import { invalid } from '../kernel/errors.js';

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
      throw invalid('The output JSON Schema is too complex.');
    if (value !== null && typeof value === 'object')
      for (const child of Object.values(value)) checkSize(child, depth + 1);
  };
  checkSize(schema, 0);
  const snapshot = jsonSafe(schema) as JSONSchema7;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot))
    throw invalid('An output JSON Schema object is required.');
  if (Buffer.byteLength(JSON.stringify(snapshot)) > 65536)
    throw invalid('The output JSON Schema exceeds 64 KiB.');
  if (snapshot.$schema !== undefined && snapshot.$schema !== draft)
    throw invalid('The output JSON Schema must use Draft-07.');
  if ('$async' in snapshot)
    throw invalid('Asynchronous output JSON Schemas are not supported.');

  const checkReferences = (node: JSONSchema7 | boolean): void => {
    if (typeof node !== 'object' || node === null) return;
    if ('nullable' in node)
      throw invalid('Use a JSON Schema null type instead of nullable.');
    if (node.$ref !== undefined && !node.$ref.startsWith('#'))
      throw invalid('Output JSON Schema references must be local.');
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
    throw invalid(
      `Invalid output JSON Schema: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
