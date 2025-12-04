---
pkg: "@nocobase/plugin-ai"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Obrolan Teks

## Pendahuluan

Dengan menggunakan node LLM di alur kerja, Anda dapat memulai percakapan dengan layanan LLM online. Ini memungkinkan Anda memanfaatkan kemampuan model bahasa besar untuk membantu menyelesaikan serangkaian proses bisnis.

![](https://static-docs.nocobase.com/202503041012091.png)

## Membuat Node LLM

Karena percakapan dengan layanan LLM seringkali memakan waktu, node LLM hanya dapat digunakan dalam alur kerja asinkron.

![](https://static-docs.nocobase.com/202503041013363.png)

## Memilih Model

Pertama, pilih layanan LLM yang sudah terhubung. Jika Anda belum menghubungkan layanan LLM, Anda perlu menambahkan konfigurasi layanan LLM terlebih dahulu. Lihat: [Manajemen Layanan LLM](/ai-employees/quick-start/llm-service)

Setelah memilih layanan, aplikasi akan mencoba mengambil daftar model yang tersedia dari layanan LLM untuk Anda pilih. Beberapa layanan LLM online mungkin memiliki API untuk mengambil model yang tidak sesuai dengan protokol API standar; dalam kasus seperti itu, pengguna juga dapat memasukkan ID model secara manual.

![](https://static-docs.nocobase.com/202503041013084.png)

## Mengatur Parameter Pemanggilan

Anda dapat menyesuaikan parameter untuk memanggil model LLM sesuai kebutuhan.

![](https://static-docs.nocobase.com/202503041014778.png)

### Format Respons

Penting untuk diperhatikan adalah pengaturan **Format Respons**. Opsi ini digunakan untuk memberi tahu model bahasa besar tentang format konten responsnya, yang dapat berupa teks atau JSON. Jika Anda memilih mode JSON, perhatikan hal-hal berikut:

- Model LLM yang bersangkutan harus mendukung pemanggilan dalam mode JSON. Selain itu, pengguna perlu secara eksplisit memberi tahu LLM dalam Prompt untuk merespons dalam format JSON, contohnya: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Jika tidak, mungkin tidak ada respons, dan akan muncul kesalahan `400 status code (no body)`.
- Respons akan berupa string JSON. Pengguna perlu menguraikannya menggunakan kemampuan node alur kerja lainnya sebelum dapat menggunakan konten terstruktur di dalamnya. Anda juga dapat menggunakan fitur [Output Terstruktur](/ai-employees/workflow/nodes/llm/structured-output).

## Pesan

Array pesan yang dikirim ke model LLM dapat mencakup serangkaian pesan riwayat. Pesan mendukung tiga jenis:

- System - Biasanya digunakan untuk mendefinisikan peran dan perilaku model LLM dalam percakapan.
- User - Konten yang dimasukkan oleh pengguna.
- Assistant - Konten yang direspons oleh model.

Untuk pesan pengguna, dengan asumsi model mendukungnya, Anda dapat menambahkan beberapa bagian konten dalam satu prompt, yang sesuai dengan parameter `content`. Jika model yang Anda gunakan hanya mendukung parameter `content` dalam bentuk string (ini berlaku untuk sebagian besar model yang tidak mendukung percakapan multimodal), harap pisahkan pesan menjadi beberapa prompt, dengan setiap prompt hanya berisi satu bagian konten. Dengan cara ini, node akan mengirimkan konten sebagai string.

![](https://static-docs.nocobase.com/202503041016140.png)

Anda dapat menggunakan variabel dalam konten pesan untuk mereferensikan konteks alur kerja.

![](https://static-docs.nocobase.com/202503041017879.png)

## Menggunakan Konten Respons Node LLM

Anda dapat menggunakan konten respons dari node LLM sebagai variabel di node lain.

![](https://static-docs.nocobase.com/202503041018508.png)