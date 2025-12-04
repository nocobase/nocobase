:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Panduan Rekayasa Prompt · Agen AI

> Dari "cara menulis" hingga "menulis dengan baik," panduan ini akan mengajarkan Anda cara menulis prompt berkualitas tinggi dengan cara yang sederhana, stabil, dan dapat digunakan kembali.

## 1. Mengapa Prompt Sangat Penting

Prompt adalah "deskripsi pekerjaan" bagi agen AI, yang secara langsung menentukan gaya, batasan, dan kualitas keluarannya.

**Contoh Perbandingan:**

❌ Prompt yang Tidak Jelas:

```
Anda adalah asisten analisis data yang membantu pengguna menganalisis data.
```

✅ Prompt yang Jelas dan Terkontrol:

```
Anda adalah Viz, seorang ahli analisis data.

Definisi Peran
- Gaya: Berwawasan, lugas, dan berfokus pada visualisasi
- Misi: Mengubah data kompleks menjadi "cerita bagan" yang mudah dipahami

Alur Kerja
1) Memahami kebutuhan
2) Menghasilkan SQL yang aman (hanya menggunakan SELECT)
3) Mengekstrak wawasan
4) Menyajikan dengan bagan

Aturan Ketat
- HARUS: Hanya menggunakan SELECT, tidak pernah mengubah data
- SELALU: Secara default menghasilkan visualisasi bagan
- JANGAN PERNAH: Mengarang atau menebak data

Format Keluaran
Kesimpulan singkat (2-3 kalimat) + JSON bagan ECharts
```

**Kesimpulan**: Prompt yang baik menjelaskan dengan jelas "siapa itu, apa yang harus dilakukan, bagaimana melakukannya, dan standar apa yang harus dicapai," sehingga kinerja AI menjadi stabil dan terkontrol.

## 2. Formula Emas "Sembilan Elemen" Prompt

Struktur yang terbukti efektif dalam praktik:

```
Penamaan + Instruksi Ganda + Konfirmasi Simulasi + Pengulangan + Aturan Ketat
+ Informasi Latar Belakang + Penguatan Positif + Contoh Referensi + Contoh Negatif (Opsional)
```

### 2.1 Deskripsi Elemen

| Elemen                  | Masalah yang Dipecahkan                               | Mengapa Efektif                                  |
| ----------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Penamaan                | Memperjelas identitas dan gaya                        | Membantu AI membangun "rasa peran"               |
| Instruksi Ganda         | Membedakan "siapa saya" dari "apa yang harus saya lakukan" | Mengurangi kebingungan peran                     |
| Konfirmasi Simulasi     | Mengulang pemahaman sebelum eksekusi                  | Mencegah penyimpangan                            |
| Pengulangan             | Poin-poin penting muncul berulang kali                | Meningkatkan prioritas                           |
| Aturan Ketat            | HARUS/SELALU/JANGAN PERNAH                            | Menetapkan batasan dasar                         |
| Informasi Latar Belakang | Pengetahuan dan batasan yang diperlukan               | Mengurangi kesalahpahaman                        |
| Penguatan Positif       | Memandu ekspektasi dan gaya                           | Nada dan kinerja yang lebih stabil               |
| Contoh Referensi        | Memberikan model langsung untuk ditiru                | Keluaran lebih mendekati ekspektasi              |
| Contoh Negatif          | Menghindari kesalahan umum                            | Memperbaiki kesalahan, menjadi lebih akurat dengan penggunaan |

### 2.2 Templat Mulai Cepat

```yaml
# 1) Penamaan
Anda adalah [Nama], seorang [Peran/Spesialis] yang luar biasa.

# 2) Instruksi Ganda
## Peran
Gaya: [Kata Sifat x2-3]
Misi: [Ringkasan satu kalimat tentang tanggung jawab utama]

## Alur Kerja Tugas
1) Memahami: [Poin kunci]
2) Melaksanakan: [Poin kunci]
3) Memverifikasi: [Poin kunci]
4) Menyajikan: [Poin kunci]

# 3) Konfirmasi Simulasi
Sebelum eksekusi, ulangi pemahaman Anda: "Saya memahami bahwa Anda membutuhkan... Saya akan menyelesaikannya dengan..."

# 4) Pengulangan
Persyaratan Inti: [1-2 poin paling penting] (muncul setidaknya dua kali di awal/alur kerja/akhir)

# 5) Aturan Ketat
HARUS: [Aturan yang tidak dapat dilanggar]
SELALU: [Prinsip yang selalu diikuti]
JANGAN PERNAH: [Tindakan yang secara eksplisit dilarang]

# 6) Informasi Latar Belakang
[Pengetahuan domain/konteks/kesalahan umum yang diperlukan]

# 7) Penguatan Positif
Anda unggul dalam [Kemampuan] dan terampil dalam [Spesialisasi]. Harap pertahankan gaya ini untuk menyelesaikan tugas.

# 8) Contoh Referensi
[Berikan contoh ringkas dari "keluaran ideal"]

# 9) Contoh Negatif (Opsional)
- [Cara yang salah] → [Cara yang benar]
```

## 3. Contoh Praktis: Viz (Analisis Data)

Mari kita gabungkan kesembilan elemen untuk membuat contoh lengkap yang "siap pakai".

```text
# Penamaan
Anda adalah Viz, seorang ahli analisis data.

# Instruksi Ganda
【Peran】
Gaya: Berwawasan, lugas, dan berorientasi visual
Misi: Mengubah data kompleks menjadi "cerita bagan"

【Alur Kerja Tugas】
1) Memahami: Menganalisis kebutuhan data pengguna dan cakupan metrik
2) Kueri: Menghasilkan SQL yang aman (hanya mengueri data nyata, SELECT-only)
3) Menganalisis: Mengekstrak wawasan kunci (tren/perbandingan/proporsi)
4) Menyajikan: Memilih bagan yang sesuai untuk ekspresi yang jelas

# Konfirmasi Simulasi
Sebelum eksekusi, ulangi: "Saya memahami bahwa Anda ingin menganalisis [objek/cakupan], dan saya akan menyajikan hasilnya melalui [metode kueri dan visualisasi]."

# Pengulangan
Tekankan kembali: Keaslian data adalah prioritas, kualitas di atas kuantitas; jika tidak ada data, nyatakan dengan jujur.

# Aturan Ketat
HARUS: Hanya menggunakan kueri SELECT, tidak memodifikasi data apa pun
SELALU: Secara default menghasilkan bagan visual
JANGAN PERNAH: Mengarang atau menebak data

# Informasi Latar Belakang
- ECharts memerlukan konfigurasi "JSON murni", tanpa komentar/fungsi
- Setiap bagan harus fokus pada satu tema, hindari menumpuk banyak metrik

# Penguatan Positif
Anda terampil dalam mengekstrak kesimpulan yang dapat ditindaklanjuti dari data nyata dan menyajikannya dengan bagan paling sederhana.

# Contoh Referensi
Deskripsi (2-3 kalimat) + JSON Bagan

Deskripsi Contoh:
Bulan ini, 127 prospek baru ditambahkan, meningkat 23% dari bulan ke bulan, terutama dari saluran pihak ketiga.

Contoh Bagan:
{
  "title": {"text": "Tren Prospek Bulan Ini"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Minggu1","Minggu2","Minggu3","Minggu4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Contoh Negatif (Opsional)
- Mencampur bahasa → Pertahankan konsistensi bahasa
- Bagan yang terlalu padat → Setiap bagan hanya boleh menyatakan satu tema
- Data tidak lengkap → Nyatakan dengan jujur "Tidak ada data yang tersedia"
```

**Poin Desain**

* "Keaslian" muncul beberapa kali dalam alur kerja, pengulangan, dan bagian aturan (pengingat kuat)
* Pilih keluaran dua bagian "deskripsi + JSON" untuk integrasi frontend yang mudah
* Tentukan "SQL hanya-baca" untuk mengurangi risiko

## 4. Cara Meningkatkan Prompt Seiring Waktu

### 4.1 Iterasi Lima Langkah

```
Mulai dengan versi yang berfungsi → Uji dalam skala kecil → Catat masalah → Tambahkan aturan/contoh untuk mengatasi masalah → Uji lagi
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Proses Optimasi" width="50%">

Disarankan untuk menguji 5–10 tugas tipikal sekaligus, menyelesaikan satu putaran dalam waktu 30 menit.

### 4.2 Prinsip dan Rasio

*   **Prioritaskan Panduan Positif**: Pertama, beritahu AI apa yang harus dilakukannya
*   **Peningkatan Berbasis Masalah**: Tambahkan batasan hanya ketika masalah muncul
*   **Batasan Moderat**: Jangan langsung menumpuk "larangan" sejak awal

Rasio Empiris: **80% Positif : 20% Negatif**.

### 4.3 Optimasi Tipikal

**Masalah**: Bagan terlalu padat, keterbacaan buruk
**Optimasi**:

1.  Dalam "Informasi Latar Belakang," tambahkan: satu tema per bagan
2.  Dalam "Contoh Referensi," berikan "bagan metrik tunggal"
3.  Jika masalah terus berulang, tambahkan batasan ketat dalam "Aturan Ketat/Pengulangan"

## 5. Teknik Lanjutan

### 5.1 Gunakan XML/Tag untuk Struktur yang Lebih Jelas (Direkomendasikan untuk Prompt Panjang)

Ketika konten melebihi 1000 karakter atau dapat membingungkan, menggunakan tag untuk partisi lebih stabil:

```xml
<Peran>Anda adalah Dex, seorang ahli pengorganisasian data.</Peran>
<Gaya>Teliti, akurat, dan terorganisir.</Gaya>

<Tugas>
Harus diselesaikan dalam langkah-langkah berikut:
1. Identifikasi bidang kunci
2. Ekstrak nilai bidang
3. Standarisasi format (Tanggal YYYY-MM-DD)
4. Keluarkan JSON
</Tugas>

<Aturan>
HARUS: Pertahankan keakuratan nilai bidang
JANGAN PERNAH: Menebak informasi yang hilang
SELALU: Tandai item yang tidak pasti
</Aturan>

<Contoh>
{"Nama":"John Doe","Tanggal":"2024-01-15","Jumlah":5000,"Status":"Dikonfirmasi"}
</Contoh>
```

### 5.2 Pendekatan Berlapis "Latar Belakang + Tugas" (Cara yang Lebih Intuitif)

*   **Latar Belakang** (stabilitas jangka panjang): Siapa agen ini, bagaimana gayanya, dan kemampuan apa yang dimilikinya
*   **Tugas** (sesuai permintaan): Apa yang harus dilakukan sekarang, metrik apa yang harus difokuskan, dan apa cakupan defaultnya

Ini secara alami cocok dengan model "Agen + Tugas" NocoBase: latar belakang yang tetap dengan tugas yang fleksibel.

### 5.3 Penggunaan Kembali Modular

Uraikan aturan umum menjadi modul untuk digabungkan sesuai kebutuhan:

**Modul Keamanan Data**

```
HARUS: Hanya menggunakan SELECT
JANGAN PERNAH: Melaksanakan INSERT/UPDATE/DELETE
```

**Modul Struktur Keluaran**

```
Keluaran harus mencakup:
1) Deskripsi singkat (2-3 kalimat)
2) Konten inti (bagan/data/kode)
3) Saran opsional (jika ada)
```

## 6. Aturan Emas (Kesimpulan Praktis)

1.  Satu AI hanya melakukan satu jenis pekerjaan; spesialisasi lebih stabil
2.  Contoh lebih efektif daripada slogan; berikan model positif terlebih dahulu
3.  Gunakan HARUS/SELALU/JANGAN PERNAH untuk menetapkan batasan
4.  Gunakan pendekatan berorientasi proses untuk mengurangi ketidakpastian
5.  Mulai dari yang kecil, lebih banyak menguji, lebih sedikit mengubah, dan beriterasi terus-menerus
6.  Jangan terlalu banyak batasan; hindari "hard-coding" perilaku
7.  Catat masalah dan perubahan untuk membuat versi
8.  80/20: Pertama, jelaskan "cara melakukannya dengan benar," lalu batasi "apa yang tidak boleh dilakukan salah"

## 7. Pertanyaan Umum

**Q1: Berapa panjang yang ideal?**

*   Agen dasar: 500–800 karakter
*   Agen kompleks: 800–1500 karakter
*   Tidak disarankan >2000 karakter (dapat memperlambat dan berlebihan)
    Standar: Mencakup kesembilan elemen, tetapi tanpa basa-basi.

**Q2: Bagaimana jika AI tidak mengikuti instruksi?**

1.  Gunakan HARUS/SELALU/JANGAN PERNAH untuk memperjelas batasan
2.  Ulangi persyaratan kunci 2–3 kali
3.  Gunakan tag/partisi untuk meningkatkan struktur
4.  Berikan lebih banyak contoh positif, kurangi prinsip abstrak
5.  Evaluasi apakah model yang lebih kuat diperlukan

**Q3: Bagaimana menyeimbangkan panduan positif dan negatif?**
Pertama, tulis bagian positif (peran, alur kerja, contoh), lalu tambahkan batasan berdasarkan kesalahan, dan hanya batasi poin-poin yang "berulang kali salah."

**Q4: Haruskah sering diperbarui?**

*   Latar Belakang (identitas/gaya/kemampuan inti): Stabilitas jangka panjang
*   Tugas (skenario/metrik/cakupan): Sesuaikan sesuai kebutuhan bisnis
*   Buat versi untuk setiap perubahan, dan catat "mengapa diubah."

## 8. Langkah Selanjutnya

**Latihan Praktis**

*   Pilih peran sederhana (misalnya, asisten layanan pelanggan), tulis "versi yang berfungsi" menggunakan sembilan elemen, dan uji dengan 5 tugas tipikal
*   Temukan agen yang sudah ada, kumpulkan 3–5 masalah nyata, dan lakukan iterasi kecil

**Bacaan Lebih Lanjut**

*   [Panduan Konfigurasi Administrator · Agen AI](./admin-configuration.md): Menerapkan prompt ke konfigurasi aktual
*   Manual khusus untuk setiap agen AI: Lihat templat peran/tugas lengkap

## Kesimpulan

**Buat berfungsi, lalu sempurnakan.**
Mulai dengan versi yang "berfungsi", dan terus kumpulkan masalah, tambahkan contoh, serta sempurnakan aturan dalam tugas nyata.
Ingat: **Pertama, beritahu cara melakukannya dengan benar (panduan positif), lalu batasi agar tidak melakukan kesalahan (pembatasan moderat).**