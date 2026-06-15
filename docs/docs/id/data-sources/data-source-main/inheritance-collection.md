---
pkg: "@nocobase/plugin-data-source-main"
title: "Collection Inheritance"
description: "Collection Inheritance memperluas field berdasarkan tabel yang sudah ada, Collection child mewarisi field dan data Collection parent, cocok untuk reuse dan ekstensi struktur tabel, hanya didukung oleh PostgreSQL."
keywords: "collection inheritance,Inheritance Collection,table inheritance,perluasan collection,PostgreSQL,NocoBase"
---
# Collection Inheritance

## Pengantar

:::warning
Hanya didukung ketika database utama adalah PostgreSQL.
:::

Anda dapat membuat Collection parent, lalu menurunkan Collection child dari parent tersebut. Collection child akan mewarisi struktur Collection parent, dan juga dapat mendefinisikan kolomnya sendiri. Pola desain ini membantu mengatur dan mengelola data yang memiliki struktur serupa tetapi mungkin memiliki beberapa perbedaan.

Berikut adalah beberapa karakteristik umum dari collection inheritance:

Collection Parent: Collection parent berisi kolom dan data umum, mendefinisikan struktur dasar dari seluruh hierarki inheritance.
Collection Child: Collection child mewarisi struktur Collection parent, tetapi juga dapat mendefinisikan kolomnya sendiri secara tambahan. Ini memungkinkan setiap Collection child memiliki properti umum dari Collection parent, sekaligus dapat berisi properti spesifik untuk subclass.
Kueri: Saat melakukan kueri, Anda dapat memilih untuk mengkueri seluruh hierarki inheritance, atau hanya mengkueri Collection parent atau Collection child tertentu. Ini memungkinkan pengambilan dan pemrosesan data pada level yang berbeda sesuai kebutuhan.
Hubungan Inheritance: Hubungan inheritance dibangun antara Collection parent dan Collection child, yang berarti Anda dapat menggunakan struktur Collection parent untuk mendefinisikan properti yang konsisten, sambil memungkinkan Collection child untuk memperluas atau menimpa properti tersebut.
Pola desain ini membantu mengurangi redundansi data, menyederhanakan model database, sekaligus membuat data lebih mudah dirawat. Namun, perlu digunakan dengan hati-hati, karena collection inheritance dapat meningkatkan kompleksitas kueri, terutama saat memproses seluruh hierarki inheritance. Sistem database yang mendukung collection inheritance biasanya menyediakan sintaks dan alat khusus untuk mengelola dan mengkueri struktur tabel ini.


## Panduan Penggunaan

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)
