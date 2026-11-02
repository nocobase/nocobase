import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  errors: {
    promptNotFound: 'Tidak ada pesan dengan identitas ini dalam sesi tersebut.',
    promptStarted: 'Pesan telah mulai diproses dan tidak dapat ditarik.',
    withdrawalUnsupported:
      'Pesan lama ini tidak dapat ditarik dengan aman. Perbarui baris perintah dan mulai ulang koneksi komputer.',
    bridgeReplaced:
      'Bridge lain telah mendaftarkan komputer ini. Mulai ulang koneksi ini.',
    submissionConflict:
      'ID pengiriman ini sudah digunakan untuk permintaan lain.',
    authenticationRequired: 'Masuk untuk menggunakan sesi agen.',
    computerNotFound:
      'Tidak ada komputer dengan id ini yang terhubung ke akun Anda.',
    sessionNotFound: 'Tidak ada sesi dengan id ini yang menjadi milik Anda.',
    computerOffline:
      'Komputer sedang offline. Mulai jembatan di atasnya, lalu coba lagi.',
    agentUnavailable: 'Komputer tidak dapat menjalankan agen ini.',
    directoryNotAllowed:
      'Sesi di komputer ini hanya berfungsi di bawah direktori yang diizinkan oleh jembatannya.',
    sessionArchived: 'Sesi diarsipkan. Pulihkan dulu.',
    permissionRequestNotFound:
      'Permintaan izin ini telah dijawab atau tidak lagi menunggu.',
    choiceNotFound: 'Agen tidak menawarkan pilihan atau nilai ini.',
    linkNotFound:
      'Tidak ada hal semacam ini dengan id ini yang terikat pada sesi, atau pekerjaannya tidak dapat dimulai dari sini.',
    invalidPageToken: 'Token halaman tidak dikeluarkan oleh daftar ini.',
    upgradeRequired:
      'Bridge menggunakan versi protokol lain. Perbarui baris perintah di komputer ini.',
    computerNotAnswering:
      'Komputer tidak menjawab tepat waktu. Periksa apakah koneksinya berjalan, lalu coba lagi.',
    folderUnavailable: 'Folder tidak dapat dibuka di komputer.',
    discoveryFailed:
      'Tidak dapat memuat pengaturan agen. Periksa agen di komputer ini dan coba lagi.',
    projectNotFound:
      'Tidak ada proyek seperti itu, atau Anda tidak dapat melihatnya.',
    referenceNotFound:
      'Sesuatu yang disebutkan tidak ada, atau Anda tidak dapat melihatnya.',
    imageNotFound:
      'Tidak ada gambar dengan nama ini yang dikirim dalam sesi tersebut.',
    computerKeyInvalid:
      'Komputer ini tidak lagi tersambung: telah dihapus, atau tersambung kembali dari tempat lain. Jalankan `acp start` untuk menghubungkannya lagi.',
  },
};

export default idID;
