import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  page: {
    loading: 'Loading',
  },
  accept: {
    title: 'Accept the invitation',
    description: '{{inviter}} invited you.',
    summary: 'You will also join: {{items}}',
    loading: 'Loading the invitation…',
    email: 'Email',
    name: 'Name',
    password: 'Password',
    nameRequired: 'Enter your name.',
    passwordTooShort: 'The password needs at least {{min}} characters.',
    submit: 'Create account and join',
    join: 'Accept invitation',
    submitting: 'Joining…',
    signedIn:
      'You are signed in as {{name}}. Sign out to accept this invitation with a new account.',
    signOut: 'Sign out',
    signOutFailed: 'Could not sign out.',
    existingAccount:
      'This address already has an account. Sign in with it to continue.',
    verifyDescription:
      'To create an account, verify this email address using the private link sent to its mailbox. A shared invitation link alone cannot create an account.',
    verifyEmail: 'Send verification email',
    verificationSending: 'Sending verification…',
    verificationSent:
      'Check your email and open the verification link within 15 minutes. You can request another email after one minute.',
    goToLogin: 'Go to sign in',
    errors: {
      verificationDelivery:
        'The verification email could not be sent. Please try again later or contact the administrator.',
      verificationRateLimited:
        'Please wait one minute before requesting another verification email.',
      verificationRequired:
        'Open a valid verification link sent to the invited mailbox, or request a new one below.',
      notFound: 'This invitation link is not valid.',
      expired: 'This invitation has expired. Ask for a new one.',
      accepted: 'This invitation has already been accepted.',
      revoked: 'This invitation has been revoked.',
      password: 'The password does not meet the requirements.',
      accountConflict: 'An account with this address cannot be created.',
      failed: 'Something went wrong. Please try again.',
    },
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
