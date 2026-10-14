import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  errors: {
    imapMoveLocationChanged:
      'The selected folder or copy changed. Synchronize and open the source folder again.',
    imapMoveNotWritable:
      'The selected folder does not allow this operation. Check its mailbox permissions.',
    imapMoveSourceRequired:
      'Open the source folder before moving or deleting this message.',
    imapMoveUnsupported:
      'This server cannot safely move messages. Use your mail client.',
    imapTrashNotFound:
      'This account has no Trash folder. Use your mail client.',
    imapMoveOutcomeUnknown:
      'The move is incomplete or its result is unknown. Verify the mailbox before retrying.',

    accessDenied: 'Mail access is required.',
    idempotencyConflict:
      'The idempotency key is already associated with another request.',
    invalidRequest: 'The mail request is invalid.',
    accountCredentialsInvalid:
      'Mailbox authentication failed. Check your login name and password or authorization code, and confirm that IMAP/SMTP is enabled. Gmail and other services may require an app password.',
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
