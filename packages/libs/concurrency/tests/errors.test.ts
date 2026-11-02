import { expect, it } from 'vitest';
import * as api from '../src/index.ts';

it('exports exactly the five shared error constructors and preserves causes', () => {
  expect(Object.keys(api).sort()).toEqual(
    [
      'ConcurrentAbortError',
      'ConcurrentAcquireError',
      'ConcurrentCloseError',
      'ConcurrentConfigurationError',
      'ConcurrentReleaseError',
    ].sort(),
  );
  const cause = new Error('original');
  for (const ErrorClass of Object.values(api)) {
    const error = new ErrorClass('message', { cause });
    expect(error).toBeInstanceOf(Error);
    expect(error.cause).toBe(cause);
    expect(error.name).toBe(ErrorClass.name);
  }
});
