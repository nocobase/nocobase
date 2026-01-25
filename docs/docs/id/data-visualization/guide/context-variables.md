:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menggunakan Variabel Konteks

Dengan variabel konteks, Anda dapat menggunakan kembali informasi dari halaman saat ini, pengguna, waktu, atau kondisi filter untuk merender bagan dan mengaktifkan tautan berdasarkan konteks.

## Cakupan Aplikasi
- Kondisi filter dalam mode Builder untuk kueri data: pilih variabel untuk digunakan.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Penulisan pernyataan dalam mode SQL untuk kueri data: pilih variabel dan sisipkan ekspresi (misalnya, `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- Opsi bagan dalam mode Kustom: tulis ekspresi JS secara langsung.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Event interaksi (misalnya, klik untuk membuka dialog *drill-down* dan meneruskan data): tulis ekspresi JS secara langsung.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Catatan:**
- Jangan membungkus `{{ ... }}` dengan tanda kutip tunggal atau ganda; sistem akan menangani *binding* dengan aman berdasarkan tipe variabel (string, angka, waktu, NULL).
- Ketika variabel bernilai `NULL` atau tidak terdefinisi, tangani nilai kosong secara eksplisit dalam SQL menggunakan `COALESCE(...)` atau `IS NULL`.