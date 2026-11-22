import type { SchedulerResource } from './en-US.js';

const idID: SchedulerResource = {
  // Titles the server registers with the authorization catalog, which resolve in this plugin's namespace.
  authorization: { title: 'Tugas terjadwal', read: 'Lihat', manage: 'Kelola' },
  nav: { automation: 'Otomatisasi', schedules: 'Tugas terjadwal' },
  page: {
    title: 'Tugas terjadwal',
    description:
      'Tugas yang didefinisikan plugin dan aplikasi dalam kode dan dijalankan sesuai jadwal. Lihat kapan tugas berjalan dan bagaimana setiap eksekusi berakhir, lalu jeda atau lanjutkan. Aturannya ada di kode; halaman ini tidak dapat membuat atau mengubahnya.',
    loadFailed: 'Tidak dapat memuat tugas terjadwal.',
    retry: 'Coba lagi',
    close: 'Tutup',
    copy: 'Salin',
    copied: 'Disalin',
    loadMore: 'Muat lebih banyak',
    none: '—',
    tabs: { tasks: 'Tugas', runs: 'Eksekusi', config: 'Konfigurasi' },
  },
  tasks: {
    attention: {
      title_one: '{{count}} item perlu perhatian',
      title_other: '{{count}} item perlu perhatian',
      target:
        'Target {{target}} dari “{{title}}” tidak tersedia ({{state}}), sehingga setiap pemicuan dicatat sebagai dilewati.',
      waiting:
        'Eksekusi “{{title}}” yang dimulai {{time}} masih menunggu hasilnya.',
      failed:
        'Eksekusi terakhir “{{title}}” berakhir dengan status {{status}}.',
    },
    stats: {
      total: 'Tugas terjadwal',
      running: 'Aktif',
      attention: 'Perlu perhatian',
      next: 'Eksekusi berikutnya',
      nextOf: 'Eksekusi berikutnya · {{title}}',
    },
    filters: {
      all: 'Semua',
      running: 'Aktif',
      attention: 'Perlu perhatian',
      paused: 'Dijeda',
      removed: 'Dihapus dari kode',
      search: 'Cari berdasarkan nama atau key',
    },
    columns: {
      task: 'Tugas',
      rule: 'Aturan',
      next: 'Eksekusi berikutnya',
      last: 'Eksekusi terakhir',
      totals: 'Total',
      state: 'Status',
      enabled: 'Aktifkan',
    },
    totals: 'Berjalan {{runs}} · berhasil {{succeeded}}',
    noMatch: 'Tidak ada tugas terjadwal yang cocok dengan filter ini.',
    enable: 'Lanjutkan “{{title}}”',
    disable: 'Jeda “{{title}}”',
    toggleFailed: 'Tidak dapat mengubah tugas terjadwal.',
    readOnly:
      'Anda dapat melihat tugas terjadwal, tetapi tidak dapat menjeda atau melanjutkannya.',
    notes: {
      running:
        '“Aktif” hanya berarti tugas diaktifkan dan targetnya ada; hasil setiap eksekusi menunjukkan apakah pekerjaannya berhasil. Total menghitung setiap pemicuan, termasuk yang gagal dan dilewati.',
      pause:
        'Penjedaan hanya memengaruhi eksekusi berikutnya. Pembaruan kode dan penerapan ulang membiarkan sakelar apa adanya.',
      removed:
        '“Dihapus dari kode”: setelah `scheduler sync --finalize`, tugas yang tidak lagi ada di kode ditandai demikian; riwayatnya tetap ada dan tidak dapat dilanjutkan.',
      internal:
        'Pekerjaan latar belakang internal, seperti percobaan ulang notifikasi, sinkronisasi email, pengindeksan pengetahuan, dan pembersihan eksekusi agen, tidak tercantum di sini; plugin masing-masing yang mengelolanya.',
    },
  },
  state: {
    running: 'Aktif',
    paused: 'Dijeda',
    unavailable: 'Target tidak tersedia',
    removed: 'Dihapus dari kode',
  },
  targetState: {
    ready: 'Tersedia',
    disabled: 'Dinonaktifkan',
    missing: 'Tidak ada',
    invalid: 'Konfigurasi tidak valid',
  },
  pause: {
    title: 'Jeda “{{title}}”?',
    description:
      'Tugas tidak lagi berjalan sesuai jadwal sampai seseorang melanjutkannya.',
    running:
      'Eksekusi yang sudah dimulai atau sedang menunggu hasil tidak dibatalkan.',
    missed:
      'Setelah dilanjutkan, tugas berlanjut dari waktu terjadwal berikutnya; eksekusi yang terlewat selama dijeda tidak diganti.',
    redeploy: 'Penerapan ulang tidak melanjutkannya.',
    limit:
      'Untuk tugas dengan batas eksekusi, eksekusi yang sudah berjalan tetap dihitung.',
    cancel: 'Batal',
    confirm: 'Jeda',
  },
  empty: {
    title: 'Belum ada tugas terjadwal',
    description:
      'Tugas terjadwal didefinisikan dalam kode dengan `defineSchedule` oleh plugin atau aplikasi. Pasang plugin yang mendefinisikan tugas terjadwal, atau definisikan satu di aplikasi lalu mulai ulang, dan tugas tersebut akan muncul di sini.',
    internal:
      'Pekerjaan latar belakang internal, seperti percobaan ulang notifikasi, sinkronisasi email, dan pengindeksan pengetahuan, tidak tercantum di sini; pekerjaan tersebut tetap berjalan dengan aturannya sendiri.',
  },
  detail: {
    back: 'Tugas terjadwal',
    notFound: 'Tugas terjadwal ini tidak ada.',
    key: 'Key',
    rule: 'Aturan',
    upcoming: 'Eksekusi berikutnya',
    noUpcoming: 'Tidak ada yang dijadwalkan',
    window: 'Periode · batas eksekusi',
    unlimited: 'Tanpa batas',
    windowFrom: 'sejak {{time}}',
    windowTo: 'hingga {{time}}',
    limit_one: '{{count}} eksekusi',
    limit_other: '{{count}} eksekusi',
    target: 'Target',
    totals: 'Total',
    source: 'Didefinisikan di',
    sourceCode:
      'Kode (`defineSchedule`). Untuk mengubah aturan atau target, ubah kode lalu terapkan ulang.',
    runs: 'Eksekusi',
    noRuns: 'Belum ada eksekusi.',
    runsNote:
      'Eksekusi ditampilkan dari yang terbaru. Konfigurasi target suatu eksekusi tidak pernah dikembalikan atau ditampilkan. Jumlah pengiriman lebih dari 1 berarti eksekusi yang sama dikirim ulang; tetap dihitung sebagai satu eksekusi.',
  },
  runs: {
    allTasks: 'Semua tugas terjadwal',
    groups: {
      all: 'Semua',
      failed: 'Gagal · waktu habis',
      waiting: 'Menunggu hasil',
      skipped: 'Dilewati',
      succeeded: 'Berhasil',
    },
    ranges: {
      day: '24 jam terakhir',
      week: '7 hari terakhir',
      month: '30 hari terakhir',
      quarter: '90 hari terakhir',
    },
    columns: {
      planned: 'Waktu terjadwal',
      task: 'Tugas terjadwal',
      result: 'Hasil',
      reason: 'Alasan · terkait',
      executions: 'Pengiriman',
      duration: 'Durasi',
      summary: 'Ringkasan hasil',
    },
    noRuns: 'Tidak ada eksekusi yang cocok dengan filter ini.',
    notes: {
      order:
        'Eksekusi semua tugas terjadwal, terbaru lebih dulu. Kegagalan, waktu habis, dan penantian lama juga ditampilkan di bagian atas tab Tugas.',
      removed:
        'Tugas yang dihapus dari kode tetap menyimpan riwayatnya di sini.',
    },
  },
  status: {
    pending: 'Dalam antrean',
    running: 'Berjalan',
    waiting: 'Menunggu hasil',
    succeeded: 'Berhasil',
    failed: 'Gagal',
    skipped: 'Dilewati',
    cancelled: 'Dibatalkan',
    timed_out: 'Waktu habis',
    triggered: 'Dipicu (catatan lama)',
  },
  reason: {
    'target-missing': 'Target tidak ada',
    'target-disabled': 'Target dinonaktifkan',
    'target-invalid': 'Konfigurasi target tidak valid',
    'target-not-found': 'Jenis target tidak terdaftar',
    'invalid-config': 'Konfigurasi target tidak valid',
    'dispatch-failed': 'Gagal saat dimulai; lihat log server',
    'observer-failed': 'Gagal memeriksa hasil target',
    'observer-unavailable': 'Target tidak dapat melaporkan hasilnya',
  },
  run: {
    title: '{{title}} · {{time}}',
    timeline: 'Linimasa',
    started: 'Dimulai',
    accepted: 'Diterima oleh target',
    finished: 'Selesai',
    notYet: 'Belum ada hasil',
    executions: 'Pengiriman',
    target: 'Target',
    related: 'Terkait',
    receipt: 'Tanda terima',
    summary: 'Ringkasan hasil',
    reason: 'Alasan',
    waitingNote:
      'Selama eksekusi menunggu hasil, penjadwal menanyakan status kepada target hingga target melaporkan berhasil, gagal, dibatalkan, atau waktu habis. Penjadwal sendiri tidak menetapkan batas waktu; target yang menentukan. Jika eksekusi menunggu lama, buka item terkait untuk melihat progresnya.',
  },
  config: {
    memory:
      'Tugas terjadwal berjalan di memori instans ini: hanya cocok untuk satu instans.',
    memoryHint:
      'Dengan satu instans tidak ada yang perlu diubah; untuk menjalankan beberapa, ikuti “Beralih ke Redis” di bawah.',
    shared:
      'Tugas terjadwal berjalan di {{adapter}}: beberapa instans dapat menjalankannya.',
    columns: {
      setting: 'Pengaturan',
      value: 'Nilai saat ini',
      effect: 'Pengaruh pada tugas terjadwal',
      source: 'Sumber',
    },
    sources: {
      environment: 'Variabel lingkungan',
      config: 'config.yml',
      default: 'Bawaan',
      backend: 'Ditentukan oleh backend',
    },
    rows: {
      configuration: 'Konfigurasi jobs',
      backend: 'Backend',
      multiInstance: 'Beberapa instans',
      concurrency: 'Konkurensi',
      attempts: 'Percobaan',
      connection: 'Koneksi',
    },
    builtIn: 'memory bawaan',
    selectedByScheduler:
      'Dipilih oleh `scheduler.jobs` (`SCHEDULER_JOBS`) khusus untuk tugas terjadwal.',
    selectedByDefault:
      '`scheduler.jobs` tidak diatur, sehingga tugas terjadwal mengikuti `jobs.default`.',
    selectedByBuiltIn:
      '`scheduler.jobs` maupun `jobs.default` tidak diatur, sehingga bawaan internal yang berlaku.',
    memoryBackend: 'memory (instans ini)',
    memoryEffect:
      'Aturan berada di memori proses ini dan ditulis ke {{path}} saat proses berhenti secara normal.',
    sharedEffect:
      'Aturan berada di {{adapter}}, digunakan bersama oleh semua instans.',
    plugin: '{{plugin}} terdaftar',
    supported: 'Didukung',
    unsupported: 'Tidak didukung',
    multiSupported:
      'Setiap pemicuan berjalan di satu instans; saat sebuah instans mogok, eksekusi sesekali dapat dikirim ulang.',
    multiUnsupported:
      'Setiap instans menjalankan setiap tugas terjadwal sendiri, sehingga tugas yang sama berjalan beberapa kali.',
    concurrencyEffect_one:
      'Satu eksekusi dalam satu waktu; eksekusi yang lambat membuat eksekusi lain yang jatuh tempo menunggu.',
    concurrencyEffect_other:
      'Hingga {{count}} eksekusi sekaligus; sisanya menunggu dalam antrean.',
    attemptsOk: 'Benar',
    attemptsWarn: 'Seharusnya 1',
    attemptsEffect:
      'Eksekusi yang gagal dicatat sebagai gagal dan tugas berjalan lagi pada waktu berikutnya; biarkan nilai ini 1.',
    attemptsWarnEffect:
      'Eksekusi yang gagal sudah tercatat, sehingga percobaan ulang eksekusi yang sama tidak berpengaruh; atur percobaan ke 1.',
    connectionValue: '{{connection}} · namespace {{namespace}}',
    namespaceOnly: 'namespace {{namespace}}',
    connectionEffect: 'Kata sandi tidak pernah ditampilkan.',
    redis: {
      title: 'Beralih ke Redis (untuk beberapa instans)',
      step1:
        'Pasang plugin komersial `@nocobase/app-plugin-jobs-redis` dan daftarkan di setiap instans.',
      step2:
        'Tambahkan backend Redis ke `config.yml` dan arahkan tugas terjadwal ke backend tersebut (cuplikan di bawah).',
      step3:
        'Terapkan ulang setiap instans, lalu kembali dan periksa bahwa “Beberapa instans” menunjukkan Didukung.',
      warning:
        'Jika namanya salah, plugin tidak terdaftar, atau Redis tidak dapat dijangkau, aplikasi tidak akan berjalan; aplikasi tidak pernah kembali ke memory.',
    },
    removed: {
      title: 'Tugas terjadwal yang dihapus dari kode',
      consistent: 'Konsisten, tidak ada yang perlu dilakukan.',
      consistentHint:
        'Saat tugas terjadwal dihapus dari kode dan diterapkan, tugas tersebut tercantum di sini beserta cara membersihkannya.',
      warning_one:
        '{{count}} tugas terjadwal tidak lagi ada di kode versi ini tetapi belum dibersihkan.',
      warning_other:
        '{{count}} tugas terjadwal tidak lagi ada di kode versi ini tetapi belum dibersihkan.',
      warningHint:
        'Tugas tersebut tidak berjalan saat jatuh tempo (log menampilkan “A schedule fired that this instance has no definition for”), tetapi daftar tugas tetap menampilkannya seperti biasa.',
      columns: {
        task: 'Tugas terjadwal',
        last: 'Eksekusi terakhir',
        after: 'Setelah dibersihkan',
      },
      after:
        'Ditandai “Dihapus dari kode”, tidak pernah dipicu lagi, riwayat tetap disimpan.',
      neverRan: 'Belum pernah berjalan',
      how: 'Cara membersihkan',
      howHint:
        'Setelah semua instans menjalankan versi baru, jalankan ini sekali di server mana pun:',
      why: 'Mengapa tidak otomatis: selama penerapan bertahap, versi lama dan baru berjalan berdampingan, dan pembersihan otomatis dapat menghapus tugas yang masih digunakan versi lama.',
      full: 'Jalankan hanya pada build lengkap yang menyertakan semua plugin; jika tidak, tugas dari plugin yang tidak dimuat juga akan ditandai sebagai dihapus.',
    },
    readOnly:
      'Halaman ini hanya-baca: pengaturan ini berada di konfigurasi aplikasi dan berlaku saat penerapan ulang. Cache, antrean, dan layanan lain dibahas di pengaturan klaster dan terdistribusi.',
  },
  cron: {
    everyMinute: 'Setiap menit',
    everyMinutes: 'Setiap {{count}} menit',
    everyHour: 'Setiap jam pada menit {{minute}}',
    everyHours: 'Setiap {{count}} jam',
    daily: 'Setiap hari pukul {{time}}',
    weekdays: 'Setiap hari kerja pukul {{time}}',
    weekly: 'Setiap {{day}} pukul {{time}}',
    monthly: 'Tanggal {{day}} setiap bulan pukul {{time}}',
  },
};

export default idID;
