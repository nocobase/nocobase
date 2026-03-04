---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/ai-employees/workflow/nodes/llm/chat).
:::

# Dialog Teks

## Pendahuluan

Menggunakan node LLM dalam alur kerja dapat memulai dialog dengan layanan LLM online, memanfaatkan kemampuan model besar untuk membantu menyelesaikan serangkaian proses bisnis.

![](https://static-docs.nocobase.com/202503041012091.png)

## 新建 LLM 节点 (Membuat Node LLM Baru)

Karena berdialog dengan layanan LLM biasanya memakan waktu, node LLM hanya dapat digunakan dalam alur kerja asinkron.

![](https://static-docs.nocobase.com/202503041013363.png)

## Memilih Model

Pertama, pilih layanan LLM yang telah terhubung. Jika belum ada layanan LLM yang terhubung, maka perlu menambahkan konfigurasi layanan LLM terlebih dahulu. Referensi: [Manajemen Layanan LLM](/ai-employees/features/llm-service)

Setelah memilih layanan, aplikasi akan mencoba mendapatkan daftar model yang tersedia dari layanan LLM untuk dipilih. Beberapa antarmuka layanan online LLM untuk mendapatkan model mungkin tidak sesuai dengan protokol API standar, pengguna juga dapat memasukkan ID model secara manual.

![](https://static-docs.nocobase.com/202503041013084.png)

## Mengatur Parameter Pemanggilan

Parameter pemanggilan model LLM dapat disesuaikan sesuai kebutuhan.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Di antaranya yang perlu diperhatikan adalah pengaturan **Response format**, item pengaturan ini digunakan untuk menginstruksikan format konten respons model besar, dapat berupa teks atau JSON. Jika memilih mode JSON, perlu diperhatikan:

- Model LLM yang bersangkutan perlu mendukung pemanggilan dalam mode JSON, dan pada saat yang sama pengguna perlu secara jelas menginstruksikan LLM dalam Prompt untuk merespons dalam format JSON, misalnya: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Jika tidak, mungkin tidak ada hasil respons, dan muncul kesalahan `400 status code (no body)`.
- Hasil respons adalah sebuah string JSON, pengguna perlu menggunakan kemampuan node alur kerja lainnya untuk mengurainya sebelum dapat menggunakan konten terstruktur di dalamnya. Anda juga dapat menggunakan fitur [Output Terstruktur](/ai-employees/workflow/nodes/llm/structured-output).

## Pesan

Array pesan yang dikirim ke model LLM, dapat berisi sekumpulan pesan riwayat. Di antaranya pesan mendukung tiga tipe:

- System - Biasanya digunakan untuk menentukan peran dan perilaku model LLM dalam dialog.
- User - Konten masukan pengguna.
- Assistant - Konten respons model.

Untuk pesan pengguna, dengan prasyarat model mendukungnya, beberapa konten dapat ditambahkan dalam satu prompt, sesuai dengan parameter `content`. Jika model yang digunakan hanya mendukung parameter `content` dalam bentuk string (sebagian besar model yang tidak mendukung dialog multimodal termasuk dalam kategori ini), harap bagi pesan menjadi beberapa prompt, dengan setiap prompt hanya menyisakan satu konten, sehingga node akan mengirimkan konten dalam bentuk string.

![](https://static-docs.nocobase.com/202503041016140.png)

Variabel dapat digunakan dalam konten pesan untuk mereferensikan konteks alur kerja.

![](https://static-docs.nocobase.com/202503041017879.png)

## Menggunakan Konten Respons Node LLM

Konten respons dari node LLM dapat digunakan sebagai variabel di node lainnya.

![](https://static-docs.nocobase.com/202503041018508.png)