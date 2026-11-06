import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  invitationEmail: {
    subject: '{{inviter}} mengundang Anda ke {{app}}',
    intro: '{{inviter}} mengundang Anda ke {{app}}.',
    summary: 'Anda juga akan bergabung: {{items}}.',
    separator: ', ',
    action: 'Terima undangannya',
    validity:
      'Buka tautan untuk mengatur nama dan kata sandi Anda. Ini berfungsi sekali, hingga {{date}}.',
    fallback: 'Jika tautan tidak terbuka, salin ke browser Anda:',
  },
};

export default idID;
