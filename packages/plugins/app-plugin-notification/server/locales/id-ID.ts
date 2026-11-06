import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Akses log notifikasi diperlukan.',
    logNotFound: 'Log notifikasi tidak ditemukan.',
  },
};

export default idID;
