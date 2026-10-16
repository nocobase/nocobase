import { expect, it } from 'vitest';
import type { JSONSchema7 } from 'ai';
import { createOutputSchema } from '../server/online-agent/output.js';

it('snapshots a serializable schema and validates local references and formats', async () => {
  const schema: JSONSchema7 = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    definitions: { email: { type: 'string', format: 'email' } },
    properties: { email: { $ref: '#/definitions/email' } },
    required: ['email'],
    additionalProperties: false,
  };
  const output = createOutputSchema(schema);
  expect(output.jsonSchema).toEqual(schema);
  expect(output.jsonSchema).not.toBe(schema);
  schema.required = [];
  expect(await output.validate!({})).toMatchObject({ success: false });
  expect(await output.validate!({ email: 'invalid' })).toMatchObject({
    success: false,
  });
  expect(await output.validate!({ email: 'user@example.com' })).toEqual({
    success: true,
    value: { email: 'user@example.com' },
  });
});

it('does not coerce, insert defaults or remove extra properties', async () => {
  const output = createOutputSchema({
    type: 'object',
    properties: { count: { type: 'integer', default: 2 } },
    additionalProperties: false,
  });
  const empty = {};
  expect(await output.validate!(empty)).toEqual({ success: true, value: {} });
  expect(empty).toEqual({});
  for (const value of [{ count: '2' }, { count: 2, extra: true }]) {
    const original = structuredClone(value);
    expect(await output.validate!(value)).toMatchObject({ success: false });
    expect(value).toEqual(original);
  }
});

it.each([
  { properties: { value: { $ref: 'https://example.com/remote' } } },
  { definitions: { unused: { $ref: 'file:///tmp/remote.json' } } },
  { items: { $ref: 'other.json' } },
  { allOf: [{ $ref: 'other.json' }] },
  { dependencies: { value: { $ref: 'other.json' } } },
  { $ref: '#/definitions/missing' },
])('rejects remote and unresolved references: %j', (schema) => {
  expect(() => createOutputSchema(schema)).toThrow();
});

it('does not interpret reference-looking data in annotations and const as schema references', async () => {
  const value = { $ref: 'https://example.com/data' };
  const output = createOutputSchema({
    type: 'object',
    const: value,
    default: value,
  });
  expect(await output.validate!(value)).toEqual({ success: true, value });
});

it('does not retain schemas or conflict on repeated schema identifiers', async () => {
  const first = createOutputSchema({ $id: 'test', type: 'number' });
  const second = createOutputSchema({ $id: 'test', type: 'string' });
  expect(await first.validate!(1)).toEqual({ success: true, value: 1 });
  expect(await second.validate!('x')).toEqual({ success: true, value: 'x' });
});

it('rejects excessive bytes, depth, nodes and circular schemas before compilation', () => {
  expect(() => createOutputSchema({ description: 'x'.repeat(65536) })).toThrow(
    '64 KiB',
  );
  expect(() =>
    createOutputSchema({ enum: Array.from({ length: 4096 }, (_, i) => i) }),
  ).toThrow('too complex');
  let deep: JSONSchema7 = { type: 'string' };
  for (let i = 0; i < 33; i++) deep = { not: deep };
  expect(() => createOutputSchema(deep)).toThrow('too complex');
  const circular: JSONSchema7 = {};
  circular.not = circular;
  expect(() => createOutputSchema(circular)).toThrow('too complex');
});

it('validates caller patterns in linear time, including patternProperties', async () => {
  const pattern = '^(a+)+$|!$';
  const value = 'a'.repeat(10000) + '!';
  const output = createOutputSchema({ type: 'string', pattern });
  expect(await output.validate!(value)).toEqual({ success: true, value });
  expect(await output.validate!('b')).toMatchObject({ success: false });
  const object = createOutputSchema({
    type: 'object',
    patternProperties: { [pattern]: { type: 'integer' } },
    additionalProperties: false,
  });
  expect(await object.validate!({ [value]: 2 })).toMatchObject({
    success: true,
  });
  expect(await object.validate!({ [value]: '2' })).toMatchObject({
    success: false,
  });
});

it.each(['a(?=b)', '(a)\\1', '\\A'])(
  'rejects patterns outside supported ECMAScript and RE2 syntax: %s',
  (pattern) => {
    expect(() => createOutputSchema({ type: 'string', pattern })).toThrow(
      'Invalid output JSON Schema',
    );
  },
);

it('preserves supported Unicode patterns and unanchored matching', async () => {
  const output = createOutputSchema({ type: 'string', pattern: '\\u{1F600}' });
  expect(await output.validate!('before😀after')).toMatchObject({
    success: true,
  });
  expect(await output.validate!('beforeafter')).toMatchObject({
    success: false,
  });
});

it('rejects nullable extensions instead of weakening Draft-07 assertions', () => {
  expect(() =>
    createOutputSchema({
      type: 'object',
      properties: { count: { type: 'integer', nullable: true } },
      required: ['count'],
    } as JSONSchema7),
  ).toThrow('null type instead of nullable');
});
