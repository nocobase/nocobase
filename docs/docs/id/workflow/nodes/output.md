---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Output Alur Kerja

## Pendahuluan

Node "Output Alur Kerja" digunakan dalam alur kerja yang dipanggil untuk mendefinisikan nilai outputnya. Ketika suatu alur kerja dipanggil oleh alur kerja lain, node "Output Alur Kerja" dapat digunakan untuk meneruskan nilai kembali ke pemanggil.

## Membuat Node

Dalam alur kerja yang dipanggil, tambahkan node "Output Alur Kerja":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Mengonfigurasi Node

### Nilai Output

Masukkan atau pilih variabel sebagai nilai output. Nilai output dapat berupa tipe apa pun, seperti konstanta (string, angka, nilai logis, tanggal, atau JSON kustom), atau variabel lain dari alur kerja.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Tips}
Jika beberapa node "Output Alur Kerja" ditambahkan ke alur kerja yang dipanggil, nilai dari node "Output Alur Kerja" terakhir yang dieksekusi akan menjadi output saat alur kerja tersebut dipanggil.
:::