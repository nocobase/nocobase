import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  errors: {
    accessDenied: 'Mail access is required.',
    idempotencyConflict:
      'The idempotency key is already associated with another request.',
    invalidRequest: 'The mail request is invalid.',
    requestFailed: 'The mail request could not be completed.',
    providerRateLimited:
      'The mail service is receiving too many requests. Try again later.',
    providerUnavailable:
      'The mail service could not be reached. Try again later.',
    reauthorizationRequired:
      'This mail account must be reconnected before it can be used.',
    syncRunNotFound: 'Mail sync run was not found.',
    messageNotFound: 'Mail message was not found.',
    authorizationStateRequired: 'Mail authorization state is required.',
  },
};

export type MailServerResource = LocaleResource<typeof enUS>;
export default enUS;
