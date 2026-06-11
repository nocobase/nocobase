---
pkg: "@nocobase/plugin-ai"
title: "Node LLM Workflow - Dialog Teks"
description: "Node dialog teks LLM Workflow: pilih model, atur parameter pemanggilan, Response format, tipe pesan System/User/Assistant, referensi variabel."
keywords: "Workflow,Node LLM,Dialog Teks,Workflow AI,NocoBase"
---

# Dialog Teks

<PluginInfo name="ai"></PluginInfo>

## Pengantar

Menggunakan Node LLM Workflow dapat memulai dialog dengan LLM Service online, memanfaatkan kemampuan model besar untuk membantu menyelesaikan serangkaian proses bisnis.

![](https://static-docs.nocobase.com/202503041012091.png)

## Buat Node LLM Baru

Karena dialog dengan LLM Service biasanya cukup memakan waktu, Node LLM hanya dapat digunakan dalam Workflow asinkron.

![](https://static-docs.nocobase.com/202503041013363.png)

## Pilih Model

Pertama pilih LLM Service yang sudah diintegrasikan, jika belum mengintegrasikan LLM Service, perlu menambahkan konfigurasi LLM Service terlebih dahulu. Rujuk: [Manajemen LLM Service](/ai-employees/features/llm-service)

Setelah memilih layanan, aplikasi akan mencoba mendapatkan daftar model yang tersedia dari LLM Service untuk dipilih. Antarmuka untuk mendapatkan model dari sebagian LLM Service online mungkin tidak mengikuti protokol API standar, Pengguna juga dapat memasukkan ID model secara manual.

![](https://static-docs.nocobase.com/202503041013084.png)

## Atur Parameter Pemanggilan

Dapat menyesuaikan parameter pemanggilan model LLM sesuai kebutuhan.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Yang patut diperhatikan adalah pengaturan **Response format**, item pengaturan ini digunakan untuk memberi tahu format konten respons model besar, dapat berupa teks atau JSON. Jika memilih mode JSON, perlu diperhatikan:

- Model LLM yang sesuai perlu mendukung pemanggilan dengan mode JSON, sekaligus Pengguna perlu secara eksplisit memberi tahu LLM dalam Prompt untuk merespons dalam format JSON, contoh: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Jika tidak mungkin tidak ada hasil respons, error `400 status code (no body)`.
- Hasil respons adalah string JSON, Pengguna perlu memanfaatkan kemampuan Node Workflow lainnya untuk parsing, baru dapat menggunakan konten terstruktur di dalamnya. Juga dapat menggunakan fungsi [Output Terstruktur](/ai-employees/workflow/nodes/llm/structured-output).

## Pesan

Array pesan yang dikirim ke model LLM, dapat berisi sekelompok pesan history. Di dalamnya pesan mendukung tiga tipe:

- System - Biasanya digunakan untuk mendefinisikan role dan perilaku yang dimainkan model LLM dalam dialog.
- User - Konten yang dimasukkan Pengguna.
- Assistant - Konten yang direspons model.

Untuk pesan Pengguna, dengan syarat model mendukung, dapat menambahkan beberapa konten dalam satu prompt, sesuai dengan parameter `content`. Jika model yang digunakan hanya mendukung parameter `content` dalam bentuk string (sebagian besar model yang tidak mendukung dialog multimodal termasuk dalam kategori ini), harap pisahkan pesan menjadi beberapa prompt, setiap prompt hanya menyimpan satu konten, dengan demikian Node akan mengirim konten dalam bentuk string.

![](https://static-docs.nocobase.com/202503041016140.png)

Dalam konten pesan dapat menggunakan variabel untuk mereferensikan konteks Workflow.

![](https://static-docs.nocobase.com/202503041017879.png)

## Menggunakan Konten Respons Node LLM

Dapat menggunakan konten respons Node LLM sebagai variabel di Node lain.

![](https://static-docs.nocobase.com/202503041018508.png)
