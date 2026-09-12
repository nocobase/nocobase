# Maksud desain `nb proxy`

Jika kita hanya berbicara tentang proses inti, cukup mengingat 3 perintah ini:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Dalam sebagian besar skenario, apa yang Anda gunakan untuk melakukan `nb proxy` pada dasarnya adalah tiga langkah berikut:

1. Pertama gunakan `use` untuk memilih mode berjalan dari penyedia saat ini
2. Kemudian gunakan `generate` untuk menghasilkan konfigurasi entri sesuai env dan nama domain
3. Terakhir gunakan `reload` agar konfigurasi diterapkan

Jika Anda menggunakan Caddy, ganti saja `nginx` pada perintah dengan `caddy`. Jika Nginx langsung terinstal di mesin, ganti saja `docker` dengan `local`.

Ini juga merupakan pengalaman yang paling ingin diberikan oleh lapisan `nb proxy` ini: Anda tidak perlu masuk ke detail konfigurasi Nginx atau Caddy terlebih dahulu, cukup sambungkan pintu masuk sesuai dengan proses yang telah diperbaiki.

## Mengapa cukup dengan mengingat 3 hal ini terlebih dahulu?

Karena masalah yang diselesaikan oleh `nb proxy` sebenarnya sangat konvergen: **Berikan aplikasi pintu masuk akses eksternal yang stabil. **

Jika Anda sudah melihat [Ikhtisar Penerapan Lingkungan Produksi](../production/index.md), Anda dapat mengingatnya secara terpisah dari `nb app autostart` seperti ini:

- `nb app autostart` bertanggung jawab atas "cara melanjutkan menjalankan aplikasi setelah mesin dihidupkan ulang"
- `nb proxy` bertanggung jawab atas "bagaimana aplikasi dapat menyediakan akses eksternal yang stabil melalui Nginx atau Caddy"

Jadi dalam proses penerapan yang paling umum, `nb proxy` tidak memerlukan banyak pemikiran. Seringkali:

- Pilih mode operasi
- Hasilkan konfigurasi
- Memuat ulang mulai berlaku

Cukup.

## Apa yang dilakukan ketiga langkah ini?

### `use`

`use` memecahkan masalah "bagaimana mengelola agen saat ini".

Misalnya:

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

Anda dapat menganggapnya sebagai memilih driver default dari penyedia saat ini terlebih dahulu. Perintah berikut `start`, `reload`, dan `status` akan bekerja dengan cara ini.

### `generate`

`generate` memecahkan masalah "merender konfigurasi entri sesuai dengan env saat ini".

Misalnya:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Langkah ini akan menggabungkan informasi di env dengan parameter yang diperlukan oleh lapisan entri untuk menghasilkan konfigurasi proxy yang dapat digunakan. Masukan paling penting di sini biasanya adalah:

- `--env`: CLI mana yang berhasil diekspos
- `--host`: Nama domain mana yang akan diikat

Dengan kata lain, `generate` mengelola produk konfigurasi, bukan status proses.

### `reload`

`reload` memecahkan masalah "membuat konfigurasi yang baru dibuat benar-benar efektif".

```bash
nb proxy nginx reload
```

Pemisahan ini memiliki manfaat langsung: pembuatan konfigurasi dan tindakan proses tidak tercampur. Saat Anda mengubah nama domain, port, atau jalur publik, buat ulang terlebih dahulu, lalu putuskan untuk menerapkannya. Seluruh proses akan menjadi lebih jelas.

## Mengapa harus dirancang sebagai `use → generate → reload`

Karena ketiga langkah ini hanya berhubungan dengan tiga tindakan paling stabil di lapisan masuk:

- Putuskan dulu bagaimana menjalankan agen
- Kemudian putuskan entri apa yang akan dihasilkan untuk env yang mana
-Akhirnya biarkan konfigurasi diterapkan

Jika Anda memasukkan semua langkah ini ke dalam perintah kotak hitam, akan tampak bahwa ada lebih sedikit perintah di permukaan. Namun, ketika masalah terjadi, sulit untuk menentukan apakah driver yang dipilih salah, konfigurasi tidak dibuat dengan benar, atau agen belum dimuat ulang.

Nah setelah dibongkar seperti ini, jalur penyelidikannya akan lebih lurus:

- `use` Kalau salah potong saja drivernya
- `generate` salah, buat ulang konfigurasinya.
- Konfigurasi sudah benar tetapi belum berlaku, hanya `reload`

## Mengapa kita memerlukan `nb proxy` terpisah

Karena yang `nb proxy` ingin satukan bukanlah file konfigurasi Nginx tertentu, melainkan tindakan umum dari lapisan entri.

Yang benar-benar Anda pedulikan biasanya bukan:

-Di jalur manakah file konfigurasi berada?
- Perbedaan perintah antara Nginx dan Caddy
- Perbedaan operasional antara lokal dan buruh pelabuhan

Yang lebih Anda khawatirkan adalah:

- Bagaimana cara mengekspos lingkungan ini?
- Bagaimana cara mengubah nama domain saya?
- Bagaimana cara agar konfigurasi baru diterapkan?

`nb proxy` adalah menggabungkan tindakan ini ke dalam kumpulan entri CLI yang sama. Dengan cara ini, jika Anda mengingat proses inti terlebih dahulu, Anda sudah dapat mencakup sebagian besar skenario. Hanya ketika Anda ingin melanjutkan pemecahan masalah secara detail atau memerlukan konfigurasi khusus, lihat saja halaman penyedianya sendiri.

## Keseluruhan

- `nb proxy` Inti kegunaan pikiran adalah `use → generate → reload`
- Bagi sebagian besar pengguna, mengingat 3 perintah ini sudah cukup
- Fokus desainnya bukan untuk menyembunyikan semua detail, namun terlebih dahulu memperbaiki proses tingkat masuk yang paling umum.

Jika Anda ingin terus melihat perintah spesifik, Anda dapat langsung membuka [`nb proxy`](../../api/cli/proxy/index.md). Jika Anda siap untuk terhubung ke pintu masuk resmi, Anda juga dapat terus melihat [Reverse Proxy](../production/reverse-proxy/index.md).
