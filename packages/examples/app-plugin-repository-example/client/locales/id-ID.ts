import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const idID: LocaleResource<typeof enUS> = {
  closeDialog: 'Tutup',
  sortTitle: 'Urutkan contoh',
  sortIntro:
    'Jalankan contoh penyortiran read-only menggunakan klien Repositori HTTP. Cuplikan pembuat menyertai permintaan serial yang sebenarnya; tabel mempertahankan urutan respons server. Kueri mengembalikan paling banyak 10 akar dan menggunakan kembali CRM dan benih hubungan yang ada.',
  sortLimits:
    'Gunakan nama bidang logis. Banyak jalur memerlukan agregat; to-one termasuk tidak menerima jenis lokal. Kursor memerlukan sumbu skalar langsung yang tidak dapat dibatalkan dan tie-break yang unik; yang berbeda hanya menerima penyortiran skalar langsung dengan tie-break yang unik. Teks dan JSON tidak dapat diurutkan.',
  sortRequest: 'Permintaan sebenarnya · JSON AST',
  sortResultHint:
    'Baris mempertahankan urutan server. Nilai relasi dipilih secara eksplisit; pratinjau rekaman mungkin lebih pendek dari jumlah agregat.',
  sortExpectedError: 'Kesalahan validasi yang diharapkan',
  sortUnexpectedSuccess: 'Kueri tidak valid ini berhasil secara tak terduga.',
  sort_default_title: 'Urutan kunci utama default',
  sort_default_description:
    'Abaikan pengurutan: pelanggan dikembalikan dengan kunci utama menaik.',
  sort_asc_title: 'Harga produk naik',
  sort_asc_description:
    'Mengembalikan satu ekspresi menaik untuk unitPriceCents; harga adalah sen bilangan bulat.',
  sort_desc_title: 'Harga produk turun',
  sort_desc_description:
    'Mengembalikan satu ekspresi menurun untuk unitPriceCents; harga adalah sen bilangan bulat.',
  sort_multi_title: 'Berbagai bidang dan tie-break otomatis',
  sort_multi_description:
    'Kuantitas menurun, lalu harga snapshot naik. Pasangan yang sama menggunakan urutan ID yang ditambahkan dalam urutan menaik; demo-item-3 dan demo-item-7 menunjukkan hasil yang sama.',
  'sort_nulls-first_title': 'nilai NULL terlebih dahulu',
  'sort_nulls-first_description':
    'AssigneeId yang dapat dibatalkan naik dengan NULL terlebih dahulu. Tugas yang belum ditetapkan tetap terlihat dan ID memutuskan hubungan.',
  'sort_nulls-last_title': 'Nilai NULL terakhir',
  'sort_nulls-last_description':
    'AssigneeId yang dapat dibatalkan naik dengan NULL terakhir. Penempatan eksplisit menghindari default NULL khusus database.',
  'sort_to-one_title': 'Urutkan relasi ke satu',
  'sort_to-one_description':
    'Nama penerima tugas menurun, penerima tugas hilang terakhir. Penyertaan terpisah mengembalikan nama yang digunakan untuk pengurutan.',
  sort_count_title: 'Jumlah relasi dan pilihan yang difilter',
  sort_count_description:
    'Beri peringkat berdasarkan semua pesanan, termasuk hitungan 0.paidCount memilih pesanan berbayar saja; filternya tidak mempengaruhi jenis root.',
  sort_include_title: 'Independen termasuk ketertiban',
  sort_include_description:
    'Pelanggan naik berdasarkan ID sementara setiap pesanan pelanggan turun berdasarkan nomor. Batas dua catatan berlaku per pelanggan.',
  sort_duplicate_title: 'Ditolak: target pengurutan duplikat',
  sort_duplicate_description:
    'Bidang yang sama tidak dapat muncul dua kali, meskipun dengan arah yang berbeda. Jalankan untuk memeriksa INVALID_SORT.',
  'sort_to-many_title': 'Ditolak: jalur bidang langsung ke banyak',
  'sort_to-many_description':
    'items.quantity memiliki beberapa nilai per produk. Gunakan agregat relasi eksplisit sebagai gantinya.',
  sort_sum_title: 'Peringkat SUM Relasi',
  sort_sum_description:
    'Beri peringkat produk berdasarkan SUM kuantitas item, turunkan dengan NULL terlebih dahulu. Relasi kosong diurutkan sebagai 0, meskipun SUM yang dipilih adalah NULL. Metrik dan baris item dipilih secara eksplisit.',
  sort_avg_title: 'Relasi peringkat AVG',
  sort_avg_description:
    'Beri peringkat produk berdasarkan AVG kuantitas item, turunkan dengan NULL terlebih dahulu. Relasi kosong diurutkan sebagai NULL. Metrik dan baris item dipilih secara eksplisit.',
  sort_min_title: 'Peringkat MIN hubungan',
  sort_min_description:
    'Beri peringkat produk berdasarkan MIN kuantitas item, turunkan dengan NULL terlebih dahulu. Relasi kosong diurutkan sebagai NULL. Metrik dan baris item dipilih secara eksplisit.',
  sort_max_title: 'Peringkat Relasi MAX',
  sort_max_description:
    'Beri peringkat produk berdasarkan MAX kuantitas item, turunkan dengan NULL terlebih dahulu. Relasi kosong diurutkan sebagai NULL. Metrik dan baris item dipilih secara eksplisit.',
  selectCombineTitle: 'Pilih gabungkan',
  selectCombineIntro:
    'Mengembalikan daftar rekaman bernama dan agregat skalar dari relasi yang sama dengan select.combine. Setiap contoh menjalankan satu permintaan Repositori findMany read-only.',
  combineScopeHint:
    'Menampilkan 10 catatan akar pertama berdasarkan ID. Batasan relasi berlaku per induk dan per cabang. Jalankan migrasi aplikasi dan seed jika tidak ada contoh rekaman.',
  combineRequest: 'Permintaan · pilih AST',
  combineTable: 'Tabel data',
  combineJson: 'JSON mentah',
  combineNoRelated: 'Tidak ada catatan terkait',
  combineTableHint:
    'Kolom menggunakan jalur bidang respons. Cabang rekaman muncul sebagai tabel bertumpuk; NULL berbeda dari daftar nol dan kosong.',
  combineRun: 'Jalankan kueri',
  combineResult: 'Hasil kueri',
  combineResultHint:
    'Respon aktual: cabang bernama berada di dalam setiap objek relasi.',
  combineEmpty:
    'Tidak ada catatan root. Jalankan migrasi dan benih aplikasi, atau buat catatan contoh.',
  combine_preview_title: 'Pratinjau pesanan dan cabang independen',
  combine_preview_description:
    'Satu pesanan dalam pratinjau, jumlah pesanan penuh, jumlah pembayaran, dan catatan yang dibatalkan. Batas pratinjau tidak membatasi cabang saudara. Pelanggan tanpa pesanan menyimpan daftar kosong dan tidak dihitung.',
  combine_statistics_title: 'Catatan item dan beberapa agregat',
  combine_statistics_description:
    'Dua baris item di samping COUNT, kuantitas SUM, dan harga unit snapshot AVG/MIN/MAX dalam sen. AVG tidak berbobot; relasi kosong mengembalikan hitungan 0 dan null untuk agregat lainnya.',
  combine_nested_title: 'Pesanan, barang, dan produk bersarang',
  combine_nested_description:
    'Setiap pelanggan mendapat pratinjau dan penghitungan pesanan. Setiap pesanan yang dipratinjau menggabungkan pratinjau item, jumlah, dan jumlah kuantitas; catatan item juga menyertakan nama produknya.',
  combine_scoped_title: 'Filter bersama dan filter cabang-lokal',
  combine_scoped_description:
    'Filter tugas draf berlaku untuk setiap cabang. COUNT(assigneeId) menghitung penerima tugas yang bukan nol; unassigned menambahkanassigneeId = null. Pratinjau satu baris tidak mengubah jumlah mana pun.',
  combine_tags_title: 'Kombinasi tag banyak-ke-banyak',
  combine_tags_description:
    'Mengembalikan tag tertaut setiap proyek, jumlah total, dan jumlah Dokumentasi. Filter cabang tetap berada di dalam relasi proyek itu; tag yang tidak tertaut dikecualikan.',
  apiExamples: 'Contoh repositori',
  labIntro:
    'Jelajahi satu operasi hubungan dalam satu waktu. Pilih relasi, siapkan contoh independen, lalu gunakan bentuk dan tabelnya. Setiap kartu memiliki proyek dan targetnya sendiri; memuat halaman ini tidak menulis apa pun.',
  labOperations: 'Operasi hubungan',
  labBoth: 'ke-satu / ke-banyak',
  labManyOnly: 'hanya untuk banyak orang',
  labRelation: 'Tipe relasi',
  labPrepare: 'Siapkan contoh',
  labPrepareAgain: 'Siapkan contoh baru',
  labRefresh: 'Segarkan tabel',
  labPrepareHint:
    'Persiapan menciptakan sebuah proyek dan empat target swasta. Persiapan baru mempertahankan contoh-contoh sebelumnya. Persiapan menggunakan banyak permintaan; setiap penulisan individu bersifat transaksional.',
  labProject: 'Contoh proyek',
  labDefaultContent: '{{operation}} contoh {{id}}',
  labSummary: 'Ringkasan profil',
  labLabel: 'Label label',
  labTitle: 'Judul tugas',
  labPoints: 'Poin',
  labTarget: 'Catatan sasaran',
  labChoose: 'Pilih rekaman',
  labNewTarget: 'Buat target baru pada putaran pertama',
  labNoEligible:
    'Tidak ada target yang memenuhi syarat. Siapkan contoh baru untuk dicoba lagi.',
  labSetTargets: 'Jaga agar target-target ini tetap terhubung',
  labSetEmpty:
    'Hapus centang semua untuk mengirim set: []. Target yang dihapus tetap ada di tabel target.',
  labThroughRole: 'Peran pada tautan ini (through.role)',
  labCurrentProfile: 'Profil saat ini',
  labNoProfile: 'Saat ini tidak ada profil yang ditautkan.',
  labDeleteHint:
    'Ini menghapus contoh rekaman target yang dipilih. Ini bukanlah pemutusan hubungan; baris dibawahnya akan tetap menjadi hasil penghapusan.',
  labUpsertHint:
    'Jalankan pertama dapat membuat target; selanjutnya dijalankan dengan target yang sama, perbarui. Target di luar hubungan ini tidak memenuhi syarat.',
  labExecute: 'Jalankan {{operation}}',
  labRequest: 'Pratinjau permintaan operasi ini',
  labSaved: 'Penulisan {{operation}} berhasil.',
  labRefreshFailed:
    'Penulisan berhasil, tetapi penyegaran tabel gagal. Gunakan Refresh tabel sebelum penulisan lainnya.',
  labTargets: 'Target dan status hubungan',
  labTableHint:
    'Setiap target dibaca secara independen: putuskan/tetapkan target tetap, sementara hapus menghapusnya. Hanya target kartu ini yang tercantum.',
  labRecord: 'Rekaman',
  labLinked: 'Terkait dengan proyek ini',
  labExists: 'Target ada',
  labDeleted: 'Target dihapus',
  labYes: 'Ya',
  labNo: 'Tidak',
  labLastCall: 'Permintaan dan respons yang terakhir dieksekusi',
  lab_create_title: 'Buat dan tautkan',
  lab_create_description:
    'Buat target melalui relasi. Repositori mengisi kunci hubungan. Pembuatan hasOne memerlukan relasi kosong dalam contoh ini.',
  lab_connect_title: 'Tautkan target yang ada',
  lab_connect_description:
    'Pilih target yang tidak tertaut yang disiapkan untuk kartu ini. Tidak ada target yang dibuat dengan koneksi. Target hasOne harus tersedia.',
  lab_disconnect_title: 'Putuskan tautan dan pertahankan target',
  lab_disconnect_description:
    'Hapus tautan hasOne yang dapat dibatalkan, lepaskan target hasMany, atau hapus tautan tabel gabung. Targetnya tetap ada.',
  lab_set_title: 'Ganti kumpulan hubungan',
  lab_set_description:
    'Pertahankan persis target yang telah dipilih. Hanya kumpulan dukungan hubungan ke-banyak; nullable hasMany kunci mengizinkan penghapusan.',
  lab_update_title: 'Edit target tertaut',
  lab_update_description:
    'Edit satu target dalam relasi saat ini. Pembaruan ke satu menggunakan targetnya saat ini tanpa pemilih.',
  lab_upsert_title: 'Perbarui atau buat dalam lingkup relasi',
  lab_upsert_description:
    'Buat ketika tidak ada target yang cocok yang ditautkan, jika tidak, perbarui. To-many menggunakan ID unik yang stabil untuk pencarian dan pembuatan.',
  lab_delete_title: 'Hapus catatan target',
  lab_delete_description:
    'Hapus target tertaut, tergantung pada batasan. Gunakan hanya target khusus yang disiapkan untuk kartu ini; target bersama dapat mempengaruhi hubungan lainnya.',
  relationMutationsTitle: 'Hubungan menulis',
  relationMutationsIntro:
    'Jalankan alur kerja hubungan Repositori HTTP lengkap di seluruh milikTo, hasOne, hasMany dan milikToMany. Setiap tombol menggunakan api.repository(name); tidak ada titik akhir mutasi spesifik contoh yang terlibat.',
  relationBaselineTitle: 'Garis dasar hubungan yang diunggulkan',
  relationBaselineDescription:
    'Catatan deterministik mencerminkan dokumentasi penulisan hubungan Repositori saat menggunakan nama koleksi yang diawali plugin.',
  relationSeedHint:
    'Jalankan migrasi aplikasi dan seed untuk membuat catatan contoh hubungan.',
  relationRunTitle: 'Panduan mutasi lengkap',
  relationRunDescription:
    'Membuat grafik proyek terisolasi, menerapkan operasi hubungan tambahan, lalu mengganti kumpulan tagnya. Setiap mutasi akar bersifat transaksional.',
  relationRunButton: 'Jalankan penulisan hubungan lengkap',
  relationRunIsolation:
    'Setiap proses menggunakan ID baru, sehingga contoh sebelumnya tetap tersedia untuk diperiksa.',
  relationResultTitle: 'Keadaan hubungan terakhir',
  relationResultDescription:
    'Pemilik dan profil diperbarui, operasi tugas diterapkan dalam cakupan relasi, dan set hanya mempertahankan tag yang dipilih.',
  relationLifetimeTitle: 'Targetkan pemeriksaan seumur hidup',
  relationLifetimeDescription:
    'putuskan dan atur hapus tautan tetapi pertahankan target; delete menghapus catatan target.',
  relationTraceHint:
    'Nama Repositori aktual, payload createOne/updateOne, dan respons yang dikeluarkan oleh proses ini.',
  relationOwnerLabel: 'milik · pemilik',
  relationProfileLabel: 'hasOne · profil',
  relationTasksLabel: 'memiliki banyak · tugas',
  relationTagsLabel: 'milikToMany · tag',
  relationTasks: 'Tugas terkait',
  relationPoints: 'Poin',
  relationAssignee: 'Penerima tugas',
  relationDisconnectCheck:
    'putuskan sambungan: tugas ada={{exists}}, projectId={{projectId}}',
  relationDeleteCheck: 'hapus: tugas ada={{exists}}',
  relationSetCheck: 'disetel: tag yang dihapus ada={{exists}}',
  findManyTitle: 'findMany: array dan aliran',
  findManyIntro:
    'Jalankan kueri Repositori yang sama dalam dua mode konsumsi. Tunggu penyelesaian sekali dengan susunan lengkap; iterasi async membaca data NDJSON yang dibingkai saat data tersebut tiba. Kueri database, filter, pengurutan, dan batasan tetap sama.',
  findManyArrayTitle: 'Tunggu sebuah array',
  findManyArrayDescription:
    'Menunggu findMany mengirimkan permintaan JSON normal dan menyelesaikan dengan semua catatan yang cocok.',
  findManyStreamTitle: 'Ulangi aliran',
  findManyStreamDescription:
    'Menggunakan for menunggu mengirimkan permintaan NDJSON dan menambahkan setiap catatan yang didekodekan ke tabel hasil.',
  findManyProtocol: 'Tanggapan HTTP',
  findManyRunArray: 'Jalankan kueri array',
  findManyRunStream: 'Jalankan kueri aliran',
  findManyReceived: 'Catatan diterima',
  findManyReceivedCount: 'Catatan {{count}} diterima',
  findManyResults: 'Hasil',
  findManyRecordTitle: 'Judul',
  findManyCategory: 'Kategori',
  findManyDescription: 'Deskripsi',
  findManyEmpty:
    'Jalankan kueri ini untuk memuat catatan contoh yang diunggulkan.',
  atomicTitle: 'Pembaruan numerik atom',
  atomicIntro:
    'Perbarui angka secara langsung di database dengan penambahan, pengurangan, dan perkalian. Permintaan mengirimkan operasi, tidak pernah berupa nilai yang dihitung dari snapshot browser yang berpotensi basi. Semua pengguna yang masuk membagikan contoh penghitung ini.',
  atomicStock: 'Stok gudang',
  atomicStockHint:
    'Menerima atau mengurangi unit. Pengurangan memeriksa stok yang tersedia dalam pembaruan yang sama, mencegah inventaris negatif.',
  atomicWallet: 'Saldo akun (sen)',
  atomicWalletHint:
    'Isi ulang atau belanjakan sen bilangan bulat. Kondisi keseimbangan dan pengurangan dievaluasi bersama dalam database.',
  atomicPoints: 'Poin hadiah',
  atomicPointsHint:
    'Tambahkan poin atau gandakan poin saat ini menggunakan perkalian: 2. Penggandaan menggunakan nilai database saat ini.',
  atomicVisits: 'Kunjungi konter',
  atomicVisitsHint:
    'Kenaikan satu kali, atau kirim 10 kenaikan bersamaan: 1 permintaan. Pengguna lain juga dapat mengubah penghitung bersama ini.',
  atomicAmount: 'Jumlah',
  atomic_increment: 'Meningkat',
  atomic_decrement: 'Menurun (dijaga)',
  atomic_multiply: 'Ganda ×2',
  atomic_concurrent: '10 bersamaan +1',
  atomicSeedHint:
    'Jalankan migrasi aplikasi dan seed untuk membuat penghitung contoh ini.',
  atomicInsufficient:
    'Penghitung telah dihapus, atau nilainya saat ini tidak mencukupi. Tidak ada yang dikurangi.',
  atomicUpdated: 'Basis data mengembalikan nilai baru: {{value}}.',
  atomicConcurrentResult:
    '{{count}} dari 10 peningkatan bersamaan berhasil. Nilai yang ditampilkan dibaca kembali dari database.',
  atomicPartial:
    'Beberapa peningkatan gagal. Permintaan yang berhasil tetap dilakukan; periksa hasilnya sebelum mencoba lagi.',
  atomicTraceHint:
    'Pembaruan aktualSatu masukan dan tanggapan, termasuk pembaruan yang ditolak. Tidak ada percobaan ulang otomatis yang dilakukan.',
  groupByExamples: 'Lebih banyak contoh groupBy',
  groupByMinimumCount: 'Baris minimum per grup (contoh baru)',
  groupByEmpty:
    'Tidak ada grup yang cocok dengan filter ini. Kurangi jumlah minimum atau ubah status.',
  groupBy_customerRanking: 'Peringkat pesanan pelanggan',
  groupBy_customerRankingHint:
    'KELOMPOK BERDASARKAN customerId · COUNT(*) · MEMILIKI hitungan ≥ minimum · hitungan DESC, customerId ASC. Pelanggan tanpa pesanan yang cocok tidak membentuk grup.',
  groupBy_customerStatus: 'Pelanggan × status pesanan',
  groupBy_customerStatusHint:
    'KELOMPOK BERDASARKAN ID pelanggan, status. Pelanggan yang sama dapat muncul di beberapa grup status. HAVING berlaku untuk setiap kombinasi, bukan total pelanggan. Grup enum mempertahankan nilai eksak; penyortiran menggunakan hitungan dan ID pelanggan.',
  groupBy_productPrice: 'Produk × harga satuan barang',
  groupBy_productPriceHint:
    'KELOMPOK BERDASARKAN productId, unitPriceCents · COUNT(*) dan SUM(quantity). Harga cuplikan item yang berbeda tetap terpisah bahkan untuk produk yang sama. Urutkan berdasarkan kuantitas DESC, productId ASC, harga ASC. Harga adalah sen; COUNT mengukur baris item, bukan unit.',
  aggregateApply: 'Terapkan',
  aggregateTitle: 'Kueri agregat',
  aggregateIntro:
    'Statistik sisi basis data atas pesanan dan item yang ada: agregat, groupBy dengan HAVING, dan jumlah hubungan per pelanggan. Filter status berlaku untuk semua panel; jumlah minimum hanya berlaku untuk kelompok produk. Jumlah baris minimum berlaku untuk tiga contoh groupBy tambahan.',
  aggregateAll: 'Semua status',
  aggregateHaving: 'Kuantitas minimum yang dikelompokkan (HAVING)',
  aggregateMetrics: 'Agregat item',
  aggregate_count: 'COUNT · baris item',
  aggregate_quantity: 'JUMLAH · kuantitas',
  aggregate_averagePrice: 'AVG · harga satuan (sen)',
  aggregate_minimumPrice: 'MIN · harga satuan (sen)',
  aggregate_maximumPrice: 'MAX · harga satuan (sen)',
  aggregateSemantics:
    'Harga rata-rata adalah rata-rata harga satuan barang yang tidak tertimbang, bukan total pesanan atau harga tertimbang kuantitas. Set kosong mengembalikan jumlah 0 dan NULL untuk SUM/AVG/MIN/MAX. Panel menjalankan kueri terpisah dan mungkin mengamati pengeditan secara bersamaan.',
  aggregateStatuses: 'Pesanan dikelompokkan berdasarkan status · groupBy',
  aggregateCustomers: 'Agregat hubungan pelanggan',
  aggregateCustomerHint:
    'Pelanggan {{count}} pertama berdasarkan ID, termasuk pelanggan yang tidak memiliki pesanan yang cocok. Hitungan menggunakan status yang dipilih.',
  aggregateProducts: 'Item dikelompokkan berdasarkan produk',
  aggregateTraceHint:
    'Memanggil tindakan agregat/groupBy Repositori HTTP yang dikonfigurasi dengan AST JSON; jumlah pelanggan menggunakan pilihan relasi findMany. Perluas permintaan untuk memeriksa ekspresi sebenarnya.',
  crm: 'Contoh CRM',
  ordersTitle: 'Contoh pesanan',
  subtitle: 'Pelanggan, hubungan, dan pesanan, didukung oleh API Repositori.',
  customer: 'Pelanggan',
  contact: 'Kontak',
  product: 'Produk',
  order: 'Pesanan',
  orderItem: 'Barang pesanan',
  customers: 'Pelanggan',
  contacts: 'Kontak',
  products: 'Produk',
  orders: 'Pesanan',
  items: 'Memesan item',
  name: 'Nama',
  company: 'Perusahaan',
  email: 'Email',
  phone: 'Telepon',
  status: 'Status',
  sku: 'SKU',
  unitPriceCents: 'Harga satuan (sen)',
  number: 'Nomor pesanan',
  customerId: 'Pelanggan',
  orderId: 'Pesanan',
  productId: 'Produk',
  quantity: 'Kuantitas',
  lead: 'Prospek',
  active: 'Aktif',
  inactive: 'Tidak aktif',
  draft: 'Draf',
  confirmed: 'Dikonfirmasi',
  paid: 'Dibayar',
  cancelled: 'Dibatalkan',
  new: 'Rekor baru',
  edit: 'Edit',
  view: 'Lihat detailnya',
  delete: 'Hapus',
  save: 'Simpan',
  cancel: 'Batal',
  search: 'Cari berdasarkan nama / nomor / ID',
  apply: 'Cari',
  refresh: 'Segarkan',
  previous: 'Sebelumnya',
  next: 'Berikutnya',
  page: 'Halaman {{page}}',
  count: 'Catatan {{count}}',
  empty: 'Belum ada catatan. Buat rekaman pertama untuk memulai.',
  loading: 'Memuat…',
  listFeedback: {
    loading: 'Memuat',
    empty: 'Belum ada data',
    noResults: 'Tidak ada hasil',
    forbidden: 'Akses ditolak',
    unauthenticated: 'Sesi telah kedaluwarsa',
    failed: 'Tidak dapat memuat daftar',
    refreshFailed: 'Gagal menyegarkan; menampilkan data sebelumnya',
    retry: 'Coba lagi',
    retrying: 'Mencoba lagi…',
    clear: 'Hapus filter',
    signIn: 'Masuk',
  },
  select: 'Pilih rekaman',
  createTitle: 'Buat {{entity}}',
  editTitle: 'Sunting {{entity}}',
  details: 'Catat detailnya',
  relations: 'Catatan terkait',
  none: 'Tidak ada',
  lookup: 'Cari berdasarkan ID',
  check: 'Periksa dan buka',
  notFound: 'Tidak ada catatan dengan ID ini.',
  found: 'Catatan ada.',
  saved: 'Rekam disimpan.',
  deleted: 'Rekam dihapus.',
  confirmDelete:
    'Hapus catatan ini? Kontak terkait atau item pesanan juga akan dihapus. Pelanggan dengan pesanan dan produk yang digunakan item pesanan tidak dapat dihapus.',
  confirm: 'Konfirmasi penghapusan',
  trace: 'Panggilan repositori',
  traceHint:
    'Permintaan dan hasil terbaru menunjukkan API yang digunakan oleh layar ini.',
  error: 'Operasi gagal.',
  loadError: 'Tidak dapat memuat catatan. Coba lagi dengan Segarkan.',
  conflict:
    'Pesanan ini berubah sejak Anda membukanya. Segarkan dan buka kembali sebelum mengedit.',
  choicesHint:
    'Buat pelanggan dan produk terlebih dahulu, lalu pesanan dan itemnya.',
  moneyHint:
    'Harga adalah sen bilangan bulat. Total baris = kuantitas × harga satuan; tidak ada matematika mata uang floating point.',
  version: 'Versi',
  addItem: 'Tambahkan barang',
  removeItem: 'Hapus item',
  orderTotal: 'Total pesanan (sen)',
  noItems: 'Tidak ada item pesanan.',
  itemRow: 'Barang {{number}}',
  lineTotal: 'Total baris (sen)',
  id: 'ID',
  back: 'Kembali ke daftar',
  close: 'Tutup detailnya',
  request: 'Permintaan',
  response: 'Tanggapan',
  loadingChoices: 'Memuat catatan terkait…',
};

export default idID;
