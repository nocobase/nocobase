---
title: "Node Workflow - Kondisi"
description: "Node kondisi: mirip statement if, menentukan arah alur berdasarkan hasil kondisi, mendukung mode 'Ya' lanjutkan / 'Ya' 'Tidak' lanjutkan terpisah."
keywords: "Workflow,kondisi,Condition,cabang alur,if,NocoBase"
---

# Kondisi

## Pengantar

Mirip dengan statement `if` dalam bahasa pemrograman, menentukan arah alur selanjutnya berdasarkan hasil penilaian kondisi yang dikonfigurasi.

## Membuat Node

Penilaian kondisi memiliki dua mode, yaitu "'Ya' lanjutkan" dan "'Ya' dan 'Tidak' lanjutkan terpisah". Saat membuat Node perlu memilih salah satu mode, setelah itu pada konfigurasi Node tidak dapat dimodifikasi.

![Penilaian kondisi_pemilihan mode](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

Pada mode "'Ya' lanjutkan", ketika hasil penilaian kondisi adalah "Ya", alur akan melanjutkan eksekusi Node berikutnya, jika tidak alur akan dihentikan, dan keluar lebih awal dengan status gagal.

!["Ya" lanjutkan mode](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Mode ini cocok untuk skenario di mana alur tidak dilanjutkan jika kondisi tidak terpenuhi, misalnya tombol kirim formulir yang terikat "Event Sebelum Action" mengirimkan pesanan, namun ketika stok produk pesanan yang sesuai tidak mencukupi, tidak melanjutkan pembuatan pesanan, melainkan keluar dengan gagal.

Pada mode "'Ya' dan 'Tidak' lanjutkan terpisah", setelah Node kondisi akan menghasilkan dua alur cabang, masing-masing sesuai dengan alur saat hasil penilaian kondisi adalah "Ya" dan "Tidak". Kedua alur cabang dapat dikonfigurasi Node selanjutnya secara terpisah, setelah cabang manapun selesai dieksekusi, akan otomatis bergabung kembali ke cabang induk Node kondisi, melanjutkan eksekusi Node setelahnya.

!["Ya" dan "Tidak" lanjutkan terpisah mode](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Mode ini cocok untuk skenario di mana ketika kondisi terpenuhi dan tidak terpenuhi, alur perlu mengeksekusi operasi yang berbeda, misalnya kueri apakah suatu data ada, jika tidak ada tambah, jika ada perbarui.

## Konfigurasi Node

### Engine Komputasi

Saat ini mendukung tiga engine:

- **Dasar**: melalui komputasi binary sederhana dan grup "AND", "OR", mendapatkan hasil logika.
- **Math.js**: menghitung ekspresi yang didukung engine [Math.js](https://mathjs.org/) untuk mendapatkan hasil logika.
- **Formula.js**: menghitung ekspresi yang didukung engine [Formula.js](https://formulajs.info/) untuk mendapatkan hasil logika.

Pada ketiga komputasi dapat menggunakan variabel konteks alur sebagai parameter.
