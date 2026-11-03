import { expect, it } from 'vitest';
import { ApiError } from '../src/lib/http.ts';
it('retries a revision race but does not retry a generic conflict', () => {
  expect(
    new ApiError(409, 'REVISION_CONFLICT', 'Quota changed.').transient,
  ).toBe(true);
  expect(
    new ApiError(409, 'CONFLICT', 'Known reset clears automatically.')
      .transient,
  ).toBe(false);
});
