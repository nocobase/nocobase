import type { MailPagesResource } from './pages.en-US.js';

const pagesIdID: MailPagesResource = {
  navigation: {
    mail: 'Surat',
    mailTeam: 'Surat tim',
    mailAccounts: 'Akun surat',
    mailAccountsDescription:
      'Hubungkan kotak surat Anda dan kelola tanda tangan, templat, dan label.',
    mailSettings: 'Surat',
    mailSettingsDescription:
      'Penyedia surat, status setiap akun, log sinkronisasi dan log pengiriman.',
  },
  access: {
    section: 'Surat',
    team: {
      title: 'Surat tim',
      description: 'Surat anggota yang telah disinkronkan, hanya baca.',
      actions: {
        view: 'Lihat',
        process: 'Proses (tandai telah dibaca, beri bintang, arsipkan)',
      },
    },
    settings: {
      title: 'Surat',
      actions: {
        read: 'Lihat',
        manage:
          'Kelola (coba lagi dan batalkan sinkronisasi serta pengiriman anggota)',
      },
    },
  },
  pages: {
    loading: 'Memuat…',
    empty: 'Tidak ada yang ditampilkan.',
    member: 'Anggota',
    allMembers: 'Semua anggota',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} harus dihubungkan kembali: sampai saat itu, tidak ada sinkronisasi atau pengiriman.',
      reauthorize: 'Hubungkan kembali di Akun surat',
      needsReauthorization: 'perlu otorisasi ulang',
    },
    accounts: {
      title: 'Akun surat',
      description:
        'Hubungkan kotak surat Anda untuk mengirim dan menerima di Surat. Hanya Anda yang dapat melihat surat Anda; orang dengan akses Surat tim dapat membacanya tanpa mengubahnya.',
      reauthorizationNotice:
        'Otorisasi {{addresses}} tidak lagi diterima: tidak ada sinkronisasi atau pengiriman sampai Anda menghubungkannya kembali dengan penyedia yang sama.',
      reauthorize: 'Hubungkan kembali',
      tabs: {
        accounts: 'Akun',
        signatures: 'Tanda tangan',
        templates: 'Templat',
        labels: 'Label',
        activity: 'Aktivitas',
      },
    },
    activity: {
      sends: 'Pengiriman',
      syncs: 'Sinkronisasi',
    },
    logs: {
      started: 'Dimulai',
      time: 'Waktu',
      account: 'Akun',
      accountMember: 'Akun · anggota',
      mode: 'Mode',
      initial: 'Sinkronisasi pertama',
      incremental: 'Inkremental',
      result: 'Hasil',
      allResults: 'Semua hasil',
      detail: 'Detail',
      reason: 'Alasan',
      processed: '{{count}} pesan',
      subject: 'Subjek',
      recipients: 'Penerima',
      recipientCount: 'Penerima',
      bulk: 'Pengiriman massal',
      bulkCount: '{{count}} (massal)',
      scheduled: 'Dijadwalkan',
      retry: 'Coba lagi',
      cancel: 'Batal',
      window: 'Waktu',
      windows: {
        day: '24 jam terakhir',
        week: '7 hari terakhir',
        month: '30 hari terakhir',
        all: 'Sepanjang waktu',
      },
    },
    team: {
      title: 'Surat tim',
      description:
        'Baca surat yang telah disinkronkan anggota, untuk serah terima dan pemeriksaan kepatuhan. Membuka pesan tidak menandainya telah dibaca dan Anda tidak dapat membalas.',
      account: 'Akun',
      allAccounts: 'Semua akun',
      participant: 'Alamat atau @domain',
      keyword: 'Kata kunci subjek',
      memberAccount: 'Anggota · akun',
      counterpart: 'Dengan',
      view: 'Lihat',
      selectAll: 'Pilih semua di halaman ini',
      empty: 'Tidak ada surat tersinkron yang cocok.',
      readOnly: 'Hanya baca. Membukanya tidak menandainya telah dibaca.',
      applied: '{{succeeded}} diperbarui, {{failed}} gagal.',
      actions: {
        markRead: 'Tandai telah dibaca',
        star: 'Beri bintang',
        archive: 'Arsipkan',
      },
    },
    settings: {
      title: 'Surat',
      description:
        'Penyedia surat yang dapat dihubungkan anggota, serta status koneksi, sinkronisasi, dan pengiriman setiap akun. Tidak ada isi pesan yang ditampilkan di sini. Email notifikasi sistem dikonfigurasi di Notifikasi.',
      tabs: {
        providers: 'Penyedia',
        accounts: 'Akun',
        syncRuns: 'Log sinkronisasi',
        submissions: 'Log pengiriman',
        runtime: 'Konfigurasi runtime',
      },
      sources: {
        environment: 'Variabel lingkungan',
        config: 'config.yml',
        default: 'Default',
        code: 'Kode',
      },
      providers: {
        name: 'Nama',
        type: 'Jenis',
        capabilities: 'Kemampuan',
        accounts: 'Akun',
        source: 'Sumber',
        attention: '{{count}} perlu otorisasi ulang',
        howTo: 'Cara menambahkan penyedia',
        howToDescription:
          'Tambahkan entri di bawah mail.providers dalam konfigurasi aplikasi dan simpan rahasia di variabel lingkungan. Mulai ulang aplikasi untuk menerapkannya.',
        callbackHint:
          'Daftarkan URL pengalihan OAuth ini di Google atau Microsoft:',
      },
      accounts: {
        filter: {
          all: 'Semua',
          attention: 'Perlu otorisasi ulang',
          suspended: 'Dinonaktifkan',
        },
        provider: 'Penyedia',
        allProviders: 'Semua penyedia',
        search: 'Anggota atau alamat',
        lastSynced: 'Terakhir disinkronkan',
        status: 'Status',
        showRuns: 'Riwayat sinkronisasi',
        note: 'Administrator tidak dapat mengotorisasi atau menghapus akun anggota. Anggota menghubungkan kembali akunnya sendiri di Pengaturan pribadi › Akun surat.',
      },
      runtime: {
        setting: 'Pengaturan',
        value: 'Nilai saat ini',
        effect: 'Yang dipengaruhi',
        automaticSyncInterval: 'Interval sinkronisasi otomatis',
        automaticSyncIntervalEffect:
          'Seberapa sering akun tanpa pemberitahuan push diperiksa untuk surat baru.',
        syncBatchSize: 'Pesan per batch sinkronisasi',
        syncBatchSizeEffect:
          'Batch yang lebih besar menyelesaikan sinkronisasi pertama lebih cepat, tetapi lebih mudah mencapai batas laju penyedia.',
        oauthCallbackUrl: 'URL pengalihan OAuth',
        oauthCallbackUrlEffect:
          'Daftarkan di konsol pengembang Google atau Microsoft.',
        oauthReturnUrl: 'Halaman setelah otorisasi',
        oauthReturnUrlEffect:
          'Tempat seseorang kembali setelah menghubungkan akun OAuth.',
        pushWebhook: 'Webhook push',
        pushWebhookEffect:
          'Tanpanya, Gmail dan Microsoft 365 juga diperiksa pada interval sinkronisasi.',
        jobs: 'Tugas latar belakang',
        jobsEffect:
          'Deployment dengan beberapa instans memerlukan antrean bersama.',
        logRetention: 'Retensi log',
        logRetentionEffect:
          'Sinkronisasi dan pengiriman yang telah selesai dan lebih lama dari ini dihapus secara otomatis.',
        credentialVault: 'Penyimpanan kredensial',
        credentialVaultEffect:
          'Tempat token OAuth dan kata sandi akun yang terhubung disimpan.',
        minutes: '{{count}} menit',
        days: '{{count}} hari',
        keepForever: 'Disimpan selamanya',
        notConfigured: 'Belum dikonfigurasi',
        secretConfigured: 'Rahasia dikonfigurasi',
        secretMissing: 'Tidak ada rahasia yang dikonfigurasi',
        jobsDefault: 'Mengikuti jobs.default',
        vaultBuiltin: 'Bawaan, di basis data aplikasi',
        vaultApplication: 'Didaftarkan oleh aplikasi',
        copy: 'Salin',
        copied: 'Disalin',
        readOnly:
          'Hanya baca: pengaturan ini berasal dari config.yml dan variabel lingkungan MAIL_* dan berlaku setelah mulai ulang.',
      },
    },
  },
};

export default pagesIdID;
