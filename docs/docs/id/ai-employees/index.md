---
pkg: '@nocobase/plugin-ai'
title: 'Ikhtisar Karyawan AI'
description: 'Karyawan AI adalah kemampuan agent yang terintegrasi mendalam di sistem bisnis NocoBase, mendukung pemahaman konteks bisnis, eksekusi operasi langsung, kolaborasi berbasis role, dapat dikonfigurasi dengan LLM Service, Skills, dan Basis Pengetahuan.'
keywords: 'Karyawan AI,AI Employees,NocoBase Agent,LLM,Model Besar,Kolaborasi,Skills,Basis Pengetahuan'
---

# Ikhtisar

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Karyawan AI (`AI Employees`) adalah kemampuan agent yang terintegrasi mendalam di sistem bisnis NocoBase.

Ini bukan robot yang "hanya bisa chatting", tetapi "rekan kerja digital" yang dapat memahami konteks dan menjalankan operasi langsung di antarmuka bisnis:

- **Memahami konteks bisnis**: Merasakan halaman, Block, struktur data, dan konten yang dipilih saat ini.
- **Dapat menjalankan action langsung**: Dapat memanggil Skills untuk menyelesaikan tugas seperti query, analisis, pengisian, konfigurasi, pembuatan, dll.
- **Kolaborasi berbasis role**: Mengonfigurasi karyawan berbeda berdasarkan posisi, dan mengganti model dalam sesi untuk berkolaborasi.

## Jalur Memulai 5 Menit

Lihat [Mulai Cepat](/ai-employees/quick-start) terlebih dahulu, selesaikan konfigurasi minimum yang dapat digunakan dalam urutan berikut:

1. Konfigurasi setidaknya satu [LLM Service](/ai-employees/features/llm-service).
2. Aktifkan setidaknya satu [Karyawan AI](/ai-employees/features/enable-ai-employee).
3. Buka sesi dan mulai [Berkolaborasi dengan Karyawan AI](/ai-employees/features/collaborate).
4. Sesuai kebutuhan aktifkan [Pencarian Web](/ai-employees/features/web-search) dan [Tugas Cepat](/ai-employees/features/task).

## Peta Fitur

### A. Konfigurasi Dasar (Administrator)

- [Konfigurasi LLM Service](/ai-employees/features/llm-service): Integrasikan Provider, konfigurasi dan kelola model yang tersedia.
- [Aktifkan Karyawan AI](/ai-employees/features/enable-ai-employee): Aktifkan/nonaktifkan karyawan bawaan, kontrol cakupan ketersediaan.
- [Buat Karyawan AI Baru](/ai-employees/features/new-ai-employees): Definisikan role, persona, pesan sambutan, dan batas kemampuan.
- [Menggunakan Skills](/ai-employees/features/tools): Konfigurasi Permission Skills (`Ask` / `Allow`), kontrol risiko eksekusi.

### B. Kolaborasi Sehari-hari (Pengguna Bisnis)

- [Berkolaborasi dengan Karyawan AI](/ai-employees/features/collaborate): Ganti karyawan dan model dalam sesi, kolaborasi berkelanjutan.
- [Tambahkan Konteks - Block](/ai-employees/features/pick-block): Kirim Block halaman sebagai konteks ke AI.
- [Tugas Cepat](/ai-employees/features/task): Preset tugas umum di halaman/Block, eksekusi sekali klik.
- [Pencarian Web](/ai-employees/features/web-search): Aktifkan retrieval augmented response saat membutuhkan informasi terbaru.

### C. Kemampuan Lanjutan (Ekstensi)

- [Karyawan AI Bawaan](/ai-employees/features/built-in-employee): Pelajari positioning karyawan bawaan dan skenario penggunaannya.
- [Kontrol Permission](/ai-employees/permission): Kontrol akses karyawan, Skills, dan data berdasarkan model Permission organisasi.
- [Basis Pengetahuan AI](/ai-employees/knowledge-base/index): Perkenalkan pengetahuan perusahaan, tingkatkan stabilitas dan keterlacakan jawaban.
- [Node Karyawan AI Workflow](/ai-employees/workflow/nodes/employee/configuration): Orkestrasikan kemampuan Karyawan AI ke dalam alur otomatisasi.

## Konsep Inti

Berikut adalah istilah yang konsisten dengan glosarium, disarankan digunakan secara seragam di tim:

- **Karyawan AI (AI Employee)**: Agent yang dapat dieksekusi yang terdiri dari persona (Role setting) dan Skills (Tool / Skill).
- **LLM Service**: Unit integrasi model dan konfigurasi kemampuan, digunakan untuk mengelola Provider dan daftar model.
- **Provider**: Penyedia model di balik LLM Service.
- **Enabled Models**: Kumpulan model yang LLM Service saat ini izinkan untuk dipilih dalam sesi.
- **AI Employee Switcher**: Mengganti karyawan kolaborasi saat ini dalam sesi.
- **Model Switcher**: Mengganti model dalam sesi, dan mengingat preferensi berdasarkan dimensi karyawan.
- **Skills (Tool / Skill)**: Unit kemampuan eksekusi yang dapat dipanggil AI.
- **Permission Skills (Ask / Allow)**: Apakah perlu konfirmasi manusia sebelum memanggil Skills.
- **Konteks (Context)**: Informasi lingkungan bisnis seperti halaman, Block, struktur data.
- **Sesi (Chat)**: Satu proses interaksi berkelanjutan antara Pengguna dan Karyawan AI.
- **Pencarian Web (Web Search)**: Kemampuan untuk melengkapi informasi real-time berdasarkan retrieval eksternal.
- **Basis Pengetahuan (Knowledge Base / RAG)**: Memperkenalkan pengetahuan perusahaan melalui retrieval augmented generation.
- **Vector Store**: Penyimpanan vektorisasi yang menyediakan kemampuan pencarian semantik untuk Basis Pengetahuan.

## Petunjuk Instalasi

Karyawan AI adalah Plugin bawaan NocoBase (`@nocobase/plugin-ai`), siap pakai langsung, tanpa instalasi terpisah.
