import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  demo: {
    preparing: 'Menyiapkan kotak surat demo…',
    setUp: 'Siapkan kotak surat demo',
    setupFailed: 'Tidak dapat menyiapkan kotak surat demo.',
  },
};

export default idID;
