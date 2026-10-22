import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  officePreviewTitle: 'Pratinjau Kantor Lokal',
  officePreviewDescription:
    'Unggah file DOCX, XLSX atau PPTX di bawah, lalu pilih Pratinjau. Dokumen dirender di browser Anda tanpa Office Online atau layanan pratinjau eksternal. Lampiran pesanan menggunakan pratinjau yang sama.',
  officePreviewLimits:
    'Tidak diperlukan koneksi internet saat aplikasi dan layanan file dapat dijangkau di jaringan lokal Anda. Ini bukan mode yang sepenuhnya terputus. File DOC, XLS, PPT, dan OpenDocument lama tetap hanya dapat diunduh dalam contoh ini.',
  title: 'Lampiran',
  description:
    'Unggah satu atau beberapa file dan pratinjau di tempatnya. Catatan disimpan melalui Repositori File API.',
  apiHint:
    'Halaman ini menyimpan aliran repositori mentah: kontrol unggahan memanggil uploadOne untuk satu file dan uploadMany untuk satu batch.',
  retention:
    'Menghapus rekaman hanya akan menghapus metadatanya; objek yang disimpan tetap berada di disk.',
  choose: 'Pilih file',
  uploading: 'Mengunggah…',
  dropHint: 'atau letakkan file di sini',
  tooLarge: 'File melebihi ukuran maksimum',
  rejected: 'Jenis file tidak diperbolehkan',
  uploadFailed: 'Pengunggahan gagal',
  preview: 'Pratinjau',
  download: 'Unduh',
  remove: 'Hapus',
  unlink: 'Hapus dari pesanan',
  empty: 'Belum ada file.',
  close: 'Tutup',
  previous: 'Sebelumnya',
  next: 'Berikutnya',
  loading: 'Memuat…',
  previewUnsupported:
    'Jenis file ini tidak memiliki pratinjau sebaris. Unduh saja.',
  previewFailed: 'File tidak dapat dimuat.',
  navGroup: 'Contoh berkas',
  navAttachments: 'Lampiran',
  navProfiles: 'Avatar profil',
  navOrders: 'Lampiran pesanan',
  profilesTitle: 'Avatar profil (satu-ke-satu)',
  profilesDescription:
    'Sebuah profil memiliki paling banyak satu avatar. Mengunggah avatar baru menggantikan file sebelumnya.',
  profilesRelationHint:
    'Relasi: fileExampleProfiles.avatar adalah relasi hasOne dengan fileExampleProfileAvatars, yang menyimpan profileId unik.',
  noAvatar: 'Tidak ada avatar',
  profilesNoFile: 'Tidak ada file avatar yang terhubung',
  profilesEmpty:
    'Tidak ada profil yang ditemukan. Jalankan benih contoh untuk membuat rekaman demo.',
  uploadAvatar: 'Unggah avatar',
  replaceAvatar: 'Ganti avatar',
  removeAvatar: 'Hapus avatar',
  avatarHint:
    'Pengunggahan menyimpan file dan kemudian menghubungkannya melalui hubungan profil; menghapus hanya menghapus relasi.',
  ordersTitle: 'Lampiran pesanan (satu-ke-banyak)',
  ordersDescription:
    'Suatu pesanan memiliki sejumlah lampiran. Pilih beberapa file sekaligus untuk diunggah sebagai satu batch.',
  ordersRelationHint:
    'Relasi: fileExampleOrders.attachments adalah relasi hasMany ke fileExampleOrderAttachments melalui orderId.',
  ordersNoFiles: 'Tidak ada lampiran pada pesanan ini.',
  ordersEmpty:
    'Tidak ada pesanan yang ditemukan. Jalankan benih contoh untuk membuat rekaman demo.',
  ordersHint:
    'Menghapus lampiran akan menghapus hubungan pesanan. Catatan file tetap tersedia di Repositori File.',
  'status.draft': 'Draf',
  'status.submitted': 'Dikirim',
  'status.archived': 'Diarsipkan',
};

export default idID;
