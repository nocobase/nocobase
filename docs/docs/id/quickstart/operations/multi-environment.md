#Beberapa manajemen lingkungan

Jika Anda memelihara beberapa aplikasi NocoBase seperti `dev`, `test`, `staging`, `prod`, dll., Anda dapat menyimpannya masing-masing sebagai CLI env. Sebagian besar perintah `nb` di masa mendatang akan bekerja pada env saat ini secara default, jadi penting untuk mengonfirmasi env mana yang Anda gunakan sebelum menjalankan perintah seperti `nb app`, `nb api`, dan `nb db`.

Mulai dari versi ini, CLI membagi konsep menjadi `current env` dan `last env`. Anda biasanya hanya perlu memperhatikan `current env` - yang merupakan lingkungan yang digunakan runtime shell atau agen saat ini. CLI akan kembali ke `last env` global hanya ketika mode sesi tidak diaktifkan.

## Indeks cepat

| saya ingin... | Perintah mana yang harus digunakan |
| --- | --- |
| Buat env lokal baru dan selesaikan inisialisasi dengan lancar | [`nb init`](../../api/cli/init.md) |
| Daftarkan aplikasi yang ada sebagai CLI env | [`nb env add`](../../api/cli/env/add.md) |
| Lihat env mana yang disimpan secara lokal | [`nb env list`](../../api/cli/env/list.md) |
| Periksa konektivitas dan status otentikasi semua envs | [`nb env status --all`](../../api/cli/env/status.md) |
| Ganti env untuk digunakan oleh perintah selanjutnya | [`nb env use`](../../api/cli/env/use.md) |
| Konfirmasikan env mana dari perintah saat ini yang akan dimasukkan | [`nb env current`](../../api/cli/env/current.md) dan [`nb env status`](../../api/cli/env/status.md) |
| Lihat konfigurasi terperinci yang disimpan oleh env | [`nb env info`](../../api/cli/env/info.md) |
| Perbarui konfigurasi env yang disimpan, biarkan CLI menyinkronkan ulang status saat ini jika perlu | [`nb env update`](../../api/cli/env/update.md) |
| Otentikasi ulang setelah status login berakhir, atau gunakan metode otentikasi baru | [`nb env auth`](../../api/cli/env/auth.md) |
| Hapus konfigurasi env yang tidak digunakan dan bersihkan sumber daya lokal yang dihosting jika perlu | [`nb env remove`](../../api/cli/env/remove.md) |

:::tip Disarankan untuk mengaktifkan mode sesi terlebih dahulu

Secara default, disarankan untuk menjalankan [`nb session setup`](../../api/cli/session/setup.md) terlebih dahulu. Dengan cara ini, terminal yang berbeda, shell yang berbeda, atau runtime agen yang berbeda masing-masing dapat mempertahankan `current env` mereka sendiri, dan mereka tidak akan mudah mempengaruhi satu sama lain selama operasi paralel.

Jika mode sesi tidak diaktifkan, `nb env use` akan kembali memperbarui `last env` global. Dalam hal ini, jika salah satu terminal memutus lingkungan, terminal lainnya juga dapat terpengaruh.

```bash
nb session setup
```

:::

## Buat banyak lingkungan

Jika Anda ingin membuat atau memulihkan aplikasi lokal, gunakan saja `nb init`. Ini akan menyelesaikan inisialisasi dan menyimpan hasilnya ke dalam lingkungan CLI baru.

```bash
nb init --env dev
nb init --env test
```

Jika aplikasi sudah ada dan Anda hanya ingin menghubungkannya ke CLI, biasanya lebih mudah menggunakan `nb env add`:

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

Yang pertama lebih tentang "menginisialisasi lingkungan", sedangkan yang kedua lebih tentang "mendaftarkan lingkungan yang ada". Jika Anda baru menyambung ke aplikasi yang sudah ada, cukup gunakan `nb env add` secara default.

## Lihat lingkungan yang dikonfigurasi

Pertama gunakan `nb env list` untuk melihat envs mana yang telah disimpan secara lokal:

```bash
nb env list
```

Perintah ini hanya menampilkan konfigurasi itu sendiri dan tidak secara aktif memeriksa status aplikasi. Jika Anda ingin melihat status konektivitas dan autentikasi, gunakan `nb env status --all`:

```bash
nb env status --all
```

Anda biasanya akan melihat nilai status seperti `ok`, `auth failed`, `unreachable`.

## Ganti lingkungan saat ini

Gunakan `nb env use` untuk berpindah lingkungan:

```bash
nb env use dev
```

Setelah peralihan selesai, perintah berikutnya yang menghilangkan `--env` akan menggunakan env ini secara default.

## Periksa lingkungan saat ini

Jika Anda tidak yakin di lingkungan mana perintah saat ini akan berada, jalankan dua perintah ini terlebih dahulu:

```bash
nb env current
nb env status
```

`nb env current` digunakan untuk melihat nama, `nb env status` digunakan untuk melihat apakah env saat ini dapat diakses dan otentikasi normal.

## Lihat detail satu env

Jika Anda ingin melihat konfigurasi apa yang disimpan di env tertentu, gunakan `nb env info`:

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

Diantaranya, `--field` cocok untuk mengambil hanya satu nilai dalam skrip. `--show-secrets` akan menampilkan informasi sensitif seperti token dan kata sandi dalam teks biasa. Gunakan hanya jika Anda benar-benar perlu memecahkan masalah.

## Perbarui konfigurasi env

`nb env update` digunakan untuk menyesuaikan konfigurasi env yang disimpan. Seperti alamat API, metode otentikasi, sumber kode sumber, port aplikasi dan parameter database. Setelah pembaruan selesai, CLI secara otomatis menangani langkah-langkah tindak lanjut berdasarkan perubahan.

Jika Anda hanya ingin CLI melakukan sinkronisasi ulang sesuai dengan status terbaru dari env saat ini, tulis saja seperti ini:

```bash
nb env update
nb env update prod
```

Jika Anda ingin mengubah informasi koneksi atau konfigurasi lokal yang disimpan oleh env ini, Anda dapat secara eksplisit membawa parameter:

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

Di sini Anda pertama-tama dapat mengingat penilaian default:

- Untuk mengubah informasi koneksi atau konfigurasi lokal yang disimpan oleh env, gunakan `nb env update`
- Antarmuka aplikasi, plug-in, atau kemampuan CLI yang tersedia baru saja berubah, Anda juga dapat menjalankan `nb env update` lagi
- Status login telah kedaluwarsa, atau Anda harus melalui proses otentikasi lagi, gunakan `nb env auth`
- Hanya untuk melihat apa yang disimpan saat ini, gunakan `nb env info`

Jika Anda mengubah konfigurasi berjalan lokal seperti `app-port`, `timezone`, dan `db-*`, `update` hanya akan mengubah nilai yang disimpan dan tidak akan memulai ulang aplikasi secara otomatis. Secara umum, `nb app restart --env <name>` akan dieksekusi nanti; jika perubahan melibatkan database bawaan yang dikelola CLI, gunakan `nb app restart --env <name> --with-db`.

## Autentikasi ulang

Jika env telah disimpan, tetapi status login telah kedaluwarsa, atau Anda ingin mengganti metode autentikasi, Anda dapat mengautentikasi ulang:

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

Jika nama lingkungan dihilangkan, CLI menggunakan env saat ini. Setelah autentikasi selesai, CLI secara otomatis menangani sinkronisasi berikutnya.

## Hapus lingkungan

Skenario ini adalah yang paling membingungkan. Pertama-tama Anda dapat mengingat saran default:

- Jika Anda hanya ingin menghentikan aplikasi, gunakan `nb app stop`
- Saya juga ingin menghentikan runtime database bawaan pada mesin saat ini, gunakan `nb app stop --with-db`
- Jika Anda yakin env ini tidak diperlukan lagi, tetapi Anda ingin menyimpan penyimpanan dan file aplikasi lokal terlebih dahulu, gunakan `nb env remove`
- Bersihkan bahkan sumber daya hosting lokal dan gunakan `nb env remove --purge`

Jika Anda hanya ingin menghapus konfigurasi env yang disimpan:

```bash
nb env remove staging
```

Jika itu adalah env lokal atau yang dihosting Docker, dan Anda juga ingin membersihkan sumber daya yang berjalan dan data penyimpanan di mesin lokal, Anda dapat menambahkan `--purge`:

```bash
nb env remove test --purge
```

Dalam mode non-interaktif, `nb env remove` harus diteruskan dalam `--force` secara eksplisit:

```bash
nb env remove test --purge --force
```

`--purge` hanya akan membersihkan sumber daya yang dikelola CLI pada mesin saat ini. Untuk env API jarak jauh, ini tidak akan menghapus layanan jarak jauh itu sendiri.

Jika Anda hanya ingin menghentikan aplikasi dan database bawaan yang dikelola CLI, tulis saja:

```bash
nb app stop --env app1 --with-db
```

Jika Anda ingin menghapus env ini tetapi masih ingin menyimpan penyimpanan dan file aplikasi lokal:

```bash
nb env remove app1 --force
```

Jika Anda benar-benar ingin membersihkan konten yang dihosting secara asli di env ini, tambahkan `--purge`:

```bash
nb env remove app1 --purge --force
```

Untuk npm/Git env lokal yang dikelola oleh unduhan CLI, `--purge` juga menghapus file aplikasi lokal yang dihosting CLI. Untuk env HTTP atau SSH, ini hanya akan menghapus konfigurasi env yang disimpan di CLI dan tidak akan menghapus layanan eksternal itu sendiri.

## Tautan terkait

- [`nb env` Referensi Perintah](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` Referensi Perintah](../../api/cli/session/index.md)
- [nb maksud desain aplikasi](../cli-design/nb-app-design-intent.md)
- [Kelola Aplikasi](./manage-app.md)
