import { expect, it } from 'vitest';
import { Type } from '@sinclair/typebox';
import { assertSerializableDefinition } from '../../build/source-serialization.js';
import { toJsonSchema } from '../../dsl/schema.js';
import { validateNodeResultSchema } from '../../server/engine/node-results.js';

it('converts TypeBox metadata into an independent JSON Schema', () => {
  const source = Type.Object({
    route: Type.Union([Type.Literal('yes'), Type.Literal('no')]),
    values: Type.Array(Type.Number()),
  });
  const first = toJsonSchema(source);
  expect(first).toEqual({
    type: 'object',
    properties: {
      route: {
        anyOf: [
          { type: 'string', const: 'yes' },
          { type: 'string', const: 'no' },
        ],
      },
      values: { type: 'array', items: { type: 'number' } },
    },
    required: ['route', 'values'],
  });
  expect(Object.getOwnPropertySymbols(first)).toEqual([]);
  expect(() => assertSerializableDefinition(first, 'schema')).not.toThrow();
  expect(validateNodeResultSchema(first)).toEqual([]);
  if ('type' in first && first.type === 'object')
    Reflect.deleteProperty(first.properties, 'route');
  expect(toJsonSchema(source)).not.toEqual(first);
});

it('preserves optional fields without making their JSON schema nullable', () => {
  const source = Type.Object({
    name: Type.String(),
    comment: Type.Optional(Type.String()),
  });
  expect(toJsonSchema(source)).toMatchObject({
    required: ['name'],
    properties: { comment: { type: 'string' } },
  });
});
