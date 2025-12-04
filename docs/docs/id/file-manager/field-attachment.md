:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Bidang Lampiran

## Pendahuluan

Sistem memiliki tipe bidang "Lampiran" bawaan untuk mendukung unggahan file di koleksi kustom.

Bidang Lampiran pada dasarnya adalah bidang relasi Banyak-ke-Banyak yang mengarah ke koleksi "Lampiran" (`attachments`) bawaan sistem. Ketika bidang Lampiran dibuat di koleksi mana pun, tabel penghubung untuk relasi banyak-ke-banyak akan secara otomatis dibuat. Metadata file yang diunggah akan disimpan di koleksi "Lampiran", dan informasi file yang direferensikan dalam koleksi akan dihubungkan melalui tabel penghubung ini.

## Konfigurasi Bidang

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Pembatasan Tipe MIME

Digunakan untuk membatasi tipe file yang diizinkan untuk diunggah, menggunakan format deskripsi sintaks [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Contoh: `image/*` mewakili file gambar. Beberapa tipe dapat dipisahkan dengan koma, misalnya: `image/*,application/pdf` mengizinkan tipe file gambar dan PDF.

### Mesin Penyimpanan

Pilih mesin penyimpanan yang digunakan untuk menyimpan file yang diunggah. Jika dikosongkan, mesin penyimpanan default sistem akan digunakan.