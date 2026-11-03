import type { AccountSwitcherResource } from './en-US.js';

const idID: AccountSwitcherResource = {
  menu: {
    switchAccount: 'Ganti akun',
    search: 'Cari nama atau email',
    loading: 'Memuat akun…',
    empty: 'Tidak ada akun yang cocok',
    more: '{{count}} lainnya. Cari untuk mempersempit daftar.',
    loadFailed: 'Tidak dapat memuat akun.',
  },
  banner: {
    actingAs: 'Bertindak sebagai {{name}}',
    description: 'Perubahan dicatat pada akun ini.',
    return: 'Kembali ke {{name}}',
  },
  errors: {
    switchFailed: 'Tidak dapat mengganti akun. Silakan coba lagi.',
    returnFailed: 'Tidak dapat kembali ke akun Anda. Silakan coba lagi.',
  },
};

export default idID;
