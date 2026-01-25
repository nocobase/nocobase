:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Penundaan

## Pendahuluan

Node Penundaan dapat menambahkan penundaan ke dalam alur kerja. Setelah penundaan selesai, alur kerja dapat melanjutkan eksekusi node berikutnya atau menghentikan alur kerja lebih awal, tergantung pada konfigurasi.

Node ini sering digunakan bersama dengan node Cabang Paralel. Node Penundaan dapat ditambahkan ke salah satu cabang untuk menangani pemrosesan setelah batas waktu terlampaui. Contohnya, dalam sebuah cabang paralel, satu cabang berisi pemrosesan manual dan cabang lainnya berisi node Penundaan. Ketika pemrosesan manual melebihi batas waktu, jika diatur untuk *gagal saat batas waktu terlampaui*, ini berarti pemrosesan manual harus diselesaikan dalam waktu yang ditentukan. Jika diatur untuk *lanjut saat batas waktu terlampaui*, ini berarti pemrosesan manual tersebut dapat diabaikan setelah waktu habis.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") pada alur untuk menambahkan node "Penundaan":

![Membuat Node Penundaan](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Konfigurasi Node

![Node Penundaan_Konfigurasi Node](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Waktu Penundaan

Untuk waktu penundaan, Anda dapat memasukkan angka dan memilih satuan waktu. Satuan waktu yang didukung adalah: detik, menit, jam, hari, dan minggu.

### Status Saat Batas Waktu Terlampaui

Untuk status saat batas waktu terlampaui, Anda dapat memilih "Lanjut dan teruskan" atau "Gagal dan keluar". Pilihan pertama berarti setelah penundaan berakhir, alur kerja akan melanjutkan eksekusi node berikutnya. Pilihan kedua berarti setelah penundaan berakhir, alur kerja akan berhenti lebih awal dengan status gagal.

## Contoh

Ambil contoh skenario di mana sebuah tiket kerja (work order) perlu dijawab dalam waktu terbatas setelah diajukan. Kita perlu menambahkan node manual di salah satu dari dua cabang paralel dan node Penundaan di cabang lainnya. Jika pemrosesan manual tidak dijawab dalam waktu 10 menit, status tiket kerja akan diperbarui menjadi "batas waktu terlampaui dan belum diproses".

![Node Penundaan_Contoh_Organisasi Alur](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)