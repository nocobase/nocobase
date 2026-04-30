---
pkg: "@nocobase/plugin-ai"
title: "Panduan Prompt Engineering Karyawan AI"
description: "Menulis prompt Karyawan AI berkualitas tinggi: rumus emas sembilan elemen, contoh praktik Viz, tag XML, reuse modular, aturan MUST/ALWAYS/NEVER, optimalisasi iteratif lima langkah."
keywords: "Prompt Engineering,System Prompt,Role setting,Prompt AI,NocoBase"
---

# Karyawan AI · Panduan Prompt Engineering

> Dari "cara menulis" hingga "menulis dengan baik", panduan ini mengajari Anda menulis prompt berkualitas tinggi dengan cara yang sederhana, stabil, dan dapat digunakan kembali.

## 1. Mengapa Prompt Sangat Penting

Prompt adalah "deskripsi pekerjaan" Karyawan AI, langsung menentukan gaya, batasan, dan kualitas output-nya.

**Contoh Perbandingan:**

❌ Prompt yang tidak jelas:

```
Anda adalah asisten analisis data, membantu Pengguna menganalisis data.
```

✅ Prompt yang jelas dan dapat dikontrol:

```
Anda adalah Viz, seorang pakar analisis data.

Positioning Role
- Gaya: Insight kuat, ekspresi jelas, mengutamakan visualisasi
- Misi: Mengubah data kompleks menjadi "cerita grafik" yang dapat dipahami

Alur Kerja
1) Memahami kebutuhan
2) Menghasilkan SQL aman (hanya SELECT)
3) Memperhalus insight
4) Menampilkan dengan grafik

Aturan Wajib
- MUST: Hanya menggunakan SELECT, tidak pernah memodifikasi data
- ALWAYS: Default menghasilkan grafik
- NEVER: Mengarang atau menebak data

Format Output
Kesimpulan singkat (2-3 kalimat) + ECharts grafik JSON
```

**Kesimpulan**: Prompt yang baik menjelaskan dengan jelas "siapa, melakukan apa, bagaimana, dengan standar apa", kinerja AI akan stabil dan dapat dikontrol.


## 2. Rumus Emas "Sembilan Elemen" Prompt

Struktur yang divalidasi dalam praktik:

```
Beri nama + Instruksi ganda + Konfirmasi simulasi + Penekanan berulang + Aturan wajib
+ Informasi latar belakang + Insentif positif + Contoh referensi + Contoh negatif (opsional)
```

### 2.1 Penjelasan Elemen

| Elemen | Masalah yang Diselesaikan | Mengapa Efektif |
| ------ | ------------------------- | --------------- |
| Beri Nama | Memperjelas identitas dan gaya | Membuat AI membangun "rasa role" |
| Instruksi Ganda | Membedakan "saya siapa/saya akan melakukan apa" | Mengurangi kebingungan positioning |
| Konfirmasi Simulasi | Mengulang sebelum eksekusi | Mencegah penyimpangan |
| Penekanan Berulang | Poin kunci muncul berulang | Meningkatkan prioritas |
| Aturan Wajib | MUST/ALWAYS/NEVER | Membentuk garis batas |
| Informasi Latar Belakang | Pengetahuan dan kendala yang diperlukan | Mengurangi kesalahpahaman |
| Insentif Positif | Panduan ekspektasi dan gaya | Nada dan kinerja yang lebih stabil |
| Contoh Referensi | Objek tiruan langsung | Output lebih sesuai ekspektasi |
| Contoh Negatif | Menghindari pitfall umum | Ada error langsung diperbaiki, semakin akurat dengan penggunaan |

### 2.2 Template Cepat Mulai

```yaml
# 1) Beri nama
Anda adalah [Nama], seorang [Posisi/Keahlian] yang luar biasa.

# 2) Instruksi ganda
## Role
Gaya: [Kata sifat ×2-3]
Misi: [Penjelasan satu kalimat tanggung jawab utama]

## Alur Tugas
1) Pahami: [Poin kunci]
2) Eksekusi: [Poin kunci]
3) Validasi: [Poin kunci]
4) Tampilkan: [Poin kunci]

# 3) Konfirmasi simulasi
Sebelum eksekusi ulangi pemahaman: "Saya memahami bahwa Anda membutuhkan… Saya akan menyelesaikannya melalui…"

# 4) Penekanan berulang
Persyaratan inti: [1-2 hal paling kunci] (muncul minimal 2 kali di awal/alur/akhir)

# 5) Aturan wajib
MUST: [Aturan yang tidak boleh dilanggar]
ALWAYS: [Prinsip yang selalu dipatuhi]
NEVER: [Hal yang dilarang secara eksplisit]

# 6) Informasi latar belakang
[Pengetahuan domain/konteks/pitfall umum yang diperlukan]

# 7) Insentif positif
Anda berkinerja luar biasa dalam [kemampuan], ahli dalam [keahlian], harap pertahankan gaya tersebut untuk menyelesaikan tugas.

# 8) Contoh referensi
[Berikan contoh ringkas "output ideal"]

# 9) Contoh negatif (opsional)
- [Praktik salah] → [Praktik benar]
```


## 3. Contoh Praktik: Viz (Analisis Data)

Berikut adalah merangkai sembilan elemen menjadi contoh lengkap "yang dapat langsung digunakan".

```text
# Beri nama
Anda adalah Viz, seorang pakar analisis data.

# Instruksi ganda
[Role]
Gaya: Insight kuat, ekspresi jelas, berorientasi visual
Misi: Mengubah data kompleks menjadi "cerita grafik"

[Alur Tugas]
1) Pahami: Analisis kebutuhan data Pengguna dan cakupan indikator
2) Query: Hasilkan SQL aman (hanya query data nyata, SELECT-only)
3) Analisis: Perhalus insight kunci (tren/perbandingan/proporsi)
4) Tampilkan: Pilih grafik yang sesuai untuk ekspresi yang jelas

# Konfirmasi simulasi
Sebelum eksekusi ulangi: "Saya memahami Anda akan menganalisis [objek/cakupan], akan menampilkan hasil melalui [cara query dan visualisasi]."

# Penekanan berulang
Tegaskan kembali: Keaslian data prioritas, lebih baik kosong daripada salah; jika tidak ada data jelaskan dengan jujur.

# Aturan wajib
MUST: Hanya menggunakan query SELECT, tidak memodifikasi data apa pun
ALWAYS: Default menghasilkan grafik visualisasi
NEVER: Mengarang atau menebak data

# Informasi latar belakang
- ECharts harus menggunakan konfigurasi "JSON murni", tidak berisi komentar/fungsi
- Setiap grafik fokus pada 1 topik, hindari menumpuk banyak indikator

# Insentif positif
Anda ahli dalam menyaring kesimpulan yang dapat ditindaklanjuti dari data nyata, dan mengekspresikannya dengan grafik paling ringkas.

# Contoh referensi
Penjelasan (2-3 kalimat) + grafik JSON

Penjelasan contoh:
Leads baru bulan ini 127, naik 23% dibanding bulan sebelumnya, terutama dari channel pihak ketiga.

Grafik contoh:
{
  "title": {"text": "Tren Leads Bulan Ini"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Contoh negatif (opsional)
- Mencampur Mandarin dan Inggris → Pertahankan konsistensi bahasa
- Grafik penuh sesak → Setiap grafik hanya mengekspresikan satu topik
- Data tidak lengkap → Jelaskan dengan jujur "tidak ada data yang tersedia"
```

**Poin Desain**

* "Keaslian" muncul berulang kali di alur, penekanan, aturan (peringatan kuat)
* Pilih output dua bagian "penjelasan + JSON", memudahkan integrasi frontend
* Tentukan dengan jelas "SQL read-only", mengurangi risiko


## 4. Bagaimana Membuat Prompt Semakin Baik dengan Penggunaan

### 4.1 Iterasi Lima Langkah

```
Buat versi yang dapat digunakan → Test skala kecil → Catat masalah → Tambah aturan/contoh sesuai masalah → Test ulang
```

<img src="https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-20-21.jpg" alt="Alur Optimasi" width="50%">

Disarankan menguji 5-10 tugas tipikal sekaligus, selesaikan satu putaran dalam 30 menit.

### 4.2 Prinsip dan Proporsi

* **Panduan positif diutamakan**: Beri tahu AI terlebih dahulu apa yang harus dilakukan
* **Perbaikan berbasis masalah**: Tambahkan kendala saat menemukan masalah
* **Kendala moderat**: Jangan langsung menumpuk "larangan" di awal

Proporsi pengalaman: **Positif 80% : Negatif 20%**.

### 4.3 Optimasi Tipikal

**Masalah**: Grafik kelebihan beban, keterbacaan buruk
**Optimasi**:

1. Tambahkan di "Informasi Latar Belakang": Satu grafik satu topik
2. Berikan "grafik indikator tunggal" di "Contoh Referensi"
3. Jika masalah berulang, baru tambahkan kendala wajib di "Aturan Wajib/Penekanan Berulang"


## 5. Teknik Lanjutan

### 5.1 Gunakan XML/Tag agar Struktur Lebih Jelas (Disarankan untuk Prompt Panjang)

Saat konten >1000 karakter atau mudah membingungkan, lebih stabil menggunakan tag untuk pembagian:

```xml
<role>Anda adalah Dex, seorang pakar pengelolaan data.</role>
<style>Cermat, akurat, dan teratur.</style>

<task>
Harus diselesaikan langkah demi langkah:
1. Identifikasi Field kunci
2. Ekstrak nilai Field
3. Standarisasi format (tanggal YYYY-MM-DD)
4. Output JSON
</task>

<rules>
MUST: Pertahankan keakuratan nilai Field
NEVER: Menebak informasi yang hilang
ALWAYS: Tandai item yang tidak pasti
</rules>

<example>
{"nama":"Zhang San","tanggal":"2024-01-15","jumlah":5000,"status":"dikonfirmasi"}
</example>
```

### 5.2 Penulisan Berlapis "Latar Belakang + Tugas" (Pendekatan yang Lebih Intuitif)

* **Latar Belakang** (stabil jangka panjang): Siapa karyawan ini, gayanya bagaimana, kemampuan apa yang dimilikinya
* **Tugas** (beralih sesuai kebutuhan): Apa yang harus dilakukan saat ini, indikator apa yang menjadi fokus, cakupan default apa

Ini secara alami cocok dengan model "karyawan + tugas" NocoBase: **latar belakang tetap, tugas fleksibel**.

### 5.3 Reuse Modular

Pisahkan aturan umum menjadi modul, gunakan dan rangkai sesuai kebutuhan:

**Modul Keamanan Data**

```
MUST: Hanya menggunakan SELECT
NEVER: Menjalankan INSERT/UPDATE/DELETE
```

**Modul Struktur Output**

```
Output harus berisi:
1) Penjelasan singkat (2-3 kalimat)
2) Konten inti (grafik/data/kode)
3) Saran opsional (jika ada)
```


## 6. Aturan Emas (Kesimpulan Praktik)

1. Satu AI hanya melakukan satu jenis pekerjaan, lebih spesialisasi lebih stabil
2. Contoh lebih efektif dari slogan, berikan template positif terlebih dahulu
3. Gunakan MUST/ALWAYS/NEVER untuk menetapkan batas
4. Ekspresi alur, kurangi ketidakpastian
5. Langkah kecil cepat, banyak test sedikit perubahan, iterasi berkelanjutan
6. Jangan terlalu banyak kendala, hindari "menetapkan secara mati"
7. Catat masalah dan perubahan, bentuk versi
8. 80/20: Beri tahu "cara melakukan dengan benar" terlebih dahulu, lalu kendala "jangan salah"


## 7. Pertanyaan Umum

**Q1: Berapa panjang yang sesuai?**

* Karyawan dasar: 500-800 karakter
* Karyawan kompleks: 800-1500 karakter
* Tidak disarankan >2000 karakter (akan memperlambat dan redundan)
  Standar: Sembilan elemen tercakup, tetapi tanpa kata-kata yang tidak perlu.

**Q2: Apa yang harus dilakukan jika AI tidak patuh?**

1. Gunakan MUST/ALWAYS/NEVER untuk memperjelas batas
2. Persyaratan kunci diulang 2-3 kali
3. Gunakan tag/pembagian untuk meningkatkan struktur
4. Berikan lebih banyak contoh positif, kurangi prinsip kosong
5. Evaluasi apakah memerlukan model yang lebih kuat

**Q3: Bagaimana menyeimbangkan positif/negatif?**
Tulis positif dulu (role, alur, contoh), lalu tambahkan kendala berdasarkan kesalahan, dan hanya kendala pada poin yang "berulang kali salah".

**Q4: Perlu sering update?**

* Latar belakang (identitas/gaya/kemampuan inti): Stabil jangka panjang
* Tugas (skenario/indikator/cakupan): Sesuaikan dengan bisnis
* Saat ada perubahan buat versi, dan catat "mengapa berubah"


## 8. Selanjutnya

**Latihan Praktis**

* Pilih satu role sederhana (seperti asisten customer service), tulis "versi yang dapat digunakan" sesuai sembilan elemen, test 5 tugas tipikal
* Ambil satu karyawan yang ada, susun 3-5 masalah nyata, lakukan satu putaran iterasi kecil

**Bacaan Lanjutan**

* [Karyawan AI · Panduan Konfigurasi Administrator](./admin-configuration.md): Terapkan prompt ke konfigurasi nyata
* Manual eksklusif setiap Karyawan AI: Lihat template lengkap role/tugas


## Penutup

**Jalankan dulu, perhalus kemudian.**
Mulai dari versi yang "dapat bekerja", terus kumpulkan masalah, tambahkan contoh dan aturan dalam tugas nyata.
Ingat: **Beri tahu cara melakukan dengan benar terlebih dahulu (panduan positif), lalu kendalanya jangan salah (pembatasan moderat).**
