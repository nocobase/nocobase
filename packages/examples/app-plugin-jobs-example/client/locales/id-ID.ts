import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Contoh jadwal pekerjaan',
    update: 'Aturan memulai dan menghentikan',
  },
  navigation: {
    group: 'Contoh pekerjaan',
    jobs: 'Pekerjaan satu kali saja',
    schedules: 'Jadwal',
  },
  jobs: {
    title: 'Pekerjaan latar belakang',
    description:
      'Setiap pekerjaan menunggu dalam antrian, lalu bekerja selama sepuluh detik dan melaporkan 10% kemajuannya setiap detik. Kemajuan terjadi pada WebSocket saat halaman ini terbuka.',
    create: 'Ciptakan pekerjaan',
    creating: 'Membuat…',
    listTitle: 'Pekerjaanmu',
    count: 'Pekerjaan {{count}}',
    empty: 'Belum ada pekerjaan. Buat satu untuk melihat kemajuannya.',
    loading: 'Memuat…',
    job: 'Pekerjaan {{id}}',
    createdAt: 'Membuat {{time}}',
    attempt: 'Coba {{attempt}}',
    progress: 'Kemajuan',
    live: 'Langsung',
    offline: 'Menghubungkan kembali',
  },
  schedules: {
    title: 'Jadwal',
    description:
      'Aturan berulang pada ScheduleExecutor. Setiap aturan yang dapat dimulai oleh halaman ini ditentukan dalam kode, sehingga pengendalinya didaftarkan sebelum eksekutor memulai — aturan yang dimulai sebelum restart tetap berjalan setelahnya. Perubahan terjadi pada WebSocket saat halaman ini terbuka.',
    listTitle: 'Aturan',
    loading: 'Memuat…',
    start: 'Mulai',
    stop: 'Hentikan',
    builtIn: 'Terpasang',
    every: 'Setiap {{seconds}}',
    cron: 'Cron {{cron}} (UTC)',
    limit: 'paling banyak {{limit}} kali',
    nextRun: 'Selanjutnya dijalankan di {{seconds}}s',
    nextRunDue: 'Proses selanjutnya jatuh tempo sekarang',
    noNextRun: 'Tidak ada lagi yang berjalan',
    firings: '{{count}} berjalan pada instance ini',
    delay: 'terlambat memulai {{ms}} ms',
    noRuns: 'Belum berjalan.',
    live: 'Langsung',
    offline: 'Menghubungkan kembali',
    rule: {
      heartbeat: 'Detak jantung',
      interval: 'Jeda',
      limited: 'Terbatas',
      cron: 'Kron',
    },
    ruleDescription: {
      heartbeat:
        'Plugin menulis aturan ini di setiap permulaan dan tidak pernah menghentikannya.',
      interval:
        'Ganti interval saat sedang berjalan; putaran berikutnya direncanakan dari yang baru.',
      limited:
        'Berakhir dengan sendirinya setelah lima putaran. Mulai lagi untuk lima lagi.',
      cron: 'Berjalan di awal setiap menit.',
    },
    state: {
      active: 'Aktif',
      ended: 'Berakhir',
      stopped: 'Berhenti',
    },
    outcome: {
      running: 'Sedang berjalan',
      succeeded: 'Berhasil',
      failed: 'Gagal',
    },
  },
  status: {
    queued: 'Mengantri',
    running: 'Sedang berjalan',
    completed: 'Selesai',
    failed: 'Gagal',
  },
};

export default idID;
