import { describe, expect, it } from 'vitest';
import type { UniqueSelector } from '../../../src/index.js';
import { selectorBatches } from '../../../src/repository/internal/knex-execution-adapter.js';

function selectors(count: number, width: number): UniqueSelector[] {
  const fields = Array.from({ length: width }, (_, index) => `k${index}`);
  return Array.from({ length: count }, (_, row) => ({
    kind: 'unique',
    fields,
    values: Object.fromEntries(fields.map((field) => [field, row])),
  }));
}

describe('selectorBatches', () => {
  it('splits single-field selectors into batches of 200', () => {
    expect(
      selectorBatches(selectors(450, 1)).map((batch) => batch.length),
    ).toEqual([200, 200, 50]);
  });

  it('keeps a wide composite key under the parameter budget', () => {
    const batches = selectorBatches(selectors(300, 11));
    expect(batches.every((batch) => batch.length * 11 <= 1000)).toBe(true);
    expect(batches.flat()).toHaveLength(300);
  });

  it('returns no batch for no selectors', () => {
    expect(selectorBatches([])).toEqual([]);
  });
});
