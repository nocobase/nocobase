---
title: "Mendefinisikan Skill"
description: "Memperkenalkan materi depan, isi kata cepat, Pengikatan alat, dan penemuan otomatis direktori staf NocoBase AI SKILLS.md."
keywords: "NocoBase, Keterampilan karyawan AI, SKILLS.md, Pengikatan Alat Keterampilan, laporan analisis bisnis"
---

# Mendefinisikan Skill

Keterampilan tidak mengeksekusi kode. Ini adalah panduan operasional yang diberikan kepada model yang menentukan aliran pemrosesan, alat yang tersedia, langkah-langkah inspeksi, dan persyaratan keluaran.

## Direktori Skill

Gunakan direktori terpisah untuk setiap Keterampilan:

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

di dalam:

- `SKILLS.md` mendefinisikan metadata dan teks kata cepat
- `tools/` Simpan Peralatan yang hanya digunakan dengan Skill ini
- Alat yang ditemukan di `tools/` akan secara otomatis ditambahkan ke daftar alat Keterampilan ini

## Frontmatter `SKILLS.md`

Keterampilan minimum adalah sebagai berikut:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

Bidang yang umum digunakan di frontmatter adalah sebagai berikut:

|Bidang|memengaruhi|
| --- | --- |
| `scope` |Rentang Keterampilan yang tersedia, `SPECIFIED` jika dihilangkan|
| `name` |Nama unik dari skill tersebut|
| `description` |Membantu model menentukan kapan memuat Skill ini|
| `introduction.title` |Judul ditampilkan pada antarmuka manajemen|
| `introduction.about` |Deskripsi tampilan antarmuka manajemen|
| `tools` |Daftar nama Alat tambahan yang perlu dijilid|

Badan Keterampilan disimpan sebagaimana adanya dan ditambahkan ke konteks model setelah Keterampilan dimuat. Teks utama harus fokus pada alur kerja dan batasan, dan tidak menyalin detail implementasi Alat ini.

## Mengikat Tool ke Skill

Ada dua cara.

Yang pertama adalah mendeklarasikannya secara eksplisit di frontmatter:

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

Metode kedua adalah dengan meletakkan Alat tersebut ke dalam direktori `tools/` Keterampilan saat ini:

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

Pemuat akan secara otomatis menemukan `greetDeveloper` dan menggabungkannya ke dalam daftar alat Keterampilan. Alat khusus untuk suatu Keterampilan disarankan untuk ditempatkan di direktori Keterampilan secara default, sehingga lokasi file dapat menyatakan hubungan yang mengikat.


## Bagaimana menulis Skill dengan baik

Skill yang dapat digunakan biasanya berisi konten berikut:

1. Batasan peran dan tugas
2. Perintah pemrosesan yang harus diikuti
3. Alat mana yang harus dipanggil pada setiap langkah?
4. Dalam keadaan apa perlunya konfirmasi dengan pengguna?
5. Cara mengatasi kegagalan Alat
6. Struktur dan kondisi verifikasi hasil akhir

Jika Alat akan mengubah data, Keterampilan harus secara eksplisit meminta model menunggu Alat memberikan hasil yang berhasil dan tidak dapat mengklaim bahwa operasi telah selesai sebelum memanggilnya.

## Contoh Keterampilan Bawaan: `business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` memecah analisis bisnis menjadi alur kerja yang jelas:

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

Teks tersebut tidak hanya mengatakan "menghasilkan laporan bisnis", tetapi terus menetapkan:

- Mulailah dengan memahami tujuan keputusan, audiens, kerangka waktu, dan metrik
- Jika data bisnis terlibat, ToolCall pertama harus memuat Keterampilan `data-query`
- Menebak tabel data, jalur asosiasi, dan hasil kueri tidak diperbolehkan
- Hubungi `businessReportGenerator` hanya setelah data siap
- Laporan Bagan dan Penurunan Harga dihasilkan di ToolCall yang sama
- Tentukan keberhasilan berdasarkan `status`, `chartCount`, `errors` dan `warnings` yang dikembalikan oleh Alat
- Coba lagi sekali saja jika diagram gagal, lalu kembali ke pelaporan penurunan harga biasa

Jenis aturan ini adalah nilai utama Keterampilan - aturan ini meringkas "apa yang dapat dilakukan model" menjadi proses yang dapat diulang dan diperiksa.

## Tautan terkait

- [Pengembangan Plugin Karyawan AI](./index.md) — Pahami di mana Keterampilan cocok dengan ekstensi Karyawan AI
- [Mendefinisikan Tool server](./define-tool.md) — tentukan Alat yang dapat dipanggil oleh Keterampilan
- [Tentukan karyawan AI bawaan](./define-ai-employee.md) — Mengikat Keterampilan ke karyawan tetap
- [Jadilah Karyawan AI Pembantu Pengembang](./complete-example.md) — Lihat contoh pengikatan lengkap Keterampilan dan Alat
