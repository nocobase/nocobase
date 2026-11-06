import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Memuat',
  },
  accept: {
    title: 'Terima undangannya',
    description: '{{inviter}} mengundang Anda.',
    summary: 'Anda juga akan bergabung: {{items}}',
    loading: 'Memuat undangan…',
    email: 'Email',
    name: 'Nama',
    username: 'Nama pengguna (opsional)',
    usernameHint: 'Anda dapat menggunakan nama pengguna ini untuk masuk.',
    password: 'Kata sandi',
    nameRequired: 'Masukkan nama Anda.',
    passwordTooShort: 'Kata sandi memerlukan setidaknya karakter {{min}}.',
    submit: 'Buat akun dan bergabung',
    join: 'Terima undangan',
    submitting: 'Bergabung…',
    signedIn:
      'Anda masuk sebagai {{name}}. Keluar untuk menerima undangan ini dengan akun baru.',
    signOut: 'Keluar',
    signOutFailed: 'Tidak dapat keluar.',
    existingAccount:
      'Alamat ini sudah memiliki akun. Masuklah untuk melanjutkan.',
    alreadyHaveAccount: 'Sudah punya akun? Masuk',
    goToLogin: 'Pergi untuk masuk',
    errors: {
      notFound: 'Tautan undangan ini tidak valid.',
      expired: 'Undangan ini telah kedaluwarsa. Minta yang baru.',
      accepted: 'Undangan ini telah diterima.',
      revoked: 'Undangan ini telah dicabut.',
      password: 'Kata sandi tidak memenuhi persyaratan.',
      usernameConflict:
        'Nama ini sudah digunakan sebagai nama pengguna atau email. Pilih nama lain.',
      accountConflict: 'Akun dengan alamat ini tidak dapat dibuat.',
      failed: 'Ada yang tidak beres. Silakan coba lagi.',
    },
  },
};

export default idID;
