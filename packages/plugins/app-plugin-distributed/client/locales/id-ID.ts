import type { DistributedResource } from './en-US.js';

const idID: DistributedResource = {
  nav: {
    title: 'Klaster dan terdistribusi',
    description:
      'Backend apa saja yang digunakan instans ini, dan apakah aplikasi dapat berjalan di beberapa instans.',
  },
  page: {
    description:
      'Agar dapat berjalan di beberapa server atau proses, cache, kunci, tugas latar belakang, antrean, pesan realtime, dan pembuatan ID harus menggunakan backend bersama. Halaman ini menampilkan backend yang benar-benar dipilih oleh instans ini beserta asal setiap pengaturan, dan memeriksa apakah aplikasi dapat berjalan dengan aman di beberapa instans. Pengaturan berada di konfigurasi aplikasi; deploy ulang setelah mengubahnya.',
    loading: 'Memuat…',
    loadFailed: 'Status tidak dapat dimuat.',
    retry: 'Coba lagi',
  },
  summary: {
    single: 'Instans tunggal',
    singleCaption: 'Konfigurasi saat ini cocok untuk satu instans',
    shared: '{{shared}} / {{total}}',
    sharedCaption: 'layanan dibagikan',
    requiredCaption: 'wajib diperbaiki',
    recommendedCaption: 'disarankan',
  },
  sections: {
    scale: 'Dapatkah berjalan di beberapa instans',
    services: 'Layanan bersama',
    idGeneration: 'Pembuatan ID',
    checklist: 'Sebelum go-live',
    notes: 'Catatan',
  },
  level: {
    required: 'Wajib',
    recommended: 'Disarankan',
    ok: 'OK',
  },
  singleHint:
    'Menjalankan satu instans tidak memerlukan perubahan. Untuk menskalakan: siapkan Redis dan database PostgreSQL atau MySQL bersama → instal plugin Redis yang diperlukan → ubah konfigurasi → verifikasi dengan dua instans.',
  fix: 'Cara memperbaiki',
  table: {
    service: 'Layanan',
    backend: 'Backend terpilih',
    sharing: 'Cakupan',
    plugin: 'Plugin Redis',
    source: 'Sumber',
    adapter: 'Adaptor',
  },
  services: {
    caching: {
      name: 'Cache',
      usage: 'Status masuk, izin, cache konfigurasi',
    },
    concurrency: {
      name: 'Kunci konkurensi',
      usage: 'Migrasi, penomoran, idempotensi',
    },
    jobs: {
      name: 'Tugas latar belakang',
      usage: 'Tugas terjadwal, pengindeksan pengetahuan',
    },
    queue: { name: 'Antrean', usage: 'Pengiriman notifikasi' },
    realtime: {
      name: 'Pesan realtime',
      usage: 'Kotak masuk, status kehadiran',
    },
  },
  sharing: {
    shared: 'Dibagikan antarinstans',
    local: 'Hanya instans ini',
    unknown: 'Tidak dideklarasikan',
  },
  source: { configured: 'Dikonfigurasi', default: 'Bawaan' },
  notSet: '(tidak diatur)',
  unavailable: 'Tidak digunakan oleh aplikasi ini',
  unregistered: 'Adaptor tidak terdaftar',
  selections: 'Dipilih berdasarkan nama',
  selection: '{{consumer}} → {{backend}}',
  howToChange: 'Cara mengubah',
  howToChangeIntro:
    'Instal plugin Redis untuk setiap layanan, daftarkan plugin servernya, lalu pilih di konfigurasi:',
  idGeneration: {
    mode: 'Mode',
    modeHint:
      'Dengan beberapa instans, tetapkan worker ID secara otomatis agar setiap instans mendapat miliknya sendiri.',
    auto: 'Otomatis · satu worker ID per instans',
    manual: 'Manual · workerId {{workerId}}',
  },
  checklist: {
    intro:
      'Halaman ini tidak dapat memeriksa hal-hal berikut sendiri. Pastikan dengan mencobanya pada dua instans:',
    files: 'Berkas yang diunggah di instans A dapat diunduh dari instans B',
    realtime:
      'Pesan yang dibuat di A sampai secara realtime ke pengguna yang terhubung ke B, dan tidak ada yang hilang setelah terhubung kembali',
    queue:
      'Tugas yang dimasukkan ke antrean di A dapat diproses oleh B, dan percobaan ulang tidak mengulang efek samping',
    secrets:
      'Setiap instans menggunakan secrets.keys yang sama, dan status masuk berlaku di semua instans',
    websocket:
      'Load balancer meneruskan koneksi WebSocket dan sesuai dengan path dan domain aplikasi',
  },
  notes: {
    current:
      'Halaman ini hanya menampilkan instans yang sedang Anda hubungi. Halaman ini tidak dapat mengetahui apakah instans lain dikonfigurasi dengan cara yang sama; deploy semuanya dari satu konfigurasi.',
    noTest:
      'Tidak ada “Uji koneksi”: plugin Redis terhubung saat aplikasi dimulai, dan aplikasi tidak akan dimulai jika koneksi gagal. Kesalahan koneksi saat berjalan muncul di log.',
    instances:
      'Daftar instans yang berjalan hanya muncul dengan worker ID otomatis, yang disediakan oleh plugin komersial.',
  },
  checks: {
    database: {
      sqlite: {
        title: 'Database',
        detail:
          'SQLite hanya melayani satu instans. Beberapa instans memerlukan PostgreSQL atau MySQL.',
        fix: 'Pindahkan data ke PostgreSQL atau MySQL dan arahkan koneksi database utama ke sana.',
      },
      shared: {
        title: 'Database',
        detail: '{{dialect}}: setiap instans terhubung ke database yang sama.',
      },
    },
    service: {
      unregistered: {
        title: '{{service}}',
        detail:
          '{{configPath}} memilih adaptor “{{adapter}}”, yang tidak disediakan oleh plugin terdaftar mana pun. Layanan akan gagal saat pertama kali digunakan.',
        fix: 'Instal dan daftarkan plugin yang menyediakan “{{adapter}}”, atau pilih backend lain.',
      },
      local: {
        title: '{{service}} masih lokal di instans ini',
        detail:
          'Setiap instans menyimpan statusnya sendiri. Instal {{plugin}} dan atur {{configPath}} ke backend Redis.',
        fix: 'Instal {{plugin}}, daftarkan plugin servernya, lalu pilih:',
      },
      selectionLocal: {
        title: '{{service}}',
        detail:
          '{{consumer}} secara eksplisit menggunakan backend “{{backend}}”, yang lokal di instans ini.',
      },
    },
    services: {
      local: {
        title: 'Cache, kunci, tugas latar belakang, antrean, pesan realtime',
        detail: 'Semuanya lokal di instans ini: {{services}}.',
      },
    },
    files: {
      local: {
        title: 'Penyimpanan berkas',
        detail:
          'Berkas di {{collections}} berada di disk host ini; instans lain tidak dapat membacanya.',
        fix: 'Gunakan penyimpanan bersama seperti S3 untuk koleksi berkas ini, dan pindahkan berkas yang sudah ada ke sana.',
      },
      defaultLocal: {
        title: 'Penyimpanan berkas',
        detail:
          'Penyimpanan bawaan menyimpan berkas di disk host ini; instans lain tidak dapat membacanya.',
        fix: 'Atur penyimpanan bawaan ke penyimpanan bersama seperti S3.',
      },
      shared: {
        title: 'Penyimpanan berkas',
        detail:
          'Tidak ada koleksi berkas yang menyimpan berkas di disk host ini.',
      },
    },
    idGeneration: {
      auto: {
        title: 'Pembuatan ID',
        detail:
          'Ditetapkan otomatis: setiap instans mendapat worker ID sendiri.',
      },
      manual: {
        title: 'Pembuatan ID',
        detail:
          'Worker ID manual {{workerId}}. Dua instans dengan worker ID yang sama dapat menghasilkan ID yang sama.',
        fix: 'Berikan setiap instans SNOWFLAKE_WORKER_ID sendiri, atau instal plugin yang menetapkan worker ID secara otomatis.',
      },
    },
    secrets: {
      set: {
        title: 'Rahasia',
        detail:
          'secrets.keys sudah diatur. Pastikan setiap instans menggunakan kunci yang sama.',
      },
      missing: {
        title: 'Rahasia',
        detail:
          'secrets.keys belum diatur. Setiap instans memerlukan kunci yang sama untuk membaca data yang dienkripsi oleh instans lain.',
        fix: 'Buat kunci dengan openssl rand -hex 32 dan atur di setiap instans.',
      },
    },
    publicOrigin: {
      set: { title: 'Alamat publik', detail: 'app.publicOrigin = {{origin}}' },
      missing: {
        title: 'Alamat publik',
        detail:
          'app.publicOrigin belum diatur. Di belakang load balancer, tautan dan callback memerlukan alamat publik.',
        fix: 'Atur app.publicOrigin ke alamat yang dibuka pengguna.',
      },
    },
    checkFailed: {
      title: 'Sebuah pemeriksaan tidak dapat dijalankan',
      detail: 'Pemeriksaan “{{check}}” gagal; lihat log.',
    },
  },
};

export default idID;
