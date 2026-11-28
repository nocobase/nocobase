import auditLabels from '../../locales/en-US.js';
import type { LocaleResource } from '@nocobase/i18n';

const messages = {
  invitationEmail: {
    subject: '{{inviter}} invited you to {{app}}',
    intro: '{{inviter}} invited you to {{app}}.',
    summary: 'You will also join: {{items}}.',
    separator: ', ',
    action: 'Accept the invitation',
    validity:
      'Open the link to set your name and password. It works once, until {{date}}.',
    fallback: 'If the link does not open, copy it into your browser:',
  },
};

const enUS: typeof messages & typeof auditLabels = {
  ...auditLabels,
  ...messages,
};

export type UsersResource = LocaleResource<typeof enUS>;

export default enUS;
