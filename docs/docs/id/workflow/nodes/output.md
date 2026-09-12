---
pkg: '@nocobase/plugin-workflow-subflow'
title: "Node Workflow - Output Alur"
description: "Node Output Alur: mendefinisikan nilai output dalam workflow yang dipanggil, untuk digunakan oleh pemanggil."
keywords: "Workflow,Output Alur,Output,output sub-alur,passing variable,NocoBase"
---

# Output Alur

## Pengantar

Node "Output Alur" digunakan dalam workflow yang dipanggil, untuk mendefinisikan nilai output dari workflow tersebut. Saat sebuah workflow dipanggil oleh workflow lain, dapat meneruskan nilai kembali ke pemanggil melalui Node "Output Alur".

## Membuat Node

Pada workflow yang dipanggil, tambahkan Node "Output Alur":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Konfigurasi Node

### Nilai Output

Masukkan atau pilih variable sebagai nilai output. Nilai output dapat berupa tipe apa pun, dapat berupa konstanta seperti string, angka, boolean, tanggal atau JSON kustom, dll., dapat juga berupa variable lain dalam alur.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Tips}
Jika beberapa Node "Output Alur" ditambahkan dalam workflow yang dipanggil, maka saat workflow tersebut dipanggil, akan dioutput dengan nilai dari Node "Output Alur" terakhir yang dieksekusi.
:::
