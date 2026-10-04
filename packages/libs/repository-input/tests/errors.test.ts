import { describe, expect, it } from 'vitest';

import {
  RepositoryError,
  repositoryErrorStatuses,
  type RepositoryErrorCode,
} from '../src/errors.js';

describe('RepositoryError', () => {
  it('takes its status from its code', () => {
    expect(new RepositoryError('RECORD_NOT_FOUND', 'Missing.').status).toBe(
      'NOT_FOUND',
    );
    expect(new RepositoryError('WRITE_FORBIDDEN', 'Refused.').status).toBe(
      'PERMISSION_DENIED',
    );
    expect(new RepositoryError('VERSION_CONFLICT', 'Changed.').status).toBe(
      'ABORTED',
    );
    expect(new RepositoryError('INVALID_POLICY', 'Broken.').status).toBe(
      'INTERNAL',
    );
  });

  it('reports a missing relation target the body names as invalid input', () => {
    expect(repositoryErrorStatuses.RELATION_TARGET_NOT_FOUND).toBe(
      'INVALID_ARGUMENT',
    );
  });

  it('gives every code a status', () => {
    for (const code of Object.keys(
      repositoryErrorStatuses,
    ) as RepositoryErrorCode[]) {
      expect([
        'INVALID_ARGUMENT',
        'PERMISSION_DENIED',
        'NOT_FOUND',
        'ABORTED',
        'INTERNAL',
      ]).toContain(new RepositoryError(code, code).status);
    }
  });
});
