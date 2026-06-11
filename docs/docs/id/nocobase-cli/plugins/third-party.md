# Instalasi dan peningkatan plug-in pihak ketiga

Jika Anda mendapatkan paket plugin pihak ketiga, biasanya impor paket tersebut ke `storage/plugins` aplikasi target, lalu mulai ulang aplikasi, lalu lanjutkan mengaktifkan atau memverifikasi apakah plugin tersebut berfungsi.

## Indeks cepat

| saya ingin... | Di mana mencarinya |
| --- | --- |
| Pertama beralih ke env target, lalu mulai mengimpor atau memulai ulang plugin | [Konfirmasi lingkungan target terlebih dahulu](#Konfirmasi lingkungan target terlebih dahulu) |
| Impor plug-in pihak ketiga dari paket terkompresi jarak jauh, paket terkompresi lokal, atau npm | [Gunakan `nb plugin import` untuk mengimpor paket plug-in](#Gunakan -nb-plugin-import-Import paket plug-in) |
| Tentukan plugin impor penyimpanan | [Tentukan jalur penyimpanan yang akan diimpor](#Tentukan jalur penyimpanan yang akan diimpor) |
| Setelah impor selesai, biarkan aplikasi memuat ulang direktori plugin | [`nb app restart`](../../api/cli/app/restart.md) |
| Aktifkan plugin secara resmi setelah instalasi pertama | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| Tingkatkan versi plugin pihak ketiga yang diaktifkan | [Apa yang harus dilakukan saat mengupgrade plug-in](#Apa yang harus dilakukan saat mengupgrade plug-in) |
| Ingin memastikan apakah plugin sudah muncul di aplikasi saat ini | [`nb plugin list`](../../api/cli/plugin/list.md) |
| Mesin target tidak dapat terhubung langsung ke Internet, dan hanya dapat diunggah secara manual `.tgz` lalu diimpor | [Ketika Internet tidak dapat terhubung secara langsung](#Ketika Internet tidak dapat terhubung secara langsung) |

## Konfirmasikan lingkungan target terlebih dahulu

Jika Anda mengelola beberapa aplikasi secara lokal, pertama-tama beralihlah ke env target, lalu operasikan:

```bash
nb env use app1
```

## Gunakan `nb plugin import` untuk mengimpor paket plugin

`nb plugin import` mendukung tiga jenis sumber: paket terkompresi jarak jauh, paket terkompresi lokal, dan nama paket npm. Perintah ini hanya bertanggung jawab untuk mengimpor plugin ke `storage/plugins`, dan tidak akan mengaktifkan plugin secara otomatis.

Jika Anda telah memperoleh alamat pengunduhan paket plugin, jalur file lokal, atau plugin telah dipublikasikan ke npm, Anda dapat menjalankan:

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

Jika Anda menggunakan sumber npm pribadi, biasanya login terlebih dahulu lalu tentukan registri:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## Tentukan jalur penyimpanan yang akan diimpor

Jika Anda sudah mengetahui direktori root `storage` dari aplikasi target, Anda juga dapat meneruskan `--storage-path` secara langsung tanpa bergantung pada env saat ini:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

CLI akan menulis plugin ke `<storage-path>/plugins`. Saat ini, Anda tidak boleh menjalankan `nb env use` terlebih dahulu, atau meneruskan `--env`.

## Mulai ulang setelah mengimpor

Setelah impor selesai, mulai ulang aplikasi target:

```bash
nb app restart
```

Jika Anda tidak mengganti env saat ini terlebih dahulu, Anda juga dapat meneruskan `-e <env>` secara eksplisit dalam perintah.

## Aktifkan atau verifikasi setelah memulai ulang

Jika ini adalah instalasi pertama, mulai ulang lalu aktifkan plugin:

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

Instalasi akan selesai secara otomatis saat diaktifkan untuk pertama kalinya.

## Apa yang harus dilakukan saat mengupgrade plugin

Jika plugin sudah diaktifkan dan kali ini Anda baru saja beralih ke versi baru, biasanya hanya ada dua langkah:

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

Hal yang sama berlaku jika Anda mengimpor paket npm:

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

Dengan kata lain, skenario peningkatan tidak memerlukan eksekusi tambahan sebesar `nb plugin enable`. Cukup impor paket baru dan mulai ulang aplikasi.

## Ketika Internet tidak dapat terhubung secara langsung

Jika mesin target tidak dapat langsung mengakses alamat pengunduhan plugin, Anda dapat mengunggah file `.tgz` terlebih dahulu ke direktori mana pun di mesin target, lalu melakukan impor lokal pada mesin target.

Misalnya:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::catatan peringatan

Tidak perlu mengekstrak secara manual ke `storage/plugins` di sini. `nb plugin import` secara otomatis akan meletakkan plugin di direktori yang benar.

:::
