import type { FileUiResource } from './en-US.js';
const messages = {
  'files.ooxmlLoadFailed': 'Tidak dapat merender file Office Open XML ini.',
  'files.ooxmlLoadTimedOut':
    'Pratinjau tidak selesai dimuat dalam waktu {{minutes}} menit.',
  'files.previewRequestFailed': 'Permintaan pratinjau gagal ({{status}}).',
  uploadFailed: 'Pengunggahan file gagal.',
  fileLimitReached: 'Jumlah maksimum file telah tercapai.',
  fileTooLarge: 'File melebihi ukuran maksimum.',
  fileTypeNotAllowed: 'Jenis file tidak diperbolehkan.',
  removalFailed: 'Penghapusan file gagal.',
  urlNotAllowed: 'File URL tidak diperbolehkan.',
  downloadFailed: 'Pengunduhan file gagal.',
  invalidUrl: 'File URL hilang atau tidak diizinkan.',
  pdfPreviewFailed: 'Tidak dapat memuat pratinjau PDF.',
  pdfPreviewMarkup: 'File URL mengembalikan HTML atau XML, bukan PDF.',
  previewFailed: 'Tidak dapat memuat pratinjau file.',
  'files.empty': 'Tidak ada file.',
  'files.preview': 'Pratinjau',
  'files.download': 'Unduh',
  'files.remove': 'Hapus',
  'files.chooseMany': 'Pilih file',
  'files.chooseOne': 'Pilih berkas',
  'files.retry': 'Coba lagi',
  'files.done': 'Selesai',
  'files.uploading': 'Mengunggah',
  'files.failed': 'Gagal',
  'files.pending': 'Tertunda',
  'files.previous': 'Berkas sebelumnya',
  'files.next': 'Berkas selanjutnya',
  'files.loadingPreview': 'Memuat pratinjau...',
  'files.downloadFile': 'Unduh berkas',
  'files.previewUnavailable': 'Pratinjau tidak tersedia untuk jenis file ini.',
  'files.imageFailed':
    'Gambar ini tidak dapat ditampilkan. Mungkin rusak atau dalam format yang tidak didukung.',
  'files.officeFailed': 'Office Online tidak dapat memuat file ini.',
  'files.officeUrl':
    'Office Online memerlukan file absolut URL yang dapat diakses internet.',
  'files.cancelFile': 'Batalkan {{filename}}',
  'files.status.uploading': 'Mengunggah',
  'files.status.pending': 'Tertunda',
  'files.status.error': 'Gagal',
};

const resource: FileUiResource = { fileUi: messages };
export default resource;
