---
pkg: '@nocobase/plugin-acl'
title: "Gabungan Role"
description: "Gabungan role NocoBase: tiga mode izin yaitu role independen, izinkan gabungan role, dan hanya gabungan role, strategi penggabungan izin multi-role."
keywords: "gabungan role,role independen,penggabungan izin,multi-role,ACL,NocoBase"
---

# Gabungan Role

Gabungan role adalah mode manajemen izin. Berdasarkan pengaturan sistem, developer sistem dapat memilih untuk menggunakan role independen, mengizinkan gabungan role, atau hanya menggunakan gabungan role, untuk memenuhi kebutuhan izin yang berbeda.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Role Independen

Sistem secara default menggunakan role independen: tidak menggunakan gabungan role, pengguna perlu beralih satu per satu antara role yang dimilikinya.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Izinkan Gabungan Role

Mengizinkan developer sistem menggunakan gabungan role, yaitu dapat menggunakan izin dari semua role yang dimiliki secara bersamaan, sambil juga mengizinkan pengguna untuk beralih satu per satu antara role-rolenya.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Hanya Gabungan Role

Memaksa pengguna untuk hanya dapat menggunakan gabungan role, tidak dapat beralih role satu per satu.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Aturan Gabungan Role

Gabungan role memberi pengguna izin maksimum dari semua role. Penjelasan berikut menjelaskan bagaimana izin role ditentukan ketika pengaturan role yang sama bertentangan.

### Penggabungan Izin Operasi

Contoh: Role 1 (role1) dikonfigurasi dengan izin antarmuka, Role 2 (role2) dikonfigurasi dengan izin instalasi, aktivasi, dan menonaktifkan plugin.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Login dengan role **All Permissions**, akan memiliki kedua izin tersebut secara bersamaan.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Penggabungan Data Scope

#### Baris Data

Skenario 1: Multi-role mengatur kondisi pada field yang sama

Role A, kondisi konfigurasi: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, kondisi konfigurasi: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Setelah digabungkan:

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Skenario 2: Role yang berbeda mengatur field yang berbeda sebagai kondisi

Role A, kondisi konfigurasi: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, kondisi konfigurasi: Name mengandung "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

Setelah digabungkan:

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Kolom Data

Role A, field terlihat yang dikonfigurasi: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, field terlihat yang dikonfigurasi: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

Setelah digabungkan:

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Campuran Baris dan Kolom

Role A, kondisi konfigurasi Age < 30, field terlihat Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, kondisi konfigurasi Name mengandung "Ja", field terlihat Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

Setelah digabungkan:

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Keterangan: Data yang ditandai sebagian tidak terlihat di role yang berbeda, tetapi terlihat pada role gabungan**

#### Ringkasan

Aturan gabungan role pada data scope:

1. Antar baris, jika salah satu kondisi terpenuhi maka memiliki izin
2. Antar kolom, field saling ditambahkan
3. Saat baris dan kolom diatur secara bersamaan, digabungkan secara terpisah baris-baris dan kolom-kolom, bukan digabungkan dengan kombinasi (baris+kolom) dan (baris+kolom)
