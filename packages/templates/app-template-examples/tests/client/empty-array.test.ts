import { describe, expect, it } from 'vitest';

import { EMPTY_ARRAY } from '../../client/lib/constants.js';

describe('EMPTY_ARRAY', () => {
  it('is an empty array', () => {
    expect(EMPTY_ARRAY).toEqual([]);
  });

  it('keeps one identity, which is the whole point of sharing it', () => {
    // A `[]` literal is a new value every time it is evaluated, so a default parameter or a `??` fallback built
    // from one looks like a changed dependency to every React comparison it reaches.
    const read = () => EMPTY_ARRAY;
    expect(read()).toBe(read());
  });

  it('refuses to be filled, since it is shared with every other caller', () => {
    expect(() => (EMPTY_ARRAY as unknown as unknown[]).push('x')).toThrow(
      TypeError,
    );
    expect(EMPTY_ARRAY).toHaveLength(0);
  });
});
