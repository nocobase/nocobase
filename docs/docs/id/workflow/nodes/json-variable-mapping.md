---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
title: "Node Workflow - Pemetaan Variable JSON"
description: "Node Pemetaan Variable JSON: memetakan struktur JSON menjadi variable, untuk digunakan oleh Node berikutnya."
keywords: "Workflow,Pemetaan Variable JSON,Pemetaan JSON,ekstraksi variable,NocoBase"
---

# Pemetaan Variable JSON

> v1.6.0

## Pengantar

Digunakan untuk memetakan struktur JSON kompleks dari hasil Node upstream menjadi variable, untuk digunakan oleh Node berikutnya. Misalnya hasil dari Node Operasi SQL dan Node HTTP Request, setelah dipetakan dapat menggunakan nilai propertinya pada Node berikutnya.

:::info{title=Tips}
Berbeda dengan Node Komputasi JSON, Node Pemetaan Variable JSON tidak mendukung expression kustom, dan tidak berbasis engine pihak ketiga. Hanya digunakan untuk memetakan nilai properti dari struktur JSON, tetapi penggunaannya lebih sederhana.
:::

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "Pemetaan Variable JSON":

![Membuat Node](https://static-docs.nocobase.com/20250113173635.png)

## Konfigurasi Node

### Sumber Data

Sumber data dapat berupa hasil Node upstream, atau objek data dari konteks alur, biasanya berupa objek data yang tidak terstruktur secara built-in, seperti hasil Node SQL, atau hasil Node HTTP Request.

![Sumber Data](https://static-docs.nocobase.com/20250113173720.png)

### Input Data Sample

Dengan paste sebuah data sample, dan klik tombol parse, akan otomatis menghasilkan list variable:

![Input Data Sample](https://static-docs.nocobase.com/20250113182327.png)

Pada list yang dihasilkan otomatis, jika ada variable yang tidak diperlukan, dapat diklik tombol hapus untuk menghapusnya.

:::info{title=Tips}
Data sample bukan hasil eksekusi final, hanya digunakan untuk membantu menghasilkan list variable.
:::

### Path Mengandung Index Array

Jika tidak dicentang, akan memetakan konten array berdasarkan cara default penanganan variable workflow NocoBase. Misalnya input sample berikut:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Pada variable yang dihasilkan `b.c` akan mewakili array `[2, 3]`.

Jika opsi ini dicentang, akan menyertakan index array pada path variable, misalnya `b.0.c` dan `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Saat menyertakan index array, harus dipastikan index array pada data input konsisten, jika tidak akan menyebabkan error parsing.

## Penggunaan pada Node Berikutnya

Pada konfigurasi Node berikutnya, dapat digunakan variable yang dihasilkan oleh Node Pemetaan Variable JSON:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Meskipun struktur JSON mungkin sangat kompleks, setelah dipetakan, Anda hanya perlu memilih variable dari path yang sesuai.
