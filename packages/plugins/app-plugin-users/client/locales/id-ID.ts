import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Memuat',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Pengguna',
      category: 'Akun',
      name: 'Undangan pengguna',
      trigger:
        'Administrator mengundang seseorang, atau mengirim ulang undangan, dengan opsi email dipilih.',
      recipients:
        'Orang yang diundang, di alamat email yang dimasukkan untuknya.',
      businessRule:
        'Dikirim setiap kali undangan dibuat atau dikirim ulang dengan opsi email dipilih. Tidak ada tombol terpisah untuk mematikannya.',
      languagePolicy:
        'Ditulis dalam satu bahasa yang dipilih saat mengundang: bahasa antarmuka pengundang, kecuali dipilih bahasa lain. Pengiriman ulang tetap memakai bahasa itu. Jika bahasa tersebut belum memiliki teks email, email memakai bahasa default aplikasi dan bahasa Inggris.',
      channel: 'Pengirim email undangan',
      variables: {
        app: 'Nama aplikasi',
        inviter: 'Nama orang yang mengirim undangan',
        items: 'Peran atau akses yang diberikan undangan',
        date: 'Kapan undangan kedaluwarsa, dalam bahasa email dan dalam UTC',
        url: 'Tautan untuk menerima undangan; pratinjau menggunakan tautan fiktif',
      },
    },
  },
  accept: {
    title: 'Terima undangannya',
    language: 'Bahasa',
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
