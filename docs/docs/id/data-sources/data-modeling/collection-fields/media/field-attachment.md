:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Bidang Lampiran

## Pendahuluan

Sistem memiliki tipe bidang "Lampiran" bawaan untuk mendukung pengguna mengunggah file di koleksi kustom.

Secara internal, bidang lampiran adalah bidang relasi banyak-ke-banyak yang menunjuk ke koleksi "Lampiran" (`attachments`) bawaan sistem. Saat Anda membuat bidang lampiran di koleksi mana pun, tabel penghubung banyak-ke-banyak akan secara otomatis dibuat. Metadata file yang diunggah akan disimpan di koleksi "Lampiran", dan informasi file yang direferensikan dalam koleksi Anda akan dihubungkan melalui tabel penghubung ini.

## Konfigurasi Bidang

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Batasan Tipe MIME

Digunakan untuk membatasi tipe file yang diizinkan untuk diunggah, menggunakan sintaks [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Contohnya: `image/*` mewakili file gambar. Beberapa tipe dapat dipisahkan dengan koma, seperti: `image/*,application/pdf`, yang berarti mengizinkan file tipe gambar dan PDF.

### Penyimpanan

Pilih mesin penyimpanan yang akan digunakan untuk file yang diunggah. Jika dibiarkan kosong, mesin penyimpanan bawaan sistem akan digunakan.