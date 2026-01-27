---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Pewarisan Koleksi

## Pendahuluan

:::warning
Hanya didukung jika database utama adalah PostgreSQL.
:::

Anda dapat membuat sebuah koleksi induk, lalu menurunkan koleksi turunan dari koleksi induk tersebut. Koleksi turunan akan mewarisi struktur koleksi induk, dan juga dapat mendefinisikan kolomnya sendiri. Pola desain ini membantu dalam mengorganisir dan mengelola data yang memiliki struktur serupa namun mungkin memiliki beberapa perbedaan.

Berikut adalah beberapa fitur umum dari koleksi yang dapat diwariskan:

-   **Koleksi Induk**: Koleksi induk berisi kolom dan data umum, mendefinisikan struktur dasar dari seluruh hierarki pewarisan.
-   **Koleksi Turunan**: Koleksi turunan mewarisi struktur koleksi induk, tetapi juga dapat mendefinisikan kolomnya sendiri. Ini memungkinkan setiap koleksi turunan memiliki properti umum dari koleksi induk, sekaligus dapat menyertakan atribut yang spesifik untuk subkelas.
-   **Kueri**: Saat melakukan kueri, Anda dapat memilih untuk mengueri seluruh hierarki pewarisan, hanya koleksi induk, atau koleksi turunan tertentu. Ini memungkinkan data dari berbagai tingkatan diambil dan diproses sesuai kebutuhan.
-   **Hubungan Pewarisan**: Hubungan pewarisan terjalin antara koleksi induk dan koleksi turunan, yang berarti struktur koleksi induk dapat digunakan untuk mendefinisikan atribut yang konsisten, sekaligus memungkinkan koleksi turunan untuk memperluas atau menimpa atribut tersebut.

Pola desain ini membantu mengurangi redundansi data, menyederhanakan model database, dan membuat data lebih mudah dikelola. Namun, perlu digunakan dengan hati-hati karena koleksi yang dapat diwariskan dapat meningkatkan kompleksitas kueri, terutama saat menangani seluruh hierarki pewarisan. Sistem database yang mendukung koleksi yang dapat diwariskan umumnya menyediakan sintaks dan alat khusus untuk mengelola dan mengueri struktur koleksi ini.

## Panduan Pengguna

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)