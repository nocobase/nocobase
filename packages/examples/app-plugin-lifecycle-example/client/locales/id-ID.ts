import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  navigation: {
    parameters: 'Parameter waktu proses',
    group: 'Alur kerja',
    tickets: 'Meja bantuan',
    expenses: 'Laporan pengeluaran',
    invoices: 'Faktur elektronik',
    orders: 'Pembayaran pesanan',
    exports: 'Ekspor data',
    purchases: 'Penjualan kilat',
    fulfilments: 'Pengiriman',
    subscriptions: 'Langganan',
  },
  parameters: {
    fields: {
      paymentWindowMinutes: {
        title: 'Batas waktu pembayaran (menit)',
        description:
          'Batalkan pesanan yang belum dibayar setelah penantian ini. Perubahan berlaku pada waktu pembayaran yang baru dijadwalkan; pengatur waktu yang ada menjaga waktu jatuh temponya.',
      },
      escalateAfterMinutes: {
        title: 'Batas waktu peninjauan manajer (menit)',
        description:
          'Tingkatkan peninjauan manajer yang tertunda setelah penantian ini. Perubahan berlaku pada waktu peninjauan yang baru dijadwalkan; pengatur waktu yang ada menjaga waktu jatuh temponya.',
      },
      waitMinutes: {
        title: 'Batas waktu balasan pelanggan (menit)',
        description:
          'Tutup tiket jika pelanggan tidak membalas dalam waktu tunggu ini. Perubahan berlaku untuk pengatur waktu yang baru dijadwalkan; pengatur waktu yang ada menjaga waktu jatuh temponya.',
      },
      querySeconds: {
        title: 'Penundaan permintaan status faktur (detik)',
        description:
          'Tanyakan kepada penyedia faktur jika tidak ada panggilan balik dalam waktu tunggu ini. Perubahan berlaku untuk kueri yang baru dijadwalkan; kueri yang ada mempertahankan waktunya.',
      },
      pollSeconds: {
        title: 'Interval pemeriksaan kemajuan ekspor (detik)',
        description:
          'Tunggu selama ini sebelum memeriksa ekspor yang sedang berlangsung. Perubahan berlaku untuk pemeriksaan yang baru dijadwalkan; cek yang ada tetap sesuai dengan waktunya.',
      },
      maxMinutes: {
        title: 'Batas waktu penyelesaian ekspor (menit)',
        description:
          'Tetapkan batas waktu penyelesaian saat tugas ekspor dimulai. Pekerjaan yang belum selesai akan habis waktunya pada tenggat waktu tersebut. Perubahan tidak menggeser tenggat waktu pekerjaan yang ada.',
      },
      periodMinutes: {
        title: 'Periode perpanjangan langganan (menit)',
        description:
          'Gunakan durasi ini untuk menghitung akhir periode baru setelah tagihan berhasil. Perubahan berlaku setelah tagihan berikutnya berhasil; akhir periode saat ini tetap.',
      },
      dunningMinutes: {
        title:
          'Interval percobaan ulang pembayaran perpanjangan yang gagal (menit)',
        description:
          'Tunggu selama ini sebelum mencoba kembali pembayaran perpanjangan yang gagal. Perubahan berlaku pada percobaan ulang yang baru dijadwalkan; percobaan ulang yang ada mempertahankan waktu jatuh temponya.',
      },
      maxDunning: {
        title: 'Batas kegagalan pembayaran pembaruan',
        description:
          'Batalkan langganan pada percobaan ulang otomatis berikutnya jika jumlah pembayaran yang gagal telah mencapai batas ini. Perubahan berlaku pada keputusan percobaan ulang berikutnya.',
      },
      reopenDays: {
        title: 'Batas waktu pembukaan kembali tiket (hari)',
        description:
          'Izinkan pembukaan kembali dalam beberapa hari setelah tiket ditutup; jika tidak, diperlukan tiket baru. Setiap permintaan pembukaan kembali menggunakan pengaturan terbaru.',
      },
    },
    loading: 'Memuat parameter…',
    title: 'Parameter waktu proses',
    description:
      'Ubah hanya nilai yang dideklarasikan kode. Struktur alur kerja, keputusan, dan batas waktu tetap dalam kode.',
    ruleExplanation:
      'Semua kondisi dalam satu grup harus sesuai. Grup terpisah ditambahkan bersama. Tempatkan pengguna alternatif dalam grup terpisah.',
    allConditions: 'Cocokkan semua kondisi ini',
    alsoInclude: 'Sertakan juga',
    selectionType: 'Jenis pemilihan',
    searchReference: 'Cari berdasarkan nama',
    noMatches: 'Tidak ada referensi yang cocok',
    previousPage: 'Halaman sebelumnya',
    nextPage: 'Halaman selanjutnya',
    reference: 'Referensi',
    remove: 'Hapus',
    addCondition: 'Tambahkan kondisi',
    addGroup: 'Sertakan juga kelompok lain',
    revision: 'Revisi {{revision}}',
    codeDefaults: 'Kode default',
    databaseVersion: 'Konfigurasi tersimpan',
    snapshotEffect:
      'Cuplikan: diperbaiki pada pengiriman pertama; disimpan setelah pengembalian atau penarikan',
    liveEffect:
      'Pembacaan parameter di masa mendatang menggunakan konfigurasi terbaru; pengatur waktu dan tenggat waktu yang ada tetap.',
    yes: 'Ya',
    no: 'Tidak',
    invalidObject: 'Masukkan objek JSON yang valid.',
    saved: 'Konfigurasi disimpan.',
    conflict:
      'Revisinya berubah. Masukan Anda telah disimpan; tinjau nilai saat ini sebelum mencoba lagi.',
    currentRevision: 'Revisi tersimpan saat ini: {{revision}}',
    keepDraft: 'Simpan masukan saya dan gunakan revisi ini',
    save: 'Simpan nilai',
    readOnly:
      'Anda dapat membaca nilai-nilai ini tetapi tidak dapat mengubahnya.',
    preview: 'Pratinjau kandidat Lin',
    candidates: 'Kandidat',
    noCandidates:
      'Tidak ada kandidat yang memenuhi syarat; pengajuan akan ditolak.',
    editCurrent: 'Edit konfigurasi saat ini',
    historyBoundary:
      'Ini mengedit konfigurasi saat ini. Fakta sejarah dan kandidat yang ditugaskan tetap tidak berubah.',
    history: 'Penggunaan parameter sebenarnya',
    effectivePreview: 'Nilai efektif untuk catatan ini sekarang',
    firstSnapshot: 'Cuplikan pengiriman pertama',
    notRecorded: 'Tidak tercatat',
    diagramEntry: 'Entri diagram opsional',
    diagramHint:
      'Klik simpul terikat atau transisi untuk membuka editor bersama. Entri tidak terikat menunjukkan detail aslinya. Mengklik tidak pernah menjalankan transisi.',
    workflow: 'Alur kerja',
    types: {
      department: 'Departemen',
      role: 'Peran',
      user: 'Orang',
    },
  },
  invoices: {
    title: 'Faktur elektronik',
    list: 'Faktur',
    new: 'Faktur baru',
    empty: 'Tidak ada faktur di sini.',
    pick: 'Pilih faktur untuk mengikuti penerbitannya.',
    description:
      'Faktur pesanan sandbox yang telah selesai. Tunggu webhook platform; kueri setelah {{seconds}} detik tanpa satu pun. Penyerahan dicoba hingga 3 kali.',
    shows:
      'Pengiriman, panggilan balik, kueri batas waktu, dan percobaan ulang berbagi satu permintaan penyedia. Pemberitahuan berulang berlaku satu kali, dan percobaan ulang tidak akan pernah mengeluarkan faktur kedua.',
    orderSummary: 'Pesan #{{order}} · {{amount}}',
    fields: {
      order: 'Pesanan selesai',
      customer: 'Pelanggan',
      amount: 'Jumlah',
      taxNumber: 'Nomor pajak',
      request: 'Permintaan penyedia',
      number: 'Nomor faktur',
      queries: 'Pertanyaan',
    },
    actions: {
      submit: 'Minta faktur',
      retryInvoice: 'Coba lagi faktur',
    },
    form: {
      title: 'Minta faktur elektronik',
      ordersHint:
        'Pilih perintah demonstrasi yang telah selesai. Setiap pesanan hanya dapat memiliki satu faktur.',
      order: 'Pesanan #{{order}} · {{customer}} · {{amount}} · Selesai',
      invoiceTitle: 'Judul faktur',
      failSubmissions: 'Pengiriman yang gagal dengan sengaja',
      failHint:
        'Atur 1 atau 2 untuk melihat percobaan ulang otomatis; 3 perhentian pada masalah gagal. Coba lagi faktur lalu pulihkan.',
      submit: 'Buat',
    },
    banner: {
      draft: 'Belum diminta.',
      submitting: 'Mengirimkan permintaan; kegagalan dicoba lagi…',
      awaiting: 'Menunggu webhook platform; menanyakan di {{time}}.',
      querying: 'Menanyakan platform faktur…',
      issued: 'Faktur diterbitkan. PDF demonstrasi sudah siap.',
      failed:
        'Masalah gagal: {{error}} Anda dapat mencoba kembali faktur tersebut.',
    },
    outside: {
      title: 'Platform faktur (kotak pasir)',
      description:
        'Simulasikan platform eksternal yang menyelesaikan permintaan dan mengirimkan webhooknya. Tidak ada sistem perpajakan nyata yang terhubung.',
      result: 'Hasil platform',
      hint: 'Tahan webhook dan berhasil diterbitkan: faktur masih menunggu, lalu menanyakan hasilnya setelah 30 detik. Pengiriman event lama setelahnya tidak bisa dikeluarkan lagi.',
      issue: 'Edisi berhasil',
      fail: 'Tolak faktur',
      download: 'Unduh contoh PDF',
      pdfHint:
        'File tersebut bertuliskan SANDBOX INVOICE dan bukan merupakan faktur pajak yang valid.',
    },
  },
  identity: {
    label: 'Masuk sebagai',
  },
  roles: {
    agent: 'Agen pendukung',
    customer: 'Pelanggan',
    applicant: 'Karyawan',
    manager: 'Manajer',
    director: 'Eksekutif',
    finance: 'Keuangan',
  },
  common: {
    signedInUser: 'Pengguna yang masuk',
    system: 'Sistem',
    unassigned: 'Belum ditugaskan',
    loading: 'Memuat…',
    cancel: 'Batal',
    close: 'Tutup',
    demoOptions: 'Opsi demo',
  },
  tickets: {
    title: 'Meja bantuan',
    agentDescription:
      'Ambil tiket baru, balas pelanggan, dan selesaikan. Tiket yang menunggu pelanggan akan menutup sendiri ketika mereka tetap diam, dan balasan dari pelanggan akan mengembalikannya ke penerima haknya.',
    customerDescription:
      'Minta bantuan tim dukungan dan ikuti percakapannya. Tiket yang ditutup dapat dibuka kembali selama {{days}} hari.',
    queue: 'Antrean tiket',
    mine: 'Tiket saya',
    newTicket: 'Tiket baru',
    empty: 'Tidak ada tiket di sini.',
    pick: 'Pilih tiket untuk membaca percakapan.',
    filters: {
      all: 'Semua',
      new: 'Baru',
      open: 'Buka',
      awaitingCustomer: 'Menunggu',
      closed: 'Tertutup',
    },
    form: {
      title: 'Hubungi dukungan',
      subject: 'Subjek',
      subjectPlaceholder: 'Ringkaslah masalah dalam sebuah kalimat',
      category: 'Kategori',
      priority: 'Prioritas',
      description: 'Deskripsi',
      descriptionPlaceholder:
        'Apa yang terjadi, apa yang Anda harapkan, dan langkah-langkah untuk mereproduksinya',
      failNotifications: 'Pengiriman email yang gagal dengan sengaja',
      failHint:
        'Setiap balasan tiket ini mengirimkan email kepada Anda. Buat percobaan pertama gagal untuk melihat efeknya coba lagi.',
      submit: 'Kirim tiket',
    },
    categories: {
      account: 'Akun & masuk',
      billing: 'Penagihan',
      howto: 'Bagaimana caranya…',
      incident: 'Ada yang rusak',
    },
    priorities: {
      low: 'Rendah',
      normal: 'Biasa',
      high: 'Tinggi',
      urgent: 'Mendesak',
    },
    meta: {
      customer: 'Pelanggan',
      category: 'Kategori',
      priority: 'Prioritas',
      assignee: 'Penerima tugas',
      created: 'Dibuat',
    },
    banner: {
      new: 'Menunggu agen mengambilnya.',
      open: '{{assignee}} sedang mengerjakannya.',
      awaiting:
        'Menunggu pelanggan. Menutup secara otomatis di {{time}} tanpa balasan.',
      overdue: 'Penantian telah berakhir; sapuan berikutnya menutupnya.',
      resolved: 'Diselesaikan dengan dukungan.',
      timeout: 'Ditutup secara otomatis: pelanggan tidak membalas tepat waktu.',
      reopenUntil: 'Anda dapat membukanya kembali hingga {{date}}.',
      reopenExpired: 'Tidak dapat dibuka kembali; silakan buka tiket baru.',
    },
    thread: {
      wrote: '{{name}} · {{time}}',
      accept: '{{actor}} mengambil tiketnya',
      resolve: '{{actor}} menandainya terselesaikan',
      autoClose: 'Ditutup secara otomatis setelah menunggu {{minutes}} menit',
      reopen: '{{actor}} membuka kembali tiket',
      delivery: {
        queued: 'Email ke pelanggan yang mengantri',
        running: 'Mengirim email ke pelanggan…',
        succeeded: 'Diemail ke pelanggan',
        failed: 'Email gagal setelah upaya {{attempts}}: {{error}}',
        retrying: 'Upaya email {{attempts}} gagal, mencoba lagi: {{error}}',
      },
    },
    composer: {
      agentPlaceholder: 'Balasan ke pelanggan…',
      customerPlaceholder: 'Tambahkan balasan…',
      reopenPlaceholder: 'Beritahu kami apa yang masih salah…',
      reply: 'Kirim balasan',
      accept: 'Ambil tiket',
      resolve: 'Markus terselesaikan',
      customerReply: 'Kirim',
      reopen: 'Buka kembali',
      nothing: 'Tidak ada yang bisa Anda lakukan pada tiket ini sekarang.',
    },
  },
  expenses: {
    title: 'Laporan pengeluaran',
    applicantDescription:
      'Klaim pengeluaran bisnis. Hingga {{auto}} disetujui secara otomatis; di atas yang disetujui manajer Anda, dan di atas {{finance}} juga direktur keuangan.',
    approverDescription:
      'Laporan menunggu persetujuan Anda. Laporan yang Anda tinggalkan selama {{minutes}} menit diteruskan ke manajer Anda sendiri.',
    finalApproverDescription: 'Laporan menunggu persetujuan Anda.',
    mine: 'Laporan saya',
    approvals: 'Menungguku',
    newReport: 'Laporan baru',
    empty: 'Tidak ada laporan di sini.',
    emptyApprovals: 'Tidak ada yang menunggu persetujuan Anda.',
    pick: 'Pilih laporan untuk melihatnya.',
    number: 'Laporkan {{id}}',
    editor: {
      title: 'Tujuan',
      titlePlaceholder: 'Misalnya: Pameran dagang Shanghai, Oktober',
      purpose: 'Detail',
      purposePlaceholder:
        'Siapa yang pergi, mengapa, dan apa saja yang harus diketahui oleh pemberi persetujuan',
      items: 'Biaya',
      date: 'Tanggal',
      category: 'Kategori',
      description: 'Deskripsi',
      amount: 'Jumlah (¥)',
      addItem: 'Tambahkan biaya',
      removeItem: 'Hapus',
      total: 'Jumlah',
      failPayments: 'Upaya pembayaran yang gagal dengan sengaja',
      failHint:
        'Laporan yang disetujui dibayar dengan efek. Buat percobaan pertama gagal untuk menontonnya coba lagi.',
      save: 'Simpan draf',
      saved: 'Tersimpan.',
      submit: 'Kirim untuk persetujuan',
      resubmit: 'Kirim ulang',
    },
    categories: {
      transport: 'Transportasi',
      lodging: 'Penginapan',
      meals: 'Makanan',
      office: 'Perlengkapan kantor',
      entertainment: 'Hiburan klien',
      other: 'Lainnya',
    },
    steps: {
      submit: 'Dikirim',
      manager: 'Manajer',
      finance: 'Keuangan',
      payment: 'Dibayar',
    },
    meta: {
      applicant: 'Pemohon',
      approver: 'Menunggu',
      created: 'Dibuat',
      paymentRef: 'Referensi pembayaran',
      total: 'Jumlah',
    },
    banner: {
      draft:
        'Draf. Hanya Anda yang dapat melihatnya sampai Anda mengirimkannya.',
      awaiting:
        'Menunggu {{approver}}. Melewati manajer mereka di {{time}} tanpa keputusan.',
      awaitingFinal: 'Menunggu {{approver}}.',
      overdue: 'Penantian telah berakhir; sapuan berikutnya meneruskannya.',
      needsInfo: '{{actor}} mengirimkannya kembali: {{reason}}',
      rejected: '{{actor}} menolaknya: {{reason}}',
      approved: 'Disetujui. Pembayaran sedang dalam proses.',
      paymentRetrying:
        'Upaya pembayaran {{attempts}} gagal, mencoba lagi: {{error}}',
      paymentFailed:
        'Pembayaran gagal setelah upaya {{attempts}}: {{error}}. Keuangan akan menindaklanjutinya.',
      paid: 'Dibayar. Referensi {{ref}}.',
    },
    timeline: {
      title: 'Riwayat persetujuan',
      empty: 'Belum diserahkan.',
      autoApproved: 'Dalam {{limit}}: disetujui secara otomatis',
      escalated:
        'Tidak ada keputusan pada waktunya; diteruskan ke manajer berikutnya',
      paid: 'Pembayaran selesai',
    },
    decision: {
      title: 'Keputusanmu',
      placeholder: 'Komentar (diperlukan untuk mengirim kembali atau menolak)',
      approve: 'Setujui',
      requestInfo: 'Kirim kembali',
      reject: 'Tolak',
    },
    withdraw: 'Tarik kembali',
  },
  flowDiagram: {
    overview: 'Ikhtisar diagram',
    actualSize: 'Ukuran sebenarnya',
    states: 'Serikat',
    transitions: 'Transisi',
    configurable: 'Parameter',
    current: 'Saat ini',
    visited: 'Dikunjungi',
    initial: 'Awal',
    final: 'Terakhir',
    state: 'Keadaan',
    zoomOut: 'Perkecil',
    zoomIn: 'Memperbesar',
    fit: 'Cocok untuk dilihat',
    empty: 'Tidak ada negara bagian untuk ditampilkan.',
    loading: 'Tata letak diagram…',
    failed: 'Tidak dapat membuat diagram ini.',
    nodeHelp: 'Tekan Enter atau Spasi untuk memilih negara bagian.',
    edgeHelp: 'Tekan Enter atau Spasi untuk memilih transisi.',
  },
  diagramStatus: {
    traversed: 'Dilintasi',
    end: 'Berakhir',
    current: 'Saat ini',
    visited: 'Dikunjungi',
    available: 'Tersedia',
    pending: 'Tidak dilalui',
  },
  flows: {
    customer: 'Pelanggan',
    final: 'Yang ini sudah selesai; tidak ada yang menggerakkannya lagi.',
    process: 'Proses',
    legend:
      'Keadaan saat ini memiliki pengisian yang lebih kuat; negara bagian yang dikunjungi dan transisi aktual yang dilalui memiliki satu warna aksen. Legenda mengidentifikasi transisi yang tersedia dan bagian yang tidak dilalui. Negara bagian awal memiliki perbatasan pil, negara bagian akhir memiliki perbatasan ganda. Pilih negara bagian atau transisi untuk mengetahui detailnya. ⚙ khusus server, ⏱ pemicu, ✓/✗ kelanjutan efek.',
    nothing:
      'Tidak ada yang perlu kamu lakukan di sini saat ini; itu menunggu di luar.',
  },
  webhooks: {
    title: 'Webhook',
    hint: 'Apa yang dikirim, ditahan, atau dikirimkan oleh kotak pasir, dan bagaimana setiap pengiriman dijawab. Kirimkan satu lagi untuk melihat tayangan ulang, atau simpan dalam urutan lain.',
    empty: 'Belum ada webhook.',
    hold: 'Pegang webhooknya',
    deliver: 'Kirim',
    deliverAgain: 'Kirim lagi',
    deliveries_one: 'mengirimkan waktu {{count}}',
    deliveries_other: 'mengirimkan {{count}} kali',
    occurred: 'Terjadi {{time}}',
    outcomes: {
      applied: 'Diterapkan',
      replayed: 'Diputar ulang',
      ignored: 'Diabaikan',
      retry: 'Akan mencoba lagi',
      held: 'Diadakan',
    },
  },
  orders: {
    title: 'Pembayaran pesanan',
    list: 'Pesanan',
    new: 'Orde baru',
    empty: 'Tidak ada pesanan di sini.',
    pick: 'Pilih pesanan untuk melihat posisi pembayarannya.',
    shows:
      'Pembayaran dikonfirmasi oleh webhook penyedia, bukan oleh halaman: pesanan menunggu sebagai status, dan webhook — betapapun terlambat, cepat atau seringnya pesanan tiba — memindahkannya tepat satu kali. Pembayaran yang diterima setelah pesanan dibatalkan akan dikembalikan.',
    description:
      'Pelanggan membayar melalui checkout yang dihosting penyedia pembayaran; pesanan berpindah saat webhook penyedia tiba. Pesanan yang belum dibayar ditutup setelah menit {{minutes}}.',
    nothing:
      'Tidak ada yang perlu Anda lakukan: pesanan menunggu penyedia pembayaran.',
    actions: {
      checkout: 'Bayar',
      cancel: 'Batalkan pesanan',
      ship: 'Kapal',
      refundOrder: 'Kembalikan dana',
      retryRefund: 'Coba lagi pengembalian dana',
    },
    form: {
      title: 'Lakukan pemesanan',
      item: 'Barang',
      amount: 'Jumlah (¥)',
      failCheckouts: 'Upaya checkout yang gagal dengan sengaja',
      failRefunds: 'Upaya pengembalian dana yang gagal dengan sengaja',
      failHint:
        'Membuka kasir dan mengembalikan dana adalah efek dari percobaan ulang; membuat mereka gagal untuk melihat percobaan ulang dan di mana pesanan berhenti.',
      submit: 'Lakukan pemesanan',
    },
    fields: {
      customer: 'Pelanggan',
      amount: 'Jumlah',
      attempt: 'Putaran pembayaran',
      session: 'Sesi pembayaran',
      paymentRef: 'Pembayaran',
      refundRef: 'Kembalikan dana',
    },
    banner: {
      draft: 'Belum dibayar.',
      creatingCheckout: 'Membuka kasir penyedia…',
      awaitingPayment:
        'Menunggu penyedia pembayaran. Ditutup di {{time}} jika tidak membayar.',
      overdue: 'Jendela sudah berakhir; sapuan berikutnya menutupnya.',
      paymentFailed: '{{error}} Bayar lagi, atau ditutup di {{time}}.',
      paid: 'Berbayar, siap dikirim.',
      cancelled: {
        customer: 'Dibatalkan oleh pelanggan.',
        timeout: 'Ditutup: tidak dibayar tepat waktu.',
        refundRequested: 'Pengembalian dana diminta oleh pelanggan.',
      },
      refunding: 'Sedang mengembalikan dana…',
      refundNeedsAttention:
        'Pengembalian dana gagal: {{error}} Menunggu seseorang untuk mencobanya lagi.',
      refunded: 'Dana telah dikembalikan.',
      fulfilled: 'Dibayar dan dikirim.',
    },
    sessionStatus: {
      open: 'terbuka',
      paid: 'dibayar',
      declined: 'menolak',
      expired: 'kedaluwarsa',
    },
    outside: {
      title: 'Penyedia pembayaran (kotak pasir)',
      description:
        'Memainkan pelanggan di checkout penyedia, dan penyedia mengirimkan webhooknya. Tahan webhook untuk mengirimkannya terlambat, dua kali, atau setelah pembatalan.',
      checkout: 'Pembayaran yang dihosting',
      session: 'Sesi {{id}}: {{status}}.',
      noSession:
        'Tidak ada kasir yang dibuka; pelanggan membayar terlebih dahulu.',
      pay: 'Bayar',
      decline: 'Tolak kartunya',
      tryThis:
        'Coba: tahan webhook, bayar, batalkan pesanan, lalu kirimkan webhook yang ditahan — uang akan diterima setelah pembatalan dan dikembalikan.',
    },
  },
  exports: {
    title: 'Ekspor data',
    list: 'Ekspor',
    new: 'Ekspor baru',
    empty: 'Tidak ada ekspor di sini.',
    pick: 'Pilih ekspor untuk melihatnya disurvei.',
    shows:
      'Vendor tidak memiliki webhook, sehingga siklus hidup menanyakan: pemicu memicu transisi mandiri setiap beberapa detik, dan memasuki status kembali melakukan polling pada vendor. Batas waktu yang ditetapkan pada catatan mengakhiri penantian.',
    description:
      'Vendor merender ekspor dengan lambat dan tidak memanggil siapa pun kembali, sehingga setiap ekspor melakukan polling setiap {{seconds}} detik dan menyerah setelah {{minutes}} menit.',
    nothing:
      'Tidak ada yang perlu Anda lakukan: ekspor sedang melakukan polling pada vendor.',
    actions: {
      submit: 'Mulai ekspor',
      retry: 'Ekspor lagi',
      cancel: 'Batal',
    },
    outcomes: {
      success: 'berhasil',
      failure: 'gagal',
      stuck: 'terhenti di 60%',
    },
    jobStatus: {
      running: 'berjalan',
      succeeded: 'selesai',
      failed: 'gagal',
      cancelled: 'dibatalkan',
    },
    form: {
      title: 'Minta ekspor',
      name: 'Nama',
      duration: 'Vendor membutuhkan waktu (detik)',
      outcome: 'Pekerjaan vendor',
      hint: 'Pekerjaan yang macet tidak akan pernah selesai: waktu ekspor habis sesuai tenggat waktu dan menghentikan pekerjaan.',
      submit: 'Buat',
    },
    fields: {
      vendor: 'Penjual',
      vendorValue: '{{seconds}} dtk, {{outcome}}',
      job: 'Pekerjaan penjual',
      polls: 'Jajak Pendapat',
      deadline: 'Batas waktu',
    },
    banner: {
      draft: 'Belum dimulai.',
      starting: 'Mengirimkan pekerjaan ke vendor…',
      processing: 'Vendor sedang mengerjakannya. Menyerah di {{time}}.',
      done: 'Siap: {{url}}',
      failed: 'Gagal: {{error}}',
      timedOut:
        'Vendor tidak menyelesaikan sebelum batas waktu; pekerjaannya dihentikan.',
      cancelled: 'Dibatalkan.',
    },
    outside: {
      title: 'Vendor (kotak pasir)',
      description:
        'Apa yang diketahui ekspor tentang pekerjaan vendor: hanya apa yang dilihat oleh jajak pendapat terakhir. Vendor tidak mengirimkan webhook, jadi tidak ada yang lain yang bisa.',
      lifecycleSide: 'Apa yang diketahui ekspor',
      lifecycleHint:
        'Pekerjaan {{id}}, menurut jajak pendapat terakhir; jajak pendapat berikutnya memperbaruinya.',
      lastPoll:
        'Jajak pendapat terakhir menunjukkan {{status}}, {{progress}}% (jajak pendapat {{count}}).',
      noPoll: 'Belum disurvei.',
      nextPoll: 'Jajak pendapat berikutnya tentang {{time}}.',
      pollDue: 'Penyisiran berikutnya melakukan jajak pendapat.',
      noJob: 'Belum ada pekerjaan di vendor.',
    },
  },
  purchases: {
    title: 'Penjualan kilat',
    list: 'Pembelian',
    new: 'Pembelian baru',
    empty: 'Tidak ada pembelian di sini.',
    pick: 'Pilih pembelian untuk mengikuti langkah-langkahnya.',
    shows:
      'Pembelian mencakup dua sistem yang tidak dapat dibatalkan oleh rollback database. Setiap langkah adalah keadaan dengan satu efek, dan ketika tagihan ditolak, reservasi dibatalkan oleh langkahnya sendiri — jadi yang masih terutang selalu merupakan keadaan catatan.',
    description:
      'Gudang menampung unit, lalu penyedia pembayaran mengambil uangnya. Ketika kartu ditolak, unit diberikan kembali dengan langkah kompensasi; kompensasi yang terus gagal berhenti dan menunggu seseorang.',
    nothing:
      'Tidak ada yang perlu Anda lakukan: pembelian sedang menjalankan langkah-langkahnya.',
    actions: {
      submit: 'Lakukan pemesanan',
      abandon: 'Buang',
      retryRelease: 'Coba lagi pelepasan stok',
    },
    items: {
      headphones: 'Headphone',
      keyboard: 'Keyboard mekanis',
      lamp: 'Lampu meja',
    },
    form: {
      title: 'Beli di flash sale',
      item: 'Barang',
      quantity: 'Kuantitas',
      total: 'Jumlah {{total}}',
      declineCharge: 'Kartu ditolak',
      failReleases: 'Pelepasan stok yang sengaja digagalkan',
      failHint:
        'Tolak kartu untuk melihat kompensasi; membuat rilis gagal 3 kali atau lebih untuk melihatnya berhenti dan menunggu seseorang.',
      submit: 'Buat',
    },
    fields: {
      customer: 'Pelanggan',
      amount: 'Jumlah',
      reservation: 'Reservasi',
      paymentRef: 'Pembayaran',
    },
    banner: {
      draft: 'Belum ditempatkan.',
      reserving: 'Memesan unit…',
      charging: 'Unit ditahan; mengisi daya kartu…',
      releasing: 'Tuduhan gagal ({{error}}); mengembalikan unitnya…',
      compensationNeedsAttention:
        'Unit tidak dapat dikembalikan: {{error}} Menunggu seseorang untuk mencoba lagi rilisnya.',
      confirmed: 'Dikonfirmasi: unit dipesan dan dibayar.',
      cancelled: {
        customer: 'Dibuang.',
        outOfStock: 'Dibatalkan: {{error}}',
        paymentDeclined: 'Dibatalkan: kartu ditolak, dan unit dikembalikan.',
      },
    },
    outside: {
      title: 'Gudang dan penyedia pembayaran (kotak pasir)',
      description:
        'Setiap langkah berdampak pada sistem di luar aplikasi; pembatalan juga merupakan sebuah langkah.',
      steps: 'Langkah',
      stepsHint: 'Efek terakhir dari setiap langkah.',
      reserve: 'Cadangan stok',
      charge: 'Isi daya kartunya',
      release: 'Rilis stok (kompensasi)',
      notYet: 'Tidak dijalankan',
      stock: 'Stok gudang',
      stockHint: 'Perhatikan unit pergi dan kembali.',
      item: 'Barang',
      available: 'Tersedia',
      reserved: 'Dicadangkan',
    },
  },
  fulfilments: {
    title: 'Pengiriman',
    list: 'Pengiriman',
    new: 'Pengiriman baru',
    empty: 'Tidak ada pengiriman di sini.',
    pick: 'Pilih kiriman untuk memainkan pembayaran, gudang, dan operatornya.',
    shows:
      'Pengiriman menunggu dua sinyal dari dua sistem, apa pun urutan kedatangannya, lalu mengikuti peristiwa yang dilakukan oleh pihak pengangkut — diterapkan berdasarkan saat terjadinya, bukan saat tiba.',
    description:
      'Kiriman berangkat setelah pembayaran diterima dan gudang telah mengambilnya, dalam urutan apa pun. Webhook operator kemudian datang terlambat dan rusak; hanya peristiwa baru yang memindahkannya.',
    nothing: 'Tidak ada yang perlu Anda lakukan: kiriman menunggu di luar.',
    actions: {
      ship: 'Tangan ke pembawa',
      cancel: 'Batalkan pengiriman',
    },
    signals: {
      payment: 'pembayaran ditangkap',
      pick: 'gudang diambil',
    },
    and: 'dan',
    carrier: {
      booked: 'Dipesan',
      pickedUp: 'Diangkat',
      inTransit: 'Dalam perjalanan',
      outForDelivery: 'Keluar untuk pengiriman',
      delivered: 'Terkirim',
      exception: 'Pengecualian',
    },
    form: {
      title: 'Buka kiriman',
      name: 'Nama',
      customer: 'Pelanggan',
      submit: 'Buat',
    },
    fields: {
      customer: 'Pelanggan',
      paid: 'Pembayaran ditangkap',
      picked: 'Dipilih',
      tracking: 'Nomor pelacakan',
      carrier: 'Kata Pembawa',
      carrierAt: 'Pada',
    },
    banner: {
      preparing: 'Menunggu: {{waiting}}.',
      readyToShip: 'Dibayar dan diambil: siap diserahkan ke pengangkut.',
      booking: 'Memesan operator…',
      shipped: 'Sedang dalam perjalanan.',
      exception:
        'Operator melaporkan masalah; acara yang lebih baru menghapusnya.',
      delivered: 'Terkirim.',
      cancelled: 'Dibatalkan.',
    },
    outside: {
      title: 'Penyedia pembayaran, gudang dan operator (kotak pasir)',
      description:
        'Kirim webhook setiap sistem, sekarang atau ditahan. Kirimkan yang ditahan dalam urutan lain untuk melihat mana yang berlaku.',
      signals: 'Dua sinyal',
      signalsHint:
        'Keduanya mungkin didahulukan; yang kedua memindahkan kiriman.',
      capture: 'Pembayaran ditangkap',
      pick: 'Gudang dipilih',
      carrierTitle: 'Perusahaan pengangkut',
      carrierHint:
        'Peristiwa tentang bingkisan, masing-masing disertai waktu terjadinya.',
      status: 'Status',
      location: 'Lokasi',
      offset: 'Beberapa menit dari sekarang',
      send: 'Kirim',
      offsetHint:
        'Bidang terakhir bergeser saat pemindaian terjadi: angka negatif melaporkan pemindaian yang lebih lama.',
      scramble: 'Tahan tiga pindaian untuk dikirim dalam urutan apa pun',
    },
  },
  subscriptions: {
    title: 'Langganan',
    list: 'Langganan',
    new: 'Berlangganan',
    empty: 'Tidak ada langganan di sini.',
    pick: 'Pilih langganan untuk mengikuti penagihannya.',
    shows:
      'Langganan bergerak aktif → mengisi daya → aktif sekali dalam satu periode, selama masa pakainya. Perpanjangan ini jatuh tempo pada akhir periode langganan, yang ditemukan oleh penyisiran; kartu yang ditolak dicoba ulang oleh pemicu sampai kartu tersebut menyerah.',
    description:
      'Dibebankan setiap {{period}} menit. Tagihan yang ditolak akan dicoba ulang setiap {{dunning}} menit; setelah {{tries}} mencoba, langganan dibatalkan.',
    nothing:
      'Tidak ada yang perlu Anda lakukan: penagihan berjalan dengan sendirinya.',
    actions: {
      updateCard: 'Perbarui kartu',
      cancel: 'Berhenti berlangganan',
    },
    plans: {
      basic: 'Dasar',
      pro: 'Pro',
    },
    periodN_one: 'periode {{count}}',
    periodN_other: 'periode {{count}}',
    form: {
      title: 'Berlangganan',
      plan: 'Rencana',
      charge: '{{price}} dibebankan sekarang dan pada awal setiap periode.',
      cardDeclines: 'Tagihan pada kartu ditolak',
      failHint:
        'Penolakan adalah jawaban, bukan pemadaman: tagihan tidak dicoba ulang sekaligus tetapi dengan pemicu yang terus-menerus, dengan kunci baru.',
      submit: 'Berlangganan',
    },
    fields: {
      customer: 'Pelanggan',
      periods: 'Periode dibayar',
      periodEnd: 'Periode berakhir',
      dunning: 'Percobaan yang gagal',
      lastCharge: 'Tuduhan terakhir',
      card: 'Kartu',
      cardWorks: 'Berhasil',
      cardValue_one: 'menolak tagihan berikutnya',
      cardValue_other: 'menolak tagihan {{count}} berikutnya',
    },
    banner: {
      renewing: 'Mengisi daya kartu…',
      active: 'Aktif. Diperbarui di {{time}}.',
      due: 'Periodenya telah berakhir; sapuan berikutnya memperbaruinya.',
      pastDue:
        '{{error}} Coba {{tries}} dari {{max}}; selanjutnya coba di {{time}}.',
      cancelled: {
        customer: 'Berhenti berlangganan.',
        unpaid: 'Dibatalkan: kartu terus ditolak.',
      },
    },
    outside: {
      title: 'Penagihan (kotak pasir)',
      description:
        'Setiap muatan adalah rangkaian efek muatan, yang ditentukan oleh periode dan percobaan.',
      charges: 'Tagihan',
      chargesHint: 'Yang tertua duluan.',
      noCharges: 'Belum ada biaya.',
      sweep: 'Sapuan pembaruan',
      sweepHint:
        'Perpanjangan ditemukan melalui penyisiran pada setiap akhir periode berlangganan; itu berjalan setiap 10 detik, atau sekarang.',
    },
  },
  guide: {
    title: 'Tentang contoh ini',
    show: 'Tunjukkan',
    hide: 'Sembunyikan',
    purpose: 'Apa yang ditunjukkannya',
    howTo: 'Bagaimana cara mencobanya',
    samples:
      'Catatan sampel dimuat saat aplikasi diinstal dengan data sampel (APP_SAMPLE_DATA=true). Pada database yang diinstal tanpa mereka, jalankan “pnpm nocobase db sample”.',
    invoices: {
      purpose:
        'Gunakan satu permintaan penyedia untuk mendemonstrasikan panggilan balik, kueri batas waktu, dan percobaan ulang, dengan contoh PDF yang dapat diunduh.',
      step1:
        'Buka sampel pesanan #1024, minta, lalu klik Berhasil menerbitkan di kotak pasir. Setelah webhook, unduh contoh PDF.',
      step2:
        'Kirimkan pemberitahuan yang sama lagi: pemberitahuan itu diputar ulang dan tidak ada faktur kedua yang diterbitkan.',
      step3:
        'Pada pesanan #1026, tahan webhook dan berhasil menerbitkan. Setelah 30 detik, kueri menyelesaikannya. Pengiriman selanjutnya tidak bisa mengeluarkannya lagi.',
      step4:
        'Sampel 晨光书店 gagal dikirimkan sebanyak 3 kali. Coba lagi pemulihan faktur dari masalah yang gagal dan pertahankan permintaan penyedia yang sama.',
    },
    tickets: {
      purpose:
        'Tiket tetap berada di tempatnya di bidang statusnya sendiri, dan setiap perubahan — terima, balas, selesaikan, buka kembali — adalah transisi yang dinyatakan dalam sumber. Percakapan adalah log transisi: setiap pesan adalah masukan dari transisi yang ditimbulkannya. Email dijalankan sebagai efek setelah transisi dilakukan, dengan percobaan ulang, dan tiket yang dibiarkan menunggu pelanggan ditutup oleh pemicu.',
      step1:
        'Gunakan “Masuk sebagai” di kanan atas untuk beralih antara agen dukungan dan pelanggan. Agen melihat seluruh antrian; pelanggan hanya melihat tiketnya sendiri.',
      step2:
        'Sebagai agen, buka tiket baru “无法登录管理后台” dan balas. Sekarang ia menunggu pelanggan, dan menutup sendiri setelah beberapa menit hening; pemicunya disapu setiap 10 detik.',
      step3:
        'Beralih ke 王女士 dan balas tiket yang menunggunya: tiket itu kembali ke agennya. Tiket yang ditutup dapat dibuka kembali oleh pelanggannya selama 7 hari — cobalah sebagai 李先生 di “如何导出本月的订单报表？”.',
      step4:
        'Ajukan tiket sebagai pelanggan dengan "Pengiriman email yang gagal dengan sengaja" yang diatur dalam opsi Demo, lalu balas tiket tersebut sebagai agen: "Di balik terpal" menunjukkan efek email gagal dan mencoba lagi.',
    },
    expenses: {
      purpose:
        'Laporan pengeluaran dirutekan berdasarkan jumlahnya: hingga ¥5,000 disetujui secara otomatis, lebih tinggi dari yang disetujui oleh manajer pemohon, dan di atas ¥50,000 juga disetujui oleh direktur keuangan. Pemberi persetujuan menyetujui, mengirim kembali, atau menolak dengan suatu alasan, manajer yang menganggur dilewati oleh pemicu, dan laporan yang disetujui dibayar oleh efek yang kemudian menandainya sebagai telah dibayar.',
      step1:
        'Gunakan “Masuk sebagai” untuk memerankan karyawan 林晓 dan 何东, manajer mereka, eksekutif dan direktur keuangan. Seorang karyawan melihat laporannya sendiri; pemberi persetujuan melihat apa yang menunggu mereka.',
      step2:
        'Sebagai 林晓, kirimkan draft “杭州客户拜访” (¥872): disetujui secara otomatis dan dibayar beberapa saat kemudian. “Under the hood” menunjukkan efek pembayaran dan transisi “berbayar” yang diaktifkan.',
      step3:
        'Beralih ke 赵静, direktur keuangan, dan setujui “法兰克福展会参展”, yang telah disetujui 陈明: di atas ¥50,000 diperlukan keduanya.',
      step4:
        'Sebagai 何东, kirim ulang “北京客户现场支持”, yang dikirim kembali untuk informasi lebih lanjut, lalu setujui sebagai 孙磊. Laporan yang ditinggalkan oleh manajer selama 3 menit akan diteruskan ke manajer manajer.',
      step5:
        'Di bawah “Di balik terpal”, “Apa yang dapat dilakukan oleh identitas saat ini” memberikan alasan untuk setiap tindakan yang mungkin tidak dilakukan oleh orang saat ini. Buka laporan tunggu di dua jendela dan bertindak di keduanya: jendela kedua ditolak karena versi yang dilihatnya sudah basi.',
    },
    orders: {
      purpose:
        'Pesanan ditandai dibayar hanya oleh webhook penyedia pembayaran, tidak pernah berdasarkan halaman. Sementara ia menunggu, ia hanya mencatat statusnya — tidak ada pengatur waktu, tidak ada permintaan terbuka — dan webhook yang datang terlambat, lebih awal, atau dua kali masih memindahkannya tepat satu kali. Uang yang masuk setelah pesanan dibatalkan akan dikembalikan.',
      step1:
        'Buka pesanan sampel “降噪耳机 × 1” dan klik “Bayar”: sebuah efek membuka checkout yang dihosting penyedia, dan pesanan menunggu pembayaran.',
      step2:
        'Pada kartu “Penyedia pembayaran (kotak pasir)” yang diberi garis putus-putus, bayar atau tolak kartu tersebut. Webhook yang dikirimkan penyedia inilah yang menggerakkan pesanan; “Kirim lagi” dijawab Diputar Ulang.',
      step3:
        'Centang “Tahan webhook”, bayar, klik “Batalkan pesanan”, lalu kirimkan webhook yang ditahan: pembayaran diterima setelah pembatalan dan dikembalikan.',
      step4:
        'Sampel “机械键盘 × 1” sengaja gagal dalam checkout pertamanya, untuk menunjukkan efek percobaan ulang. Pesanan yang belum dibayar akan kedaluwarsa setelah 3 menit.',
    },
    exports: {
      purpose:
        'Vendor tidak mengirimkan webhook, sehingga ekspor melakukan polling: pemicu memicu “polling” transisi mandiri, memasukkan kembali “pemrosesan” akan menjalankan pemeriksaan, dan tenggat waktu yang tertulis pada catatan memutuskan kapan harus menyerah.',
      step1:
        'Buka “9 月订单明细” dan klik “Mulai ekspor”. Vendor membutuhkan waktu 30 detik; tonton “Apa yang diketahui vendor” sebelum apa yang diketahui ekspor hingga jajak pendapat berikutnya.',
      step2:
        'Mulai “全年客户名单”, yang pekerjaan vendornya terhenti: pada tenggat waktu ekspor habis dan menghentikan pekerjaan vendor. “Ekspor lagi” memulai babak baru.',
      step3:
        'Di bawah “Di balik terpal”, setiap jajak pendapat adalah transisi dalam log dan setiap pemeriksaan akan menjalankan efek.',
    },
    purchases: {
      purpose:
        'Pembelian flash-sale mencakup dua sistem: gudang memesan stok, kemudian penyedia pembayaran menagih kartu tersebut. Ketika tagihan ditolak, reservasi dibatalkan dengan langkah kompensasinya sendiri; kompensasi yang terus gagal berhenti ketika seseorang mencoba lagi.',
      step1:
        'Buka contoh pembelian dua lampu dan klik “Pesan”: unit sudah dipesan, kartu sudah diisi, dan pembelian selesai.',
      step2:
        'Tempatkan contoh pembelian keyboard, yang kartunya ditolak, dan lihat unit meninggalkan “stok Gudang” dan kembali lagi.',
      step3:
        'Buat pembelian dengan kartu ditolak dan atur “Pelepasan stok yang sengaja digagalkan” ke 3: pelepasan stok berhenti dan menunggu “Coba lagi pelepasan stok”.',
    },
    fulfilments: {
      purpose:
        'Pengiriman menunggu dua sinyal dari dua sistem — pembayaran diambil dan pengambilan di gudang — sesuai urutan kedatangannya, lalu mengikuti pengangkut. Peristiwa pembawa diterapkan berdasarkan saat terjadinya, bukan saat tiba, dan peristiwa yang lebih lama ditolak karena sudah basi.',
      step1:
        'Buka pengiriman sampel dan kirim “Gudang diambil” dan “Pembayaran diambil” dalam urutan mana pun: urutan kedua memindahkannya ke siap dikirim.',
      step2:
        'Klik “Serahkan ke operator”, lalu kirimkan pindaian operator, masing-masing dengan status dan lokasi.',
      step3:
        'Centang “Tahan tiga pindaian untuk dikirim dalam urutan apa pun” dan kirim pindaian terbaru terlebih dahulu: pindaian sebelumnya akan diabaikan karena sudah basi.',
      step4:
        '“Beberapa menit dari sekarang” yang negatif melaporkan pemindaian yang terjadi sebelumnya, seperti apa kejadian yang terlambat.',
    },
    subscriptions: {
      purpose:
        'Langganan dikenakan biaya pada awal setiap periode selama periode tersebut masih berlaku. Sapuan plugin akan memperbarui masing-masing tagihan pada akhir periodenya sendiri, dan tagihan yang ditolak akan dicoba ulang oleh pemicu yang berjalan, dengan kunci baru, hingga pulih atau langganan dibatalkan.',
      step1:
        'Klik “Berlangganan” dan pilih paket: tagihan pertama dijalankan sekaligus. Tidak ada contoh langganan, karena pembuatannya akan membebankan biaya pada kartu.',
      step2:
        'Berlangganan dengan “Tagihan pada kartu ditolak” diatur ke 1: sudah lewat jatuh tempo, dicoba lagi satu menit kemudian dan pulih. “Perbarui kartu” memulihkannya sekaligus.',
      step3:
        'Suatu periode berlangsung selama 3 menit; “Jalankan pemicu sekarang” di bawah “Pembaruan sapuan” memperbarui apa pun yang jatuh tempo tanpa menunggu sapuan berikutnya.',
    },
  },
  blockers: {
    invoiceRequestMismatch: 'Hasilnya milik permintaan faktur lain.',
    agentOnly: 'Hanya agen pendukung yang dapat mengerjakan tiket.',
    requesterOnly:
      'Hanya pelanggan yang mengajukan tiket yang dapat melakukan ini.',
    systemOnly: 'Sistem melakukan ini sendiri setelah waktu tunggu berlalu.',
    reopenExpired:
      'Sudah terlalu lama ditutup untuk dibuka kembali; ajukan tiket baru sebagai gantinya.',
    applicantOnly: 'Hanya pemohon yang dapat melakukan ini dengan laporannya.',
    approverOnly:
      'Hanya pemberi persetujuan saat ini yang dapat memutuskan laporan ini.',
    topApprover:
      'Pemberi persetujuan saat ini sudah berada di level tertinggi.',
    customersOnly:
      'Hanya pelanggan yang dapat mengajukan tiket untuk dirinya sendiri.',
    applicantsOnly:
      'Hanya seorang karyawan yang dapat mengajukan laporan pengeluaran untuk dirinya sendiri.',
    alreadyPaid: 'Pembayaran telah dikonfirmasi.',
    alreadyPicked: 'Gudang sudah mengambilnya.',
    staleCarrierEvent: 'Peristiwa pembawa yang lebih baru telah diterapkan.',
    periodNotOver: 'Periode saat ini belum berakhir.',
  },
  problems: {
    orderRef: 'Pilih pesanan sandbox yang sudah selesai.',
    taxNumber: 'Masukkan nomor pajak 15 sampai 20 huruf atau angka.',
    message: 'Tulis pesan.',
    reason: 'Berikan alasannya.',
    subject: 'Berikan subjek pada tiket.',
    description: 'Jelaskan masalahnya.',
    category: 'Pilih kategori.',
    priority: 'Pilih prioritas.',
    title: 'Beri nama.',
    amountCents: 'Jumlahnya harus lebih dari 0.',
    durationSeconds: 'Vendor membutuhkan waktu antara 5 dan 600 detik.',
    vendorOutcome: 'Pilih bagaimana pekerjaan berakhir.',
    sku: 'Pilih item.',
    quantity: 'Beli antara 1 dan 5.',
    plan: 'Pilih rencana.',
    customerId: 'Pilih pelanggan.',
  },
  errors: {
    EXPENSE_NOT_FOUND: 'Laporan pengeluaran tidak ada.',
    OWN_EXPENSE_ONLY: 'Hanya pemohon yang dapat mengedit laporan ini.',
    EXPENSE_LOCKED:
      'Laporan yang sedang ditinjau tidak dapat diedit; menariknya terlebih dahulu.',
    EXPENSE_CHANGED:
      'Laporan berubah saat Anda mengeditnya; muat ulang dan coba lagi.',
    SANDBOX_SESSION_CLOSED: 'Kasir tidak lagi dibuka.',
    SANDBOX_NOT_FOUND: 'Kotak pasir tidak memiliki objek seperti itu.',
    UNKNOWN_WEBHOOK_EVENT: 'Sandbox tidak mengirimkan acara itu.',
    WEBHOOK_EVENT_NOT_FOUND: 'Tidak ada acara webhook seperti itu.',
  },
  lifecycle: {
    title: 'Di bawah tenda',
    hint: 'Siklus hidup apa yang dicatat untuk rekaman ini. Aplikasi nyata tidak akan menunjukkan hal ini kepada penggunanya.',
    available: 'Apa yang dapat dilakukan oleh identitas saat ini',
    final: 'Tidak ada transisi yang meninggalkan keadaan ini.',
    diagram: 'Diagram interaktif',
    diagramHint:
      'toMermaid(describe()) menggambar siklus hidup sebagai diagram keadaan; tempelkan ke penyaji Mermaid mana pun.',
    retry: 'Coba lagi',
    cancel: 'Batal',
    continue: 'Lanjutkan',
    continuationWaits: '{{transition}} menunggu: {{error}}',
    continuationAbandoned:
      '{{transition}} menyerah setelah {{attempts}} mencoba, hingga dilanjutkan dengan tangan: {{error}}',
    states: 'Serikat',
    parameters: 'Parameter',
    transitions: 'Catatan transisi',
    effects: 'Efek berjalan',
    noTransitions: 'Belum ada transisi.',
    noEffects: 'Belum ada efeknya.',
    attempts: '{{attempts}}/{{max}}',
    runTriggers: 'Jalankan pemicu sekarang',
    sweepNote:
      'Pemicu disapu setiap 10 detik; ini segera menjalankan penyisiran.',
    swept_one: 'Sapuan memicu transisi {{count}}.',
    swept_other: 'Sapuan ini memicu transisi {{count}}.',
    columns: {
      time: 'Waktu',
      transition: 'Transisi',
      change: 'Perubahan',
      actor: 'Oleh',
      input: 'Masukan',
      effect: 'Efek',
      status: 'Status',
      attempts: 'Upaya',
      error: 'Kesalahan terakhir',
    },
  },
  states: {
    review: 'Sedang ditinjau',
    submitting: 'Mengirimkan',
    awaitingIssue: 'Menunggu terbitan',
    querying: 'Menanyakan',
    issued: 'Dikeluarkan',
    issueFailed: 'Masalah gagal',
    new: 'Baru',
    open: 'Buka',
    awaitingCustomer: 'Menunggu pelanggan',
    closed: 'Tertutup',
    draft: 'Draf',
    awaitingManager: 'Menunggu manajer',
    awaitingFinance: 'Menunggu keuangan',
    needsInfo: 'Dikirim kembali',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    paid: 'Dibayar',
    creatingCheckout: 'Membuka kasir',
    awaitingPayment: 'Menunggu pembayaran',
    paymentFailed: 'Pembayaran gagal',
    cancelled: 'Dibatalkan',
    refunding: 'Sedang mengembalikan dana',
    refundNeedsAttention: 'Pengembalian dana perlu diperhatikan',
    refunded: 'Dana telah dikembalikan',
    fulfilled: 'Dikirim',
    starting: 'Dimulai',
    processing: 'Pemrosesan',
    done: 'Selesai',
    failed: 'Gagal',
    timedOut: 'Waktu habis',
    reserving: 'Memesan stok',
    charging: 'Sedang menagih',
    releasing: 'Melepaskan stok',
    compensationNeedsAttention: 'Kompensasi terhenti',
    confirmed: 'Dikonfirmasi',
    preparing: 'Mempersiapkan',
    readyToShip: 'Siap dikirim',
    booking: 'Operator pemesanan',
    shipped: 'Dalam perjalanan',
    exception: 'Pengecualian pembawa',
    delivered: 'Terkirim',
    renewing: 'Sedang menagih',
    active: 'Aktif',
    pastDue: 'Lewat jatuh tempo',
  },
  transitions: {
    retry: 'Coba lagi',
    jobStarted: 'Pekerjaan diserahkan',
    startFailed: 'Pengiriman gagal',
    poll: 'Hasil jajak pendapat',
    jobDone: 'Ekspor selesai',
    jobFailed: 'Ekspor gagal',
    cancel: 'Batal',
    paymentCaptured: 'Pembayaran ditangkap',
    picked: 'Gudang dipilih',
    ship: 'Kapal',
    booked: 'Maskapai dipesan',
    trackingUpdated: 'Pelacakan diperbarui',
    checkout: 'Buka pembayaran',
    checkoutCreated: 'Pembayaran dibuka',
    checkoutFailed: 'Pembayaran gagal',
    paymentSucceeded: 'Pembayaran berhasil',
    paymentDeclined: 'Pembayaran ditolak',
    paidAfterCancel: 'Pembayaran setelah pembatalan',
    expire: 'Tutup setelah batas waktu habis',
    refundOrder: 'Kembalikan dana',
    refunded: 'Pengembalian dana selesai',
    refundFailed: 'Pengembalian dana gagal',
    retryRefund: 'Coba lagi pengembalian dana',
    charged: 'Serangan berhasil',
    chargeFailed: 'Pengisian gagal',
    renew: 'Perbarui saat jatuh tempo',
    retryCharge: 'Coba lagi penagihan',
    updateCard: 'Perbarui kartu',
    abandon: 'Abaikan',
    stockReserved: 'Stok dipesan',
    stockUnavailable: 'Stok tidak tersedia',
    stockReleased: 'Stok dirilis',
    releaseFailed: 'Pelepasan stok gagal',
    retryRelease: 'Coba lagi pelepasan stok',
    retryInvoice: 'Coba lagi faktur',
    submitted: 'Permintaan diajukan',
    submissionFailed: 'Pengiriman gagal',
    query: 'Faktur permintaan',
    stillPending: 'Masih tertunda',
    issued: 'Faktur diterbitkan',
    issueFailed: 'Masalah gagal',
    queryFailed: 'Kueri gagal',
    create: 'Dibuat',
    accept: 'Ambil',
    reply: 'Balas',
    customerReply: 'Balasan pelanggan',
    resolve: 'Putuskan',
    autoClose: 'Tutup secara otomatis',
    reopen: 'Buka kembali',
    submit: 'Kirim',
    approve: 'Setujui',
    reject: 'Tolak',
    requestInfo: 'Kirim kembali',
    resubmit: 'Kirim ulang',
    withdraw: 'Tarik kembali',
    escalate: 'Tingkatkan',
    paid: 'Mark membayar',
  },
  runs: {
    queued: 'Mengantri',
    running: 'Sedang berjalan',
    succeeded: 'Berhasil',
    failed: 'Gagal',
    dead: 'Menyerah',
    cancelled: 'Dibatalkan',
  },
};

export default idID;
