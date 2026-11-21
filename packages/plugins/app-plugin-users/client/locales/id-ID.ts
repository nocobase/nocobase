import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  management: {
    actions: 'Tindakan',
    actionsFor: 'Tindakan untuk {{name}}',
    all: 'Semua status',
    allRoles: 'Semua peran',
    assignedRoles: 'Peran yang ditetapkan',
    backToSource: 'Kembali ke halaman sebelumnya',
    cancel: 'Batal',
    clear: 'Hapus filter',
    confirm: 'Konfirmasi',
    conflict:
      'Permintaan bertentangan dengan data saat ini. Tinjau catatan terbaru sebelum mencoba lagi.',
    create: 'Buat',
    created: 'Pengguna "{{name}}" dibuat',
    denied: 'Anda tidak memiliki akses. Hubungi administrator.',
    disable: 'Nonaktifkan',
    disableHint:
      'Pengguna ini tidak akan dapat masuk dan sesi yang ada akan berakhir.',
    disableTitle: 'Nonaktifkan pengguna "{{name}}"?',
    disabled: 'Nonaktif',
    discardHint: 'Perubahan yang belum disimpan akan hilang.',
    discardTitle: 'Buang perubahan?',
    editUser: 'Edit pengguna',
    email: 'Email',
    enable: 'Aktifkan',
    enableHint: 'Pengguna ini akan dapat masuk lagi.',
    enableTitle: 'Aktifkan pengguna "{{name}}"?',
    enabled: 'Aktif',
    failed: 'Permintaan tidak dapat diselesaikan. Coba lagi.',
    identityConflict: 'Email atau nama pengguna ini sudah digunakan.',
    invalidEmail: 'Masukkan alamat email yang valid',
    invalidRequest:
      'Beberapa nilai tidak valid. Periksa masukan atau filter Anda, lalu coba lagi.',
    listChanged: 'Daftar telah berubah. Silakan coba lagi.',
    loading: 'Memuat',
    missing: 'Catatan ini tidak ada atau telah dihapus.',
    name: 'Nama',
    newUser: 'Pengguna baru',
    noAssignedRoles: 'Tidak ada peran yang ditetapkan',
    noRoleAccess:
      'Pengguna ini tetap dapat masuk dan menggunakan fitur dasar akun. Peran tidak memberikan akses bisnis apa pun.',
    noRolesFound: 'Peran tidak ditemukan.',
    password: 'Kata sandi awal',
    passwordPolicy: 'Kata sandi tidak memenuhi kebijakan kata sandi saat ini.',
    required: 'Isi bidang ini',
    retry: 'Coba lagi',
    revokeHint: 'Pengguna ini perlu masuk lagi.',
    revokeRoleHint:
      'Akses yang diberikan oleh peran yang tercantum akan dicabut.',
    revokeRoleTitle: 'Cabut peran dari "{{name}}"?',
    revokeSessions: 'Cabut sesi',
    revokeTitle: 'Cabut sesi "{{name}}"?',
    roleFilter: 'Filter menurut peran',
    roleFilterIncomplete:
      'Pilih cakupan peran dan peran sekaligus, atau hapus filter.',
    save: 'Simpan',
    saved: '"{{name}}" disimpan',
    saving: 'Menyimpan…',
    searchRoles: 'Cari peran',
    selectRoles: 'Pilih peran',
    sessionEnded: 'Sesi Anda telah berakhir. Masuk lagi.',
    signInAgain: 'Masuk lagi',
    status: 'Status',
    total_one: '{{count}} pengguna',
    total_other: '{{count}} pengguna',
    userActionSaved: {
      disable: 'Pengguna "{{name}}" dinonaktifkan',
      enable: 'Pengguna "{{name}}" diaktifkan',
      revokeSessions: 'Sesi aktif "{{name}}" dicabut',
    },
    userSearch: 'Cari nama, nama pengguna, atau email',
    username: 'Nama pengguna',
    users: 'Pengguna',
    usersDescription: 'Kelola akun, akses, dan sesi aktif.',
  },
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
