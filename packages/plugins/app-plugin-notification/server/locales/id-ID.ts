import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Akses log notifikasi diperlukan.',
    logNotFound: 'Log notifikasi tidak ditemukan.',
    testHeaderRequired: 'Header permintaan pengujian notifikasi diperlukan.',
    testForbidden: 'Diperlukan izin pengiriman tes notifikasi.',
    testInvalidRequest:
      'Badan permintaan harus berisi target pengujian dan nilai bidang.',
    testTargetUnavailable: 'Target pengujian notifikasi tidak tersedia.',
    testUnknownField: 'Bidang uji notifikasi tidak diketahui "{{name}}".',
    testRequiredField: 'Bidang uji notifikasi "{{name}}" wajib diisi.',
    testFieldTooLong:
      'Bidang pengujian notifikasi "{{name}}" harus berisi paling banyak karakter {{maxLength}}.',
    testFailed: 'Tes notifikasi gagal.',
    testNotFound: 'Tes notifikasi tidak ditemukan.',
  },
};

export default idID;
