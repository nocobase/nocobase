---
pkg: '@nocobase/plugin-acl'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Gabungan Peran

Gabungan Peran adalah mode manajemen izin. Berdasarkan pengaturan sistem, pengembang sistem dapat memilih untuk menggunakan `Peran Independen`, `Izinkan Gabungan Peran`, atau `Gabungan Peran Saja`, untuk memenuhi kebutuhan izin yang berbeda.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Peran Independen

Secara default, sistem menggunakan peran independen. Pengguna harus beralih di antara peran yang mereka miliki satu per satu.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Izinkan Gabungan Peran

Pengembang sistem dapat mengaktifkan `Izinkan Gabungan Peran`, memungkinkan pengguna untuk secara bersamaan memiliki izin dari semua peran yang ditetapkan, sekaligus tetap mengizinkan pengguna untuk beralih peran secara individual.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Gabungan Peran Saja

Pengguna diwajibkan untuk hanya menggunakan Gabungan Peran dan tidak dapat beralih peran secara individual.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Aturan untuk Gabungan Peran

Gabungan peran memberikan izin maksimum di seluruh peran. Berikut adalah penjelasan tentang bagaimana izin peran ditentukan ketika ada konflik pengaturan pada item yang sama di antara peran-peran.

### Penggabungan Izin Operasi

Contoh:
Peran 1 (role1) dikonfigurasi untuk `Mengizinkan konfigurasi antarmuka` dan Peran 2 (role2) dikonfigurasi untuk `Mengizinkan instalasi, aktivasi, penonaktifan plugin`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Saat masuk dengan peran **Izin Penuh**, pengguna akan memiliki kedua izin tersebut secara bersamaan.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Penggabungan Lingkup Data

#### Baris Data

Skenario 1: Beberapa peran mengatur kondisi pada bidang yang sama

Filter Peran A: Usia < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filter Peran B: Usia > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Setelah digabungkan:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Skenario 2: Peran yang berbeda mengatur kondisi pada bidang yang berbeda

Filter Peran A: Usia < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filter Peran B: Nama mengandung "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Setelah digabungkan:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Kolom Data

Kolom terlihat Peran A: Nama, Usia

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Kolom terlihat Peran B: Nama, Jenis Kelamin

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Setelah digabungkan:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Baris dan Kolom Campuran

Filter Peran A: Usia < 30, kolom Nama, Usia

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Filter Peran B: Nama mengandung "Ja", kolom Nama, Jenis Kelamin

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Setelah digabungkan:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Catatan:** Sel dengan latar belakang merah menunjukkan data yang tidak terlihat di peran individual tetapi terlihat di peran yang digabungkan.

#### Ringkasan

Aturan penggabungan peran untuk lingkup data:

1.  Antara baris, jika salah satu kondisi terpenuhi, baris tersebut memiliki izin.
2.  Antara kolom, bidang-bidang digabungkan.
3.  Ketika baris dan kolom keduanya dikonfigurasi, baris dan kolom digabungkan secara terpisah, bukan berdasarkan kombinasi (baris + kolom) dengan (baris + kolom).