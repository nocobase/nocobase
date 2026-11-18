import { expect, it } from 'vitest';

import { isUniqueConstraintViolation } from '../../../src/index.js';

it('recognizes Dameng unique violations, including wrapped driver errors', () => {
  const error = { errCode: -6602 };
  expect(isUniqueConstraintViolation(error)).toBe(true);
  expect(
    isUniqueConstraintViolation(new Error('insert failed', { cause: error })),
  ).toBe(true);
  expect(isUniqueConstraintViolation({ originalError: error })).toBe(true);
});

it('does not treat other Dameng errors or message text as unique violations', () => {
  expect(isUniqueConstraintViolation({ errCode: -6603 })).toBe(false);
  expect(
    isUniqueConstraintViolation(new Error('[-6602] user supplied text')),
  ).toBe(false);
});

it.each([
  { code: '23505' },
  { code: 'ER_DUP_ENTRY' },
  { errno: 1062 },
  { code: 'SQLITE_CONSTRAINT_UNIQUE' },
  { code: 'SQLITE_CONSTRAINT_PRIMARYKEY' },
  { errorNum: 1 },
  { number: 2601 },
  { number: 2627 },
])(
  'recognizes supported driver unique errors through the public API: %j',
  (error) => {
    expect(isUniqueConstraintViolation(error)).toBe(true);
    expect(
      isUniqueConstraintViolation({ cause: { originalError: error } }),
    ).toBe(true);
  },
);

it.each([
  { code: 'SQLITE_CONSTRAINT' },
  { code: 'SQLITE_CONSTRAINT_FOREIGNKEY' },
  { code: 'SQLITE_CONSTRAINT_NOTNULL' },
  { code: '23503' },
  { errno: 1452 },
  null,
  new Error('ER_DUP_ENTRY'),
])(
  'does not recover non-unique constraints or arbitrary errors: %j',
  (error) => {
    expect(isUniqueConstraintViolation(error)).toBe(false);
  },
);

it('terminates on cyclic wrappers', () => {
  const error: { cause?: unknown } = {};
  error.cause = error;
  expect(isUniqueConstraintViolation(error)).toBe(false);
});
