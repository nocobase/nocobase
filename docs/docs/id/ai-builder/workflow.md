---
title: "Manajemen Workflow"
description: "Skill Manajemen Workflow digunakan untuk membuat, mengedit, mengaktifkan, dan mendiagnosis Workflow NocoBase."
keywords: "Pembangunan AI,Workflow,Trigger,Node,Persetujuan,Otomatisasi"
---

# Manajemen Workflow

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

## Pengantar

Skill Manajemen Workflow digunakan untuk membuat, mengedit, mengaktifkan, dan mendiagnosis Workflow NocoBase — dari pemilihan trigger hingga pembangunan rangkaian Node, hingga troubleshooting hasil eksekusi, mencakup siklus hidup penggunaan Workflow secara lengkap.


## Cakupan Kemampuan

Dapat dilakukan:

- Membuat Workflow: memilih tipe trigger, menambahkan Node pemrosesan satu per satu
- Mengedit Workflow: memodifikasi konfigurasi trigger, menambah/menghapus/mengubah Node, memindahkan dan menyalin Node
- Manajemen versi: versi yang sudah dieksekusi akan secara otomatis membuat revisi baru, tanpa memengaruhi catatan history
- Mengaktifkan dan menjalankan Workflow secara manual
- Mendiagnosis eksekusi yang gagal: menemukan Node yang gagal dan informasi error

Tidak dapat dilakukan:

- Tidak dapat merancang model data (gunakan [Skill Pemodelan Data](./data-modeling))
- Tidak dapat memasang MCP atau menangani masalah lingkungan (gunakan [Skill Manajemen Lingkungan](./env-bootstrap))
- Tidak dapat menghapus seluruh Workflow (operasi berisiko tinggi yang memerlukan konfirmasi terpisah)
- Tidak dapat mengarang tipe Node atau tipe trigger

## Contoh Prompt

### Skenario A: Membuat Workflow Baru

```
Bantu saya orkestrasikan satu Workflow yang otomatis mengurangi stok barang setelah pesanan dibuat
```

Skill akan terlebih dahulu mengonfirmasi tipe trigger dan desain rangkaian Node, setelah dikonfirmasi membuat secara bertahap.

![20260419234303](https://static-docs.nocobase.com/20260419234303.png)

### Skenario B: Mengedit Workflow yang Sudah Ada

```
Pada Workflow pembuatan pesanan, tambahkan Node notifikasi ketika stok tidak mencukupi, kirim pesan internal ke administrator
```

Jika versi saat ini sudah dieksekusi, akan membuat revisi baru terlebih dahulu sebelum diedit, tanpa memengaruhi catatan eksekusi history.

![20260419234419](https://static-docs.nocobase.com/20260419234419.png)

### Skenario C: Mendiagnosis Eksekusi yang Gagal

```
Workflow pengurangan stok setelah pembuatan pesanan baru-baru ini gagal dieksekusi, bantu saya melihat di mana masalahnya
```

Akan menemukan eksekusi terakhir yang gagal, menemukan Node yang gagal dan informasi error, memberikan saran perbaikan.

![20260419234532](https://static-docs.nocobase.com/20260419234532.png)

### Skenario D: Menganalisis atau Merangkum Logika Workflow

```
Bantu saya menganalisis logika pemrosesan dari Workflow "Pembuatan Pesanan Mengurangi Stok Barang"
```

Output:

```markdown
# Analisis Workflow: Pembuatan Pesanan Mengurangi Stok Barang

## Ikhtisar Workflow
**Nama Workflow:** Pembuatan Pesanan Mengurangi Stok Barang

### Trigger
- **Tipe:** Event Pasca-Action (Action)
- **Kondisi Trigger:** Dipicu saat Collection `orders` (pesanan) menjalankan operasi "create" (trigger global).
- **Data Terkait:** Membawa data relasi `details` (detail pesanan) saat dipicu.
- **Mode Eksekusi:** Asinkron

---

### Rantai Eksekusi Node

**[Trigger] Pembuatan Pesanan**
        │
        ▼
**[1] Loop Detail Pesanan (Loop)**
    * **Target:** `{{$context.data.details}}`
    * *Operasi: Untuk setiap item detail menjalankan langkah berikut:*
        │
        ▼
    **branchIndex=0 (Loop Body)**
        │
        ▼
    **[2] Query Stok Barang (Query)**
    * **Collection:** `products`
    * **Kondisi Filter:** `id = {{$scopes.5u6lsjzf8vh.item.productId}}`
        │
        ▼
    **[3] Periksa Apakah Stok Mencukupi (Condition)**
    * **Engine:** `formula.js`
    * **Ekspresi:** `{{$jobsMapByNodeKey.n6rf8lf2lum.inventory}} < {{$scopes.5u6lsjzf8vh.item.quantity}}`
        │
        ├── **YES (branchIndex=1, Stok Tidak Mencukupi, Kondisi TRUE):**
        │   ▼
        │   **[4] Notifikasi Super Administrator (Notification)**
        │   *Mengirim notifikasi ke pengguna role root, isi termasuk:*
        │   *Nama produk, ID produk, stok saat ini, jumlah kebutuhan pesanan.*
        │
        └── **NO (branchIndex=0, Stok Mencukupi, Branch Kosong)**
        │
        ▼
    **[5] Mengurangi Stok (SQL)**
    * **SQL Statement:** `UPDATE products SET inventory = inventory - :quantity`

---

### Penjelasan Logika Kunci

| Tahap | Penjelasan |
| :--- | :--- |
| **Trigger** | Saat pesanan dibuat, sistem membawa daftar detail pesanan lengkap masuk ke Workflow. |
| **Loop** | Memproses item demi item berdasarkan baris detail, setiap baris sesuai dengan satu produk dan jumlah pembeliannya. |
| **Query** | Mengambil stok produk saat ini melalui `productId`. |
| **Penilaian** | Menilai apakah `inventory < quantity` benar (yaitu apakah stok tidak mencukupi). |
| **Notifikasi** | Jika stok tidak mencukupi, mengirim pesan internal ke pengguna dengan role `root`. |
| **Pengurangan** | Memperbarui stok langsung melalui SQL; karena branch bergabung, terlepas dari apakah stok mencukupi atau tidak akan tetap menjalankan pengurangan. |

---

### ⚠️ Masalah Desain Potensial

`downstreamId` Node Condition mengarah ke Node "Mengurangi Stok", yang berarti tidak peduli branch mana yang ditempuh (stok mencukupi atau tidak), pada akhirnya akan bergabung dan menjalankan operasi pengurangan. Perilaku aktual sebagai berikut:

- **Stok Mencukupi** $\rightarrow$ Langsung mengurangi stok (alur normal). ✓
- **Stok Tidak Mencukupi** $\rightarrow$ Pertama notifikasi administrator, **selanjutnya tetap menjalankan pengurangan** (mungkin menyebabkan stok menjadi negatif).

**Analisis:** Desain ini termasuk pola "memungkinkan oversell dan mengeluarkan peringatan", bisa juga merupakan kelalaian logis (maksud asli seharusnya mencegah pengurangan saat stok tidak mencukupi). Perlu dikonfirmasi lebih lanjut dengan pihak bisnis tentang maksud desain.

---

### Status Saat Ini

- **Status Aktif:** `false` (dinonaktifkan)
- **Catatan Eksekusi:** Sudah dieksekusi 1 kali.
- **Kontrol Versi:** Versi saat ini dalam status frozen, jika perlu modifikasi harus membuat versi baru terlebih dahulu.
```

## Pertanyaan Umum

**Mengapa Workflow yang dibuat tidak ter-trigger?**

Workflow yang baru dibuat secara default dalam status disabled (`enabled: false`). Perlu memastikan konfigurasi trigger sudah benar baru mengaktifkannya secara manual.

**Apakah catatan eksekusi history akan terpengaruh setelah modifikasi Workflow?**

Tidak. Jika versi saat ini sudah memiliki catatan eksekusi, Skill akan secara otomatis membuat revisi baru, catatan eksekusi history terikat pada versi lama, tidak terpengaruh.

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [Pemodelan Data](./data-modeling) — Gunakan AI untuk membuat dan mengelola tabel data
- [Manajemen Lingkungan](./env-bootstrap) — Pemeriksaan lingkungan, instalasi deployment, dan diagnostik masalah
