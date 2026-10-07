import type { LocaleResource } from '@nocobase/i18n';

/**
 * Messages for the errors the authentication actions report (`actions/errors.ts`), keyed by the server's error code:
 * Better Auth's own codes, its username plugin's, and the ones this plugin's server adds.
 */
const enUS = {
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Could not reach the server. Check your connection and try again.',
    rateLimited: 'Too many attempts. Please wait a moment and try again.',
    INVALID_EMAIL_OR_PASSWORD: 'Incorrect email or password.',
    INVALID_USERNAME_OR_PASSWORD: 'Incorrect username or password.',
    INVALID_PASSWORD: 'Incorrect password.',
    INVALID_EMAIL: 'Enter a valid email address.',
    INVALID_USERNAME:
      'Usernames may contain only letters, digits, underscores and dots.',
    USERNAME_TOO_SHORT: 'This username is too short.',
    USERNAME_TOO_LONG: 'This username is too long.',
    USERNAME_IS_ALREADY_TAKEN: 'This username is already taken.',
    USER_ALREADY_EXISTS: 'An account with this email already exists.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'An account with this email already exists. Use another email.',
    PASSWORD_TOO_SHORT: 'This password is too short.',
    PASSWORD_TOO_LONG: 'This password is too long.',
    EMAIL_NOT_VERIFIED: 'Verify your email address before signing in.',
    INVALID_TOKEN: 'This link is invalid or has expired.',
    TOKEN_EXPIRED: 'This link has expired.',
    ACCOUNT_DISABLED: 'This account is disabled. Contact your administrator.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'A service account cannot sign in; it acts only through API keys.',
    INVALID_CSRF_ORIGIN:
      'This request came from another site and was refused. Reload the page and try again.',
  },
};

export type AuthenticationResource = LocaleResource<typeof enUS>;

export default enUS;
