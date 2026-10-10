import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  invitationEmail: {
    subject: '{{inviter}} invited you to {{app}}',
    intro: '{{inviter}} invited you to {{app}}.',
    summary: 'You will also join: {{items}}.',
    separator: ', ',
    action: 'Accept the invitation',
    validity:
      'Verify your email and accept the invitation within 15 minutes. If this verification link expires, request a new verification email from the invitation page.',
    fallback: 'If the link does not open, copy it into your browser:',
  },
};

export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
