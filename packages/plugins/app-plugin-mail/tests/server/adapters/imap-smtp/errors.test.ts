import { describe, expect, it } from 'vitest';

import { classifyError } from '../../../../server/adapters/imap-smtp/errors.js';

describe('IMAP/SMTP error classification', () => {
  it('uses IMAP response details for authentication failures', () => {
    const result = classifyError(
      Object.assign(new Error('Command failed'), {
        authenticationFailed: true,
        serverResponseCode: 'AUTHENTICATIONFAILED',
        responseText: 'Invalid credentials',
      }),
      'IMAP_SMTP_CONNECT',
    );

    expect(result).toEqual({
      code: 'AUTHENTICATIONFAILED',
      message: 'Invalid credentials',
      category: 'authentication',
      retryable: false,
    });
  });
});
