---
pkg: '@nocobase/plugin-ai'
title: 'Menggunakan Lina dan HY-MT1.5-1.8B lokal untuk menerjemahkan entri lokalisasi'
description: 'Deploy model terjemahan HY-MT1.5 GGUF dengan llama-server dan konfigurasikan agar Lina menerjemahkan entri lokalisasi NocoBase secara batch.'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Menggunakan Lina dan HY-MT1.5-1.8B lokal untuk menerjemahkan entri lokalisasi

Panduan ini menjelaskan praktik penerjemahan lokalisasi: deploy model kecil khusus terjemahan secara lokal, ekspos sebagai layanan yang kompatibel dengan OpenAI, lalu konfigurasikan untuk Lina agar dapat menerjemahkan entri lokalisasi NocoBase secara batch.

Pendekatan ini cocok untuk menerjemahkan banyak entri sistem, teks plugin, menu, judul koleksi, dan label field. Dibandingkan model online, model lokal tidak terdampak batas RPM, TPM, atau konkurensi API eksternal, dan konkurensi dapat disesuaikan menurut kemampuan mesin dan model.

## Gambaran umum

Panduan ini menggunakan:

- Model: `tencent/HY-MT1.5-1.8B-GGUF`
- Layanan inferensi: `llama-server`
- Integrasi: OpenAI-compatible API
- AI Employee: Lina
- Titik masuk: halaman Localization Management

:::info{title=Catatan}
HY-MT1.5-1.8B adalah model kecil khusus terjemahan. Model ini lebih cocok untuk entri pendek, teks UI, dan terjemahan batch. Model chat umum tidak direkomendasikan sebagai pilihan pertama untuk tugas lokalisasi.
:::

## Prasyarat

- Plugin **Localization Management** sudah diaktifkan.
- Bahasa target sudah diaktifkan.
- Entri lokalisasi sudah disinkronkan.
- Mesin lokal atau server dapat menjalankan [`llama-server`](https://github.com/ggml-org/llama.cpp).
- Layanan NocoBase dapat mengakses alamat HTTP `llama-server`.

## Deploy HY-MT GGUF

### Instal llama.cpp

Di macOS, Anda dapat menginstalnya dengan Homebrew:

```bash
brew install llama.cpp
```

Anda juga dapat memakai binary llama.cpp yang sudah dibangun atau membangunnya dari source. Syarat akhirnya adalah `llama-server` tersedia.

### Mulai layanan kompatibel OpenAI

Mulai layanan dengan model GGUF dari Hugging Face:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| Parameter | Deskripsi |
| --- | --- |
| `-hf` | Memuat model dari Hugging Face. |
| `--host` | Alamat listen. Gunakan `127.0.0.1` untuk pengujian lokal atau `0.0.0.0` untuk akses container atau remote. |
| `--port` | Port layanan HTTP. |
| `-c` | Panjang konteks. Entri lokalisasi biasanya pendek, sehingga `2048` biasanya cukup. |
| `-np` | Jumlah slot paralel. Sesuaikan dengan performa mesin. |

:::info{title=Tips}
Jika sumber daya server terbatas, mulai dari `-np 1` atau `-np 2`, lalu tingkatkan bertahap setelah stabilitas terverifikasi.
:::

## Uji layanan model

Setelah `llama-server` berjalan, periksa kesehatan layanan:

```bash
curl http://127.0.0.1:8000/health
```

Lalu uji terjemahan melalui API kompatibel OpenAI:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

Jika menggunakan file model lokal, ubah `model` menjadi nama model sebenarnya yang dikembalikan atau dikonfigurasi oleh layanan.

:::warning{title=Catatan}
Jika permintaan tidak merespons lama, model mungkin terlalu lambat, konkurensi terlalu tinggi, atau konteks terlalu besar. Turunkan `-np` dan konkurensi terjemahan NocoBase terlebih dahulu, lalu amati waktu respons.
:::

## Konfigurasi layanan LLM di NocoBase

Buka `System Settings -> AI Employees -> LLM service` dan tambahkan layanan LLM.

| Pengaturan | Contoh |
| --- | --- |
| Provider | OpenAI (completions) |
| Title | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | Jika `llama-server` tidak memakai autentikasi, gunakan placeholder seperti `dummy`. |
| Enabled Models | Pilih `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M`, atau masukkan nama model sebenarnya. |

Setelah konfigurasi, gunakan `Test flight` untuk memverifikasi model.

:::info{title=Tips}
Jika NocoBase berjalan di Docker, `127.0.0.1` menunjuk ke container itu sendiri dan mungkin tidak dapat mengakses layanan host. Gunakan IP host, alamat jaringan container, atau `host.docker.internal`.
:::

## Konfigurasi model khusus Lina

Buka `System Settings -> AI Employees -> AI employees`, buka Lina, lalu pindah ke `Model settings`.

1. Aktifkan `Enable dedicated model configuration`.
2. Pilih model HY-MT lokal di `Models`.
3. Simpan konfigurasi.

Setelah itu, Lina akan menggunakan model ini untuk tugas terjemahan lokalisasi dan menghindari penggunaan model chat umum.

Untuk detail, lihat [Mengonfigurasi model AI Employee](/ai-employees/features/model-settings).

## Konfigurasi konkurensi terjemahan

Konkurensi tugas terjemahan lokalisasi dikontrol oleh `AI_LOCALIZATION_CONCURRENCY`:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

Aturan:

- Default: `10`
- Minimum: `1`
- Maksimum: `20`
- Nilai di luar rentang menggunakan default

Konkurensi terbaik bergantung pada CPU, GPU, memori, kuantisasi model, dan `llama-server -np`. Jika konkurensi default bermasalah:

1. Mulai dengan `AI_LOCALIZATION_CONCURRENCY=1` dan verifikasi terjemahan satu entri.
2. Setel `llama-server -np` dan `AI_LOCALIZATION_CONCURRENCY` ke `2` atau `4`.
3. Amati waktu respons, penggunaan CPU/GPU, dan progres tugas.
4. Naikkan bertahap hanya jika stabil.

:::warning{title=Catatan}
Jangan menetapkan konkurensi terlalu tinggi di awal. Jika melebihi kapasitas model, tugas bisa melambat karena antrean, timeout, atau layanan macet.
:::

## Jalankan terjemahan lokalisasi

Buka `System Management -> Localization Management`.

1. Pindah ke bahasa target.
2. Klik `Synchronize` untuk memastikan entri tersinkron.
3. Klik avatar Lina.
4. Pilih cakupan tugas:
   - `Incremental translation`: menerjemahkan entri yang belum memiliki terjemahan.
   - `Selected translation`: menerjemahkan entri yang dipilih di tabel.
   - `Full translation`: menerjemahkan semua entri pada bahasa saat ini.
5. Periksa jumlah entri, provider, dan model di dialog konfirmasi.
6. Jika memilih terjemahan incremental atau penuh, pilih cakupan terjemahan:
   - `All`
   - `Built-in entries`: entri sistem dan plugin.
   - `Custom entries`: nama route, nama collection dan field, serta konten UI.
7. Sesuaikan bahasa terjemahan referensi jika diperlukan. Terjemahan incremental dan penuh mengatur bahasa referensi secara terpisah untuk entri bawaan dan entri kustom; terjemahan item terpilih hanya menampilkan satu konfigurasi bahasa referensi umum.
8. Konfirmasi untuk membuat tugas asinkron.
9. Tunggu selesai, tinjau terjemahan, lalu publikasikan.

Mulai dari `Selected translation` untuk beberapa entri guna memeriksa gaya keluaran dan kecepatan sebelum menjalankan terjemahan incremental atau penuh.

## Cara Lina membangun permintaan terjemahan

Lina membangun permintaan dari entri dan terjemahan referensi. Untuk entri pendek, referensi yang ada digunakan untuk meningkatkan konsistensi:

- Entri bawaan menggunakan terjemahan bahasa Tionghoa sebagai referensi default dan bahasa Jepang sebagai referensi cadangan.
- Entri kustom menggunakan bahasa default sistem sebagai referensi default dan bahasa Tionghoa sebagai referensi cadangan.
- Pengguna dapat menyesuaikan bahasa default dan bahasa cadangan di dialog konfirmasi tugas.
- Sistem terlebih dahulu menggunakan terjemahan referensi dalam bahasa default. Jika tidak tersedia, sistem mencoba bahasa cadangan.
- Hasil terjemahan ditulis ke bahasa target, tetapi tidak dipublikasikan otomatis.

Semantik prompt kira-kira seperti:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Pemecahan masalah

### Tidak ada progres setelah membuat tugas

Periksa apakah `llama-server` menerima permintaan. Lihat log layanan atau panggil `/v1/chat/completions` dengan `curl`.

Jika model menerima permintaan tetapi tidak mengembalikan respons, turunkan:

- `AI_LOCALIZATION_CONCURRENCY`
- `llama-server -np`
- `llama-server -c`

### Model mengembalikan penjelasan, bukan terjemahan

Model terjemahan lokal biasanya lebih stabil daripada model chat umum. Jika penjelasan masih muncul, uji prompt yang sama dengan `curl` terlebih dahulu untuk memeriksa gaya keluaran model. Anda juga dapat menerjemahkan entri yang lebih pendek atau menurunkan parameter sampling seperti temperature.

### NocoBase tidak dapat terhubung ke layanan model

Periksa:

- Apakah Base URL menyertakan `/v1`.
- Apakah runtime NocoBase dapat mengakses alamat tersebut.
- Apakah firewall atau jaringan container memblokir port.
- Apakah `llama-server` masih berjalan.

## Tinjau sebelum publikasi

Setelah terjemahan AI selesai, tinjau sebelum publikasi:

- Filter berdasarkan modul dan periksa entri pendek seperti menu, tombol, nama field, dan status.
- Periksa variabel, placeholder, tag HTML, dan simbol format.
- Periksa konsistensi istilah bisnis penting.
- Jika terjemahan entri bawaan tertimpa, sinkronkan ulang di Localization Management dan pilih `Reset system built-in entry translations` untuk memulihkan default. Untuk berkontribusi pada terjemahan default sistem dan plugin resmi, lihat [Translation Contribution](/get-started/translations).
- Publikasikan di lingkungan uji terlebih dahulu, lalu sinkronkan ke produksi.

## Referensi

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [Dokumentasi llama-server](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina: insinyur lokalisasi](/ai-employees/built-in/lina)
