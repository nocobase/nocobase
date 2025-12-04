---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Output Terstruktur

## Pendahuluan

Dalam beberapa skenario aplikasi, pengguna mungkin ingin model LLM merespons dengan konten terstruktur dalam format JSON. Hal ini dapat dicapai dengan mengonfigurasi "Output Terstruktur".

![](https://static-docs.nocobase.com/202503041306405.png)

## Konfigurasi

- **JSON Schema** - Pengguna dapat menentukan struktur respons yang diharapkan dari model dengan mengonfigurasi [JSON Schema](https://json-schema.org/).
- **Nama** - _Opsional_, digunakan untuk membantu model memahami objek yang direpresentasikan oleh JSON Schema dengan lebih baik.
- **Deskripsi** - _Opsional_, digunakan untuk membantu model memahami tujuan JSON Schema dengan lebih baik.
- **Strict** - Meminta model untuk menghasilkan respons secara ketat sesuai dengan struktur JSON Schema. Saat ini, hanya beberapa model baru dari OpenAI yang mendukung parameter ini. Harap konfirmasi apakah model Anda kompatibel sebelum mengaktifkannya.

## Metode Pembuatan Konten Terstruktur

Cara model menghasilkan konten terstruktur bergantung pada **model** yang digunakan dan konfigurasi **format Respons**-nya:

1. Model yang format Respons-nya hanya mendukung `text`

   - Saat dipanggil, node akan mengikat sebuah Tool yang menghasilkan konten berformat JSON berdasarkan JSON Schema, memandu model untuk menghasilkan respons terstruktur dengan memanggil Tool ini.

2. Model yang format Respons-nya mendukung mode JSON (`json_object`)

   - Jika mode JSON dipilih saat dipanggil, pengguna perlu secara eksplisit menginstruksikan model dalam Prompt untuk mengembalikan dalam format JSON dan memberikan deskripsi untuk bidang respons.
   - Dalam mode ini, JSON Schema hanya digunakan untuk mengurai string JSON yang dikembalikan oleh model dan mengubahnya menjadi objek JSON target.

3. Model yang format Respons-nya mendukung JSON Schema (`json_schema`)

   - JSON Schema secara langsung digunakan untuk menentukan struktur respons target untuk model.
   - Parameter **Strict** opsional meminta model untuk secara ketat mengikuti JSON Schema saat menghasilkan respons.

4. Model lokal Ollama
   - Jika JSON Schema dikonfigurasi, node akan meneruskannya sebagai parameter `format` ke model saat dipanggil.

## Menggunakan Hasil Output Terstruktur

Konten terstruktur dari respons model disimpan sebagai objek JSON di bidang "Structured content" pada node dan dapat digunakan oleh node-node berikutnya.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)