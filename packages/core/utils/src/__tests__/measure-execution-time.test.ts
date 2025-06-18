import { describe, it, expect, vi } from 'vitest';
import { measureExecutionTime } from '../measure-execution-time';

/**
 * Tests for measureExecutionTime utility.
 */

describe('measureExecutionTime', () => {
  it('should return the result of the wrapped operation', async () => {
    const operation = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'ok';
    });

    const result = await measureExecutionTime(operation, 'test');

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalled();
  });
});
