import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} hat Sie zu {{app}} eingeladen',
    intro: '{{inviter}} hat Sie zu {{app}} eingeladen.',
    summary: 'Sie werden auch beitreten: {{items}}.',
    separator: ', ',
    action: 'Nimm die Einladung an',
    validity:
      'Öffnen Sie den Link, um Ihren Namen und Ihr Passwort festzulegen. Es funktioniert einmal, bis {{date}}.',
    fallback:
      'Wenn sich der Link nicht öffnet, kopieren Sie ihn in Ihren Browser:',
  },
};

export default deDE;
