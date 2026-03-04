:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/interface-builder/blocks/block-settings/drag-sort).
:::

# Pengurutan Drag-and-Drop

## Pendahuluan

Pengurutan drag-and-drop bergantung pada bidang urutan untuk menyusun ulang rekaman secara manual di dalam sebuah blok.


:::info{title=Tip}
* Ketika bidang urutan yang sama digunakan untuk pengurutan drag-and-drop di beberapa blok, hal ini dapat mengganggu urutan yang sudah ada.
* Saat menggunakan pengurutan drag-and-drop pada tabel, bidang urutan tidak boleh memiliki aturan pengelompokan yang dikonfigurasi.
* Tabel pohon (tree table) hanya mendukung pengurutan simpul (node) dalam tingkat yang sama.

:::


## Konfigurasi

Tambahkan bidang tipe "Urutan" (Sort). Bidang urutan tidak lagi dibuat secara otomatis saat membuat koleksi; bidang tersebut harus dibuat secara manual.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Saat mengaktifkan pengurutan drag-and-drop untuk tabel, Anda perlu memilih bidang urutan.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Pengurutan Drag-and-Drop untuk Baris Tabel


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Penjelasan Aturan Pengurutan

Misalkan urutan saat ini adalah:

```
[1,2,3,4,5,6,7,8,9]
```

Ketika sebuah elemen (misalnya 5) dipindahkan ke depan ke posisi 3, hanya nilai urutan 3, 4, dan 5 yang akan berubah: 5 menempati posisi 3, sedangkan 3 dan 4 masing-masing bergeser mundur satu posisi.

```
[1,2,5,3,4,6,7,8,9]
```

Jika Anda kemudian memindahkan 6 ke belakang ke posisi 8, 6 akan menempati posisi 8, sedangkan 7 dan 8 masing-masing bergeser maju satu posisi.

```
[1,2,5,3,4,7,8,6,9]
```