import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  errors: {
    imapMoveLocationChanged:
      'Folder atau salinan yang dipilih telah berubah. Sinkronkan kotak surat dan buka kembali folder sumber.',
    imapMoveNotWritable:
      'Folder yang dipilih tidak mengizinkan operasi ini. Periksa izin kotak surat.',
    imapMoveSourceRequired:
      'Buka folder sumber sebelum memindahkan atau menghapus pesan ini.',
    imapMoveUnsupported:
      'Server ini tidak dapat memindahkan pesan dengan aman. Gunakan aplikasi email Anda.',
    imapTrashNotFound:
      'Akun ini tidak memiliki folder Sampah. Gunakan aplikasi email Anda.',
    imapMoveOutcomeUnknown:
      'Pemindahan belum selesai atau hasilnya tidak diketahui. Periksa kotak surat sebelum mencoba lagi.',
    invalidRecipient:
      'Perbaiki alamat email dan nama tampilan penerima sebelum mengirim.',
    accessDenied: 'Akses email diperlukan.',
    idempotencyConflict:
      'Kunci idempotensi telah dikaitkan dengan permintaan lain.',
    invalidRequest: 'Permintaan surat tidak valid.',
    accountCredentialsInvalid:
      'Otentikasi kotak surat gagal. Periksa nama login dan kata sandi atau kode otorisasi Anda, dan konfirmasikan bahwa IMAP/SMTP diaktifkan. Gmail dan layanan lainnya mungkin memerlukan kata sandi aplikasi.',
    requestFailed: 'Permintaan surat tidak dapat diselesaikan.',
    providerRateLimited:
      'Layanan surat menerima terlalu banyak permintaan. Coba lagi nanti.',
    providerUnavailable:
      'Layanan surat tidak dapat dihubungi. Coba lagi nanti.',
    reauthorizationRequired:
      'Akun email ini harus dihubungkan kembali sebelum dapat digunakan.',
    syncRunNotFound: 'Sinkronisasi email yang dijalankan tidak ditemukan.',
    messageNotFound: 'Pesan email tidak ditemukan.',
    authorizationStateRequired: 'Status otorisasi surat diperlukan.',
  },
};

export default idID;
