:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mulai Cepat

## Konfigurasi Alur Kerja Pertama Anda

Masuk ke halaman manajemen *plugin* alur kerja dari menu konfigurasi *plugin* di bilah menu atas:

![Akses manajemen plugin alur kerja](https://static-docs.nocobase.com/20251027222721.png)

Antarmuka manajemen akan menampilkan semua alur kerja yang telah dibuat:

![Manajemen Alur Kerja](https://static-docs.nocobase.com/20251027222900.png)

Klik tombol "Baru" untuk membuat alur kerja baru dan pilih Event Koleksi:

![Buat Alur Kerja](https://static-docs.nocobase.com/20251027222951.png)

Setelah mengirimkan, klik tautan "Konfigurasi" di daftar untuk masuk ke antarmuka konfigurasi alur kerja:

![Alur kerja kosong](https://static-docs.nocobase.com/20251027223131.png)

Kemudian, klik kartu *trigger* untuk membuka *drawer* konfigurasi *trigger*. Pilih sebuah koleksi yang telah dibuat sebelumnya (misalnya, koleksi "Artikel"), untuk waktu *trigger*, pilih "Setelah data ditambahkan", dan klik tombol "Simpan" untuk menyelesaikan konfigurasi *trigger*:

![Konfigurasi Trigger](https://static-docs.nocobase.com/20251027224735.png)

Selanjutnya, kita dapat mengklik tombol plus di alur untuk menambahkan sebuah *node*. Misalnya, pilih *node* perhitungan yang digunakan untuk menggabungkan bidang "Judul" dan bidang "ID" dari data *trigger*:

![Tambah Node Perhitungan](https://static-docs.nocobase.com/20251027224842.png)

Klik kartu *node* untuk membuka *drawer* konfigurasi *node*. Gunakan fungsi perhitungan `CONCATENATE` yang disediakan oleh Formula.js untuk menggabungkan bidang "Judul" dan "ID". Kedua bidang ini dimasukkan melalui pemilih variabel:

![Node perhitungan menggunakan fungsi dan variabel](https://static-docs.nocobase.com/20251027224939.png)

Setelah itu, buat *node* pembaruan data untuk menyimpan hasilnya ke bidang "Judul":

![Buat Node Pembaruan Data](https://static-docs.nocobase.com/20251027232654.png)

Demikian pula, klik kartu untuk membuka *drawer* konfigurasi *node* pembaruan data. Pilih koleksi "Artikel". Untuk ID data yang akan diperbarui, pilih ID data dari *trigger*. Untuk item data yang akan diperbarui, pilih "Judul". Untuk nilai data yang akan diperbarui, pilih hasil dari *node* perhitungan:

![Konfigurasi Node Pembaruan Data](https://static-docs.nocobase.com/20251027232802.png)

Terakhir, klik tombol *toggle* "Aktifkan"/"Nonaktifkan" di bilah alat kanan atas untuk mengubah status alur kerja menjadi aktif, sehingga alur kerja dapat dipicu dan dijalankan.

## Memicu Alur Kerja

Kembali ke antarmuka utama sistem, buat sebuah artikel melalui blok artikel, dan isi judul artikel:

![Buat data artikel](https://static-docs.nocobase.com/20251027233004.png)

Setelah mengirimkan dan menyegarkan blok, Anda dapat melihat bahwa judul artikel telah diperbarui secara otomatis menjadi format "Judul Artikel + ID Artikel":

![Judul artikel dimodifikasi oleh alur kerja](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Tips}
Karena alur kerja yang dipicu oleh event koleksi dieksekusi secara asinkron, Anda tidak dapat melihat pembaruan data segera di antarmuka setelah mengirimkan data. Namun, setelah beberapa saat, Anda dapat melihat konten yang diperbarui dengan menyegarkan halaman atau blok.
:::

## Melihat Riwayat Eksekusi

Alur kerja tadi telah berhasil dipicu dan dieksekusi sekali. Kita dapat kembali ke antarmuka manajemen alur kerja untuk melihat riwayat eksekusi yang sesuai:

![Lihat daftar alur kerja](https://static-docs.nocobase.com/20251027233246.png)

Di daftar alur kerja, Anda dapat melihat bahwa alur kerja ini telah menghasilkan satu riwayat eksekusi. Klik tautan di kolom jumlah untuk membuka catatan riwayat eksekusi untuk alur kerja yang sesuai:

![Daftar riwayat eksekusi untuk alur kerja yang sesuai](https://static-docs.nocobase.com/20251027233341.png)

Kemudian, klik tautan "Lihat" untuk masuk ke halaman detail untuk eksekusi tersebut, di mana Anda dapat melihat status eksekusi dan data hasil untuk setiap *node*:

![Detail riwayat eksekusi alur kerja](https://static-docs.nocobase.com/20251027233615.png)

Data konteks *trigger* dan data hasil eksekusi *node* dapat dilihat dengan mengklik tombol status di sudut kanan atas kartu yang sesuai. Misalnya, mari kita lihat data hasil dari *node* perhitungan:

![Hasil node perhitungan](https://static-docs.nocobase.com/20251027233635.png)

Anda dapat melihat bahwa data hasil dari *node* perhitungan berisi judul yang telah dihitung. Judul ini adalah data yang digunakan oleh *node* pembaruan data selanjutnya.

## Ringkasan

Melalui langkah-langkah di atas, kita telah menyelesaikan konfigurasi dan pemicuan alur kerja sederhana dan juga telah mengenal beberapa konsep dasar berikut:

-   **Alur Kerja**: Digunakan untuk mendefinisikan informasi dasar sebuah alur, termasuk nama, jenis *trigger*, dan status aktif. Anda dapat mengkonfigurasi berapa pun jumlah *node* di dalamnya. Ini adalah entitas yang menampung alur.
-   **Trigger**: Setiap alur kerja berisi satu *trigger*, yang dapat dikonfigurasi dengan kondisi spesifik agar alur kerja dapat dipicu. Ini adalah titik masuk alur.
-   **Node**: Sebuah *node* adalah unit instruksi dalam sebuah alur kerja yang melakukan tindakan spesifik. Beberapa *node* dalam alur kerja membentuk alur eksekusi yang lengkap melalui hubungan hulu dan hilir.
-   **Eksekusi**: Sebuah eksekusi adalah objek eksekusi spesifik setelah alur kerja dipicu, juga dikenal sebagai catatan eksekusi atau riwayat eksekusi. Ini berisi informasi seperti status eksekusi dan data konteks *trigger*. Ada juga hasil eksekusi yang sesuai untuk setiap *node*, yang mencakup status eksekusi *node* dan informasi data hasil.

Untuk penggunaan yang lebih mendalam, Anda dapat merujuk pada konten berikut:

-   [Trigger](./triggers/index)
-   [Node](./nodes/index)
-   [Menggunakan Variabel](./advanced/variables)
-   [Eksekusi](./advanced/executions)
-   [Manajemen Versi](./advanced/revisions)
-   [Opsi Lanjutan](./advanced/options)