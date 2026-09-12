---
title: "Komponen bersama"
description: "Komponen bersama NocoBase client v2: kontainer formulir, field formulir, filter, tabel, dan ikon."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Komponen bersama

NocoBase client v2 menyediakan sekumpulan komponen bersama. Saat membuat halaman plugin, halaman pengaturan, atau formulir, kamu bisa langsung memakainya untuk menggunakan kembali UI dan interaksi yang sudah disiapkan NocoBase.

Bagian ini mengelompokkan komponen berdasarkan skenario penggunaan. Setiap halaman membahas satu komponen: kapan dipakai, API yang umum digunakan, dan apakah bisa dipratinjau di dokumentasi.

## Indeks cepat

| Saya ingin... | Lihat di |
| --- | --- |
| Mengontrol pemindai layar penuh tingkat rendah | [CodeScanner](./form/code-scanner) |
| Menempatkan formulir standar di dialog | [DialogFormLayout](./form/dialog-form-layout) |
| Menempatkan formulir standar di drawer | [DrawerFormLayout](./form/drawer-form-layout) |
| Hanya mengizinkan variabel lingkungan `$env` | [EnvVariableInput](./form/env-variable-input) |
| Memasukkan ukuran file dan menyimpannya sebagai byte | [FileSizeInput](./form/file-size-input) |
| Mengedit konfigurasi JSON / JSON5 | [JsonTextArea](./form/json-text-area) |
| Memasukkan kata sandi dengan indikator kekuatan | [PasswordInput](./form/password-input) |
| Memuat opsi Select secara asinkron dari API | [RemoteSelect](./form/remote-select) |
| Menambahkan dukungan pemindaian ke input | [ScanInput](./form/scan-input) |
| Membuat field menerima konstanta dan variabel sekaligus | [TypedVariableInput](./form/typed-variable-input) |
| Membuat field satu baris menerima variabel seperti `{{ $env.X }}` dan `{{ $user.name }}` | [VariableInput](./form/variable-input) |
| Menyisipkan variabel ke konfigurasi JSON / JSON5 | [VariableJsonTextArea](./form/variable-json-text-area) |
| Membuat teks multi-baris menerima variabel | [VariableTextArea](./form/variable-text-area) |
| Memfilter Collection dengan beberapa kondisi | [CollectionFilter](./filter/) |
| Menyematkan panel filter Collection ke halaman | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Menyesuaikan baris drag pada antd Table | [SortableRow](./table/sortable-row) |
| Menyesuaikan kolom pegangan drag pada Table | [SortHandle](./table/sort-handle) |
| Menampilkan daftar, memilih baris, dan mengurutkan baris dengan drag di halaman pengaturan | [Table](./table/) |
| Menggunakan ikon Ant Design atau mendaftarkan ikon kustom | [Icon](./icon) |
| Membuat registry internal untuk item ekstensi plugin | [createFormRegistry](./create-form-registry) |

## Cara penggunaan

Impor komponen yang diperlukan di plugin klien, lalu gunakan seperti komponen React biasa:

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## Saran penggunaan

Secara default gunakan React + Antd. Untuk skenario umum plugin NocoBase, periksa komponen ini terlebih dahulu:

- Membuka formulir drawer atau dialog di halaman pengaturan
- Menyisipkan variabel, mengedit JSON, memasukkan ukuran file, atau memindai kode di field formulir
- Menggunakan filter Collection atau pengurutan drag di halaman daftar
- Menggunakan pintu masuk ikon terpadu NocoBase

Untuk input, tombol, dan pesan biasa, komponen Antd biasanya lebih jelas.

## Tautan terkait

- [Pengembangan komponen](../plugin-development/client/component/index.md)
- [Context - Kemampuan umum](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
