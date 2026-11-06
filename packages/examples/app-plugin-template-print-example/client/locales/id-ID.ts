import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  navTitle: 'Contoh pencetakan templat',
  title: 'Contoh pencetakan templat',
  description:
    'Render template DOCX tetap dengan faktur dan data penawaran resminya sebagai DOCX atau PDF. Konversi PDF memerlukan LibreOffice di server aplikasi.',
  invoiceList: 'Faktur',
  invoiceCount_one: 'Faktur {{count}}',
  invoiceCount_other: 'Faktur {{count}}',
  loading: 'Memuat faktur…',
  empty:
    'Tidak ada faktur yang tersedia dalam cakupan akses penawaran harga Anda.',
  emptyHint:
    'Jalankan tugas database Contoh dan masuk sebagai sales_manager, atau gunakan akun yang dapat melihat Penawaran Penjualan tertaut.',
  loadFailed: 'Tidak dapat memuat faktur.',
  download: 'Unduh DOCX',
  downloading: 'Merender…',
  downloadFailed: 'Tidak dapat merender faktur.',
  invoice: 'Faktur',
  customer: 'Pelanggan',
  issuedOn: 'Dikeluarkan pada',
  quote: 'Kutipan sumber',
  amount: 'Jumlah',
  downloadActions: 'Unduh tindakan',
  downloadPdf: 'Unduh PDF',
  pdfConverterUnavailable:
    'Konversi PDF tidak tersedia karena LibreOffice tidak dapat ditemukan di server aplikasi. Instal di mesin atau kontainer yang sama dengan NocoBase, pastikan proses server dapat dieksekusi, dan mulai ulang aplikasi. Pengunduhan DOCX tetap tersedia.',
  installLibreOffice: 'Unduh LibreOffice',
  retry: 'Coba lagi',
};

export default idID;
