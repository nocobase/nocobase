:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Tingkat Lanjut

## Pendahuluan

Umumnya, model bahasa besar (LLM) memiliki keterbatasan dalam hal aktualitas data dan seringkali tidak memiliki informasi terbaru. Oleh karena itu, platform layanan LLM daring biasanya menyediakan fitur pencarian web. Fitur ini memungkinkan AI untuk mencari informasi menggunakan alat tertentu sebelum memberikan respons, kemudian merespons berdasarkan hasil pencarian tersebut.

Karyawan AI telah diadaptasi untuk fitur pencarian web dari berbagai platform layanan LLM daring. Anda dapat mengaktifkan fitur pencarian web ini dalam konfigurasi model karyawan AI dan juga dalam percakapan.

## Mengaktifkan Fitur Pencarian Web

Buka halaman konfigurasi **plugin** karyawan AI, lalu klik tab `AI employees` untuk masuk ke halaman manajemen karyawan AI.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Pilih karyawan AI yang ingin Anda aktifkan fitur pencarian web-nya, lalu klik tombol `Edit` untuk masuk ke halaman pengeditan karyawan AI.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Pada tab `Model settings`, aktifkan sakelar `Web Search`, lalu klik tombol `Submit` untuk menyimpan perubahan.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Menggunakan Fitur Pencarian Web dalam Percakapan

Setelah fitur pencarian web diaktifkan untuk karyawan AI, ikon "Web" akan muncul di kotak input percakapan. Secara default, pencarian web diaktifkan, dan Anda dapat mengekliknya untuk menonaktifkan.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Dengan pencarian web diaktifkan, respons karyawan AI akan menampilkan hasil pencarian web.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Perbedaan Alat Pencarian Web Antar Platform

Saat ini, fitur pencarian web karyawan AI bergantung pada platform layanan LLM daring yang menyediakannya, sehingga pengalaman pengguna mungkin bervariasi. Perbedaan spesifiknya adalah sebagai berikut:

| Platform  | Pencarian Web | tools | Respons Real-time dengan Istilah Pencarian | Mengembalikan Tautan Eksternal sebagai Referensi dalam Jawaban |
| --------- | ------------- | ----- | ------------------------------------------ | ------------------------------------------------------------- |
| OpenAI    | ✅             | ✅     | ✅                                          | ✅                                                             |
| Gemini    | ✅             | ❌     | ❌                                          | ✅                                                             |
| Dashscope | ✅             | ✅     | ❌                                          | ❌                                                             |
| Deepseek  | ❌             | ❌     | ❌                                          | ❌                                                             |