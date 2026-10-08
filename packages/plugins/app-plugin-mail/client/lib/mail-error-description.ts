import type {
  KnownMailProviderErrorCategory,
  KnownMailProviderReasonCode,
  MailPublicError,
} from '../../shared/mail.js';

export interface MailErrorDescription {
  readonly key: string;
  readonly defaultValue: string;
}

const descriptions = {
  gmailRateLimitExceeded: {
    key: 'errors.gmailRateLimitExceeded',
    defaultValue:
      'Gmail is temporarily limiting requests for this mailbox. Wait before retrying; reconnecting will not help.',
  },
  gmailUserRateLimitExceeded: {
    key: 'errors.gmailUserRateLimitExceeded',
    defaultValue:
      "This mailbox has reached Gmail's per-user request limit. Wait before retrying; reconnecting will not resolve the limit.",
  },
  gmailDailyLimitExceeded: {
    key: 'errors.gmailDailyLimitExceeded',
    defaultValue:
      'The Gmail API daily quota has been reached. Wait for the quota to reset or ask your Google Workspace administrator to review the project quota.',
  },
  gmailDomainPolicy: {
    key: 'errors.gmailDomainPolicy',
    defaultValue:
      'Your Google Workspace administrator is blocking this Gmail operation. Ask them to review the domain policy for this app.',
  },
  gmailInsufficientPermissions: {
    key: 'errors.gmailInsufficientPermissions',
    defaultValue:
      'This Google account has not granted the required Gmail permissions. Reconnect it and approve the requested access.',
  },
  gmailAuthError: {
    key: 'errors.gmailAuthError',
    defaultValue:
      'Google rejected the mailbox credentials. Reconnect the Google account and try again.',
  },
  gmailApiNotEnabled: {
    key: 'errors.gmailApiNotEnabled',
    defaultValue:
      'The Gmail API is not enabled for this Google project. Ask the app administrator to enable it.',
  },
} as const satisfies Record<KnownMailProviderReasonCode, MailErrorDescription>;

const categoryDescriptions = {
  authentication: {
    key: 'errors.authentication',
    defaultValue:
      'The mail account authorization is invalid or expired. Reconnect the account and try again.',
  },
  configuration: {
    key: 'errors.configuration',
    defaultValue:
      'The mail provider configuration is incomplete or invalid. Ask the mail administrator to check the account settings.',
  },
  recipient: {
    key: 'errors.recipient',
    defaultValue:
      'The mail provider rejected one or more recipients. Check the addresses and recipient policy.',
  },
  content: {
    key: 'errors.content',
    defaultValue:
      'The provider rejected the message content. Check the message size, format, and attachments.',
  },
  rate_limit: {
    key: 'errors.rateLimit',
    defaultValue:
      'The mail provider is temporarily limiting requests. Wait before retrying; reconnecting will not resolve the limit.',
  },
  network: {
    key: 'errors.network',
    defaultValue:
      'The mail service could not be reached. Check the network connection and retry.',
  },
  timeout: {
    key: 'errors.timeout',
    defaultValue:
      'The mail service did not respond in time. Check the mailbox state before retrying.',
  },
  provider: {
    key: 'errors.provider',
    defaultValue:
      'The mail provider rejected the operation. Check the provider settings and the error code below.',
  },
  unknown: {
    key: 'errors.unknown',
    defaultValue:
      'The mail operation failed for an unexpected reason. Share the error code below with the mail administrator.',
  },
} as const satisfies Record<
  KnownMailProviderErrorCategory,
  MailErrorDescription
>;

function isKnownReasonCode(
  reasonCode: string,
): reasonCode is keyof typeof descriptions {
  return Object.hasOwn(descriptions, reasonCode);
}

function isKnownCategory(
  category: string,
): category is keyof typeof categoryDescriptions {
  return Object.hasOwn(categoryDescriptions, category);
}

export function mailErrorDescription(
  error: Pick<MailPublicError, 'category' | 'reasonCode'>,
): MailErrorDescription {
  if (error.reasonCode && isKnownReasonCode(error.reasonCode)) {
    return descriptions[error.reasonCode];
  }
  if (isKnownCategory(error.category)) {
    return categoryDescriptions[error.category];
  }
  return categoryDescriptions.unknown;
}
