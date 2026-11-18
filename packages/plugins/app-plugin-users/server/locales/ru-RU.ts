import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const ruRU: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} приглашает вас в {{app}}',
    intro: '{{inviter}} приглашает вас в {{app}}.',
    summary: 'Вы также присоединитесь к: {{items}}.',
    separator: ', ',
    action: 'Принять приглашение',
    validity:
      'Откройте ссылку, чтобы указать имя и пароль. Ссылка одноразовая и действует до {{date}}.',
    fallback: 'Если ссылка не открывается, скопируйте её в браузер:',
  },
};

export default ruRU;
