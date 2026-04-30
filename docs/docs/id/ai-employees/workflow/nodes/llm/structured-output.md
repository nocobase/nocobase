---
pkg: "@nocobase/plugin-ai"
title: "Node LLM Workflow - Output Terstruktur"
description: "Output terstruktur LLM Workflow: konfigurasi JSON Schema mendefinisikan struktur respons, mendukung mode text/json_object/json_schema, parameter format model lokal Ollama."
keywords: "Workflow,Node LLM,Output Terstruktur,JSON Schema,NocoBase"
---

# Output Terstruktur

<PluginInfo name="ai-ee" licenseBundled="true"></PluginInfo>

## Pengantar

Pada beberapa skenario aplikasi, Pengguna mungkin berharap model LLM merespons konten terstruktur dalam format JSON, dapat diimplementasikan dengan mengonfigurasi "Output Terstruktur".

![](https://static-docs.nocobase.com/202503041306405.png)

## Penjelasan Konfigurasi

- **JSON Schema** - Pengguna dapat mendefinisikan struktur respons model yang diharapkan dengan mengonfigurasi [JSON Schema](https://json-schema.org/).
- **Nama (Name)** - _Tidak wajib_, digunakan untuk membantu model lebih memahami objek yang direpresentasikan JSON Schema.
- **Deskripsi (Description)** - _Tidak wajib_, digunakan untuk membantu model lebih memahami penggunaan JSON Schema.
- **Strict** - Mengharuskan model menghasilkan respons secara ketat sesuai struktur JSON Schema. Saat ini, hanya sebagian model baru OpenAI yang mendukung parameter ini, harap konfirmasi apakah model kompatibel sebelum mencentang.

## Cara Menghasilkan Konten Terstruktur

Cara menghasilkan konten terstruktur model, tergantung pada **model** yang digunakan dan konfigurasi **Response format**-nya:

1. Model yang Response format-nya hanya mendukung `text`

   - Saat dipanggil, Node akan mengikat satu Tools yang menghasilkan konten format JSON berdasarkan JSON Schema, memandu model menghasilkan respons terstruktur dengan memanggil Tools tersebut.

2. Model yang Response format-nya mendukung mode JSON (`json_object`)

   - Jika memilih mode JSON saat dipanggil, Pengguna perlu secara eksplisit menginstruksikan model dalam Prompt untuk mengembalikan dalam format JSON, dan menyediakan penjelasan Field respons.
   - Dalam mode ini, JSON Schema hanya digunakan untuk parsing string JSON yang dikembalikan model, mengkonversinya menjadi objek JSON target.

3. Model yang Response format-nya mendukung JSON Schema (`json_schema`)

   - JSON Schema langsung digunakan untuk menentukan struktur respons target model.
   - Parameter **Strict** opsional, mengharuskan model mengikuti JSON Schema secara ketat untuk menghasilkan respons.

4. Model lokal Ollama
   - Jika dikonfigurasi JSON Schema, saat dipanggil, Node akan mengirimkannya sebagai parameter `format` ke model.

## Menggunakan Hasil Output Terstruktur

Konten terstruktur yang direspons model disimpan dalam Field Structured content Node dalam bentuk objek JSON, dapat digunakan oleh Node selanjutnya.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)
