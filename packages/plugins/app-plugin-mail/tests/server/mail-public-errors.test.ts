import { describe, expect, it } from 'vitest';

import { toPublicError } from '../../server/services/errors.js';
import type {
  MailProviderError,
  MailProviderReasonCode,
} from '../../shared/mail.js';

const publicReasons = [
  'gmailRateLimitExceeded',
  'gmailUserRateLimitExceeded',
  'gmailDailyLimitExceeded',
  'gmailDomainPolicy',
  'gmailInsufficientPermissions',
  'gmailAuthError',
  'gmailApiNotEnabled',
] as const satisfies readonly MailProviderReasonCode[];

describe('public mail errors', () => {
  it.each(publicReasons)(
    'keeps the safe %s diagnostic without exposing provider messages',
    (reasonCode) => {
      const error: MailProviderError = {
        code: 'GMAIL_HTTP_403',
        message: 'private Google response details',
        category: 'rate_limit',
        retryable: true,
        reasonCode,
      };

      expect(toPublicError(error)).toEqual({
        code: 'GMAIL_HTTP_403',
        category: 'rate_limit',
        retryable: true,
        reasonCode,
      });
    },
  );

  it('drops unrecognized provider reason codes', () => {
    const error = {
      code: 'GMAIL_HTTP_403',
      message: 'private Google response details',
      category: 'provider',
      retryable: false,
      reasonCode: 'private-reason-with-internal-details',
    } as MailProviderError;

    expect(toPublicError(error)).not.toHaveProperty('reasonCode');
    expect(toPublicError(error)).not.toHaveProperty('message');
  });
});
