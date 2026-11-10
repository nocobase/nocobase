import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  page: {
    loading: 'Loading',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Users',
      category: 'Accounts',
      name: 'User invitation',
      trigger:
        'An administrator invites someone, or resends an invitation, with email selected.',
      recipients:
        'The person being invited, at the email address entered for them.',
      businessRule:
        'Sent every time an invitation is created or resent with email selected. There is no separate switch to turn it off.',
      languagePolicy:
        'The email body lists every language one after another. The subject is in English.',
      channel: 'Invitation email sender',
      variables: {
        app: 'Application name',
        inviter: 'Name of the person who sent the invitation',
        items: 'Roles or access the invitation grants',
        date: 'When the invitation expires',
        url: 'Link for accepting the invitation; the preview uses a fake link',
      },
    },
  },
  accept: {
    title: 'Accept the invitation',
    description: '{{inviter}} invited you.',
    summary: 'You will also join: {{items}}',
    loading: 'Loading the invitation…',
    email: 'Email',
    name: 'Name',
    username: 'Username (optional)',
    usernameHint: 'You can use this username to sign in.',
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
    alreadyHaveAccount: 'Already have an account? Sign in',
    goToLogin: 'Go to sign in',
    errors: {
      notFound: 'This invitation link is not valid.',
      expired: 'This invitation has expired. Ask for a new one.',
      accepted: 'This invitation has already been accepted.',
      revoked: 'This invitation has been revoked.',
      password: 'The password does not meet the requirements.',
      usernameConflict:
        'This username is already used as a username or email. Choose another.',
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
