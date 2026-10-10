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
    submitting: 'Joining…',
    signedIn:
      'You are signed in as {{name}}. Sign out to accept this invitation with a new account.',
    signOut: 'Sign out',
    signOutFailed: 'Could not sign out.',
    existingAccount:
      'This address already has an account. Sign in with it to continue.',
    goToLogin: 'Go to sign in',
    errors: {
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
