:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/ai-employees/quick-start).
:::

# Memulai Cepat

Mari selesaikan konfigurasi minimum yang dapat digunakan untuk AI Employee dalam 5 menit.

## Instal Plugin

AI Employee adalah plugin bawaan NocoBase (`@nocobase/plugin-ai`), sehingga tidak memerlukan instalasi terpisah.

## Konfigurasi Model

Anda dapat mengonfigurasi layanan LLM melalui salah satu pintu masuk berikut:

1. Pintu masuk admin: `Pengaturan Sistem -> AI Employee -> Layanan LLM`.
2. Pintasan frontend: Di panel obrolan AI, gunakan `Model Switcher` untuk memilih model, lalu klik pintasan "Tambah layanan LLM" untuk langsung menuju ke sana.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Biasanya Anda perlu mengonfirmasi:
1. Pilih Provider.
2. Isi API Key.
3. Konfigurasi `Enabled Models`; cukup gunakan Recommend secara default.

## Mengaktifkan Employee Bawaan

AI Employee bawaan sudah diaktifkan secara default, dan biasanya tidak perlu diaktifkan satu per satu secara manual.

Jika Anda perlu menyesuaikan ketersediaan (mengaktifkan/menonaktifkan employee tertentu), Anda dapat mengubah sakelar `Enabled` pada halaman daftar `Pengaturan Sistem -> AI Employee`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Mulai Berkolaborasi

Pada halaman aplikasi, arahkan kursor ke pintasan di sudut kanan bawah dan pilih AI Employee.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Klik untuk membuka dialog obrolan AI:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Anda juga dapat:  
* Tambah blok
* Tambah lampiran
* Aktifkan Pencarian Web
* Ganti AI Employee
* Pilih model

Mereka juga dapat secara otomatis mengambil struktur halaman sebagai konteks. Misalnya, Dex pada blok formulir dapat secara otomatis mengambil struktur bidang (field) formulir dan memanggil keahlian yang sesuai untuk mengoperasikan halaman tersebut.

## Tugas Pintasan 

Anda dapat mengatur tugas umum untuk setiap AI Employee di lokasi saat ini, sehingga Anda dapat mulai bekerja hanya dengan satu klik, menjadikannya cepat dan nyaman.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Ikhtisar Employee Bawaan

NocoBase menyediakan beberapa AI Employee bawaan untuk berbagai skenario.

Anda hanya perlu:

1. Konfigurasi layanan LLM.
2. Sesuaikan status aktif employee jika diperlukan (diaktifkan secara default).
3. Pilih model dalam obrolan dan mulai berkolaborasi.

| Nama Employee | Posisi Peran | Kemampuan Inti |
| :--- | :--- | :--- |
| **Cole** | Asisten NocoBase | Tanya jawab penggunaan produk, pengambilan dokumen |
| **Ellis** | Pakar Email | Penulisan email, pembuatan ringkasan, saran balasan |
| **Dex** | Pakar Pengaturan Data | Terjemahan bidang (field), pemformatan, ekstraksi informasi |
| **Viz** | Analis Wawasan | Wawasan data, analisis tren, interpretasi indikator utama |
| **Lexi** | Asisten Terjemahan | Terjemahan multibahasa, bantuan komunikasi |
| **Vera** | Analis Riset | Pencarian web, agregasi informasi, riset mendalam |
| **Dara** | Pakar Visualisasi Data | Konfigurasi bagan, pembuatan laporan visual |
| **Orin** | Pakar Pemodelan Data | Membantu merancang struktur koleksi, saran bidang (field) |
| **Nathan** | Insinyur Frontend | Membantu penulisan cuplikan kode frontend, penyesuaian gaya |

**Catatan**

Beberapa AI Employee bawaan tidak muncul dalam daftar di sudut kanan bawah karena mereka memiliki skenario kerja khusus:

- Orin: Halaman pemodelan data.
- Dara: Blok konfigurasi bagan.
- Nathan: JS Block dan editor kode serupa.