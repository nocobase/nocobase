---
pkg: '@nocobase/plugin-ai'
title: 'Konfigurasi LLM Service'
description: 'Konfigurasi LLM Service yang tersedia untuk Karyawan AI, mendukung OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, Ollama, layanan baru, urutan aktivasi, dan test ketersediaan.'
keywords: 'LLM Service,OpenAI,Claude,Gemini,DeepSeek,Ollama,NocoBase AI'
---

# Konfigurasi LLM Service

Sebelum menggunakan Karyawan AI, perlu mengonfigurasi LLM Service yang tersedia terlebih dahulu.

Saat ini mendukung OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi, dan model lokal Ollama.

## Layanan Baru

Masuk ke `Pengaturan Sistem -> Karyawan AI -> LLM service`.

1. Klik `Add New` untuk membuka popup pembuatan baru.
2. Pilih `Provider`.
3. Isi `Title`, `API Key`, `Base URL` (opsional).
4. Konfigurasi `Enabled Models`:
   - `Select models`: Pilih dari daftar model yang dikembalikan oleh antarmuka penyedia layanan.
   - `Manual input`: Saat tidak dapat memperoleh daftar model dari antarmuka penyedia layanan, dapat memasukkan ID model dan nama tampilan secara manual.
5. Klik `Submit` untuk menyimpan.

![20260425172809](https://static-docs.nocobase.com/20260425172809.png)

## Aktivasi dan Pengurutan Layanan

Pada daftar LLM Service, dapat langsung:

- Menggunakan switch `Enabled` untuk mengaktifkan/menonaktifkan layanan.
- Drag-and-drop untuk mengurutkan urutan layanan (memengaruhi urutan tampilan model).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## Test Ketersediaan

Pada bagian bawah popup konfigurasi layanan gunakan `Test flight` untuk menguji ketersediaan layanan dan model.

Disarankan untuk melakukan test terlebih dahulu sebelum digunakan untuk bisnis.
