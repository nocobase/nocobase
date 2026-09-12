# Bab 2: Mendesain Sistem Manajemen Tugas

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113593597037138&bvid=BV1oCi2YdEAU&cid=27174896249&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Mendesain sistem manajemen tugas mungkin terdengar rumit, tetapi dengan bantuan NocoBase, proses ini akan menjadi mudah dan menyenangkan. Kita akan bersama-sama secara bertahap menyusun kebutuhan, mendesain struktur data, dan merencanakan fitur masa depan. Tenang, kita tidak akan terjebak dalam tumpukan kode yang membuat kepala pusing, melainkan menggunakan cara yang paling intuitif dan sederhana untuk membangun sistem manajemen tugas Anda sendiri.

### 2.1 Analisis Kebutuhan Sistem

Sebelum mulai, mari kita perjelas dulu fitur apa saja yang harus dimiliki sistem manajemen tugas ini. Bayangkan bagaimana kita biasanya mengelola tugas, atau apa yang harus dapat dilakukan oleh sistem manajemen tugas ideal Anda:

- **Manajemen Tugas**: Pengguna dapat membuat, edit, hapus tugas, menugaskan tugas kepada orang yang berbeda, dan dapat melacak progres tugas kapan saja.
- **Beralih Beberapa View**: Tugas tidak hanya dapat ditampilkan dalam bentuk list, tetapi juga dapat ditampilkan secara intuitif dengan kanban, gantt chart, atau view kalender.
- **Dokumen Online**: Harus dapat mengedit dokumen tugas online, membantu anggota tim memahami detail tugas.
- **Manajemen Lampiran**: Dapat menambahkan lampiran ke tugas, upload gambar, video, catatan penting, dan konten lainnya.
- **Fitur Komentar**: Personel terkait tugas dapat mengomentari tugas, berbagi opini, mencatat proses diskusi.

Selanjutnya, mari kita gunakan flowchart sederhana untuk menyusun hubungan antara modul-modul fitur ini:
![](https://static-docs.nocobase.com/20241219-0-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER.drawio.svg)

Bukankah jadi langsung jelas?

---

> **Pengenalan Tabel Data:** NocoBase menggunakan definisi yang disebut "Collection" untuk mendeskripsikan struktur data, dengan demikian dapat menyatukan data dari berbagai sumber, memberikan dasar yang kuat untuk manajemen dan analisis data.
>
> Mendukung pembuatan berbagai tipe tabel data, termasuk tabel biasa, tabel pewarisan, tabel pohon, tabel kalender, tabel file, tabel ekspresi, tabel SQL, tabel view, dan tabel eksternal, untuk beradaptasi dengan berbagai kebutuhan pemrosesan data. Desain seperti ini membuat operasi data lebih fleksibel dan efisien.

### 2.2 Desain Tabel Data

Baiklah, selanjutnya kita perlu sedikit berpikir. Untuk mendukung fitur-fitur ini, kita perlu merencanakan tabel data dalam sistem. Jangan khawatir, kita tidak membutuhkan struktur database yang rumit, hanya beberapa tabel sederhana saja sudah cukup.

Berdasarkan kebutuhan yang baru saja kita analisis, biasanya akan didesain beberapa tabel data berikut:

1. **Tabel Pengguna (Users)**: Mencatat informasi pengguna dalam sistem, siapa yang mengerjakan tugas? Siapa yang bertanggung jawab mengelola?
2. **Tabel Tugas (Tasks)**: Mencatat informasi detail setiap tugas, termasuk nama tugas, dokumen, penanggung jawab, dan status progres.
3. **Tabel Lampiran (Attachments)**: Mencatat semua lampiran terkait tugas, seperti gambar, file, dll.
4. **Tabel Komentar (Comments)**: Mencatat komentar pengguna pada tugas, memudahkan interaksi anggota tim.

Hubungan antara tabel-tabel ini sangat sederhana: setiap tugas dapat memiliki beberapa lampiran dan komentar, semua lampiran dan komentar dibuat atau diupload oleh pengguna tertentu. Inilah yang membentuk struktur inti sistem manajemen tugas kita.

Lihat gambar di bawah, ini menunjukkan hubungan dasar antar tabel:
![](https://static-docs.nocobase.com/%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER241219-0.drawio.svg)

### 2.3 Desain Tabel di Sistem NocoBase

Jadi, untuk mengimplementasikan sistem manajemen tugas ini menggunakan NocoBase, tabel apa saja yang sebenarnya perlu kita desain? Ternyata lebih sederhana dari yang Anda bayangkan:

- **Tabel Tugas**: Ini adalah inti seluruh sistem, digunakan untuk menyimpan informasi detail setiap tugas.
- **Tabel Komentar**: Digunakan untuk menyimpan komentar tugas, sehingga anggota tim dapat memberikan feedback pada tugas.

Fitur kompleks lainnya, seperti manajemen lampiran, informasi pengguna, dll., NocoBase sudah menyediakan untuk Anda, tidak perlu dibuat secara manual. Bukankah jauh lebih mudah?

Kita akan mulai dari sistem manajemen data tugas sederhana, secara bertahap memperluas fitur. Contohnya, desain field informasi dasar tugas terlebih dahulu, lalu menambahkan fitur komentar kemudian, seluruh proses fleksibel dan terkontrol.

Struktur tabel keseluruhan kira-kira seperti ini, berisi field yang kita butuhkan:
![](https://static-docs.nocobase.com/241219-1.svg)

### Ringkasan

Melalui pembelajaran bagian ini, Anda telah memahami bagaimana mendesain sistem manajemen tugas dasar. Di NocoBase, kita memulai dari analisis kebutuhan, merencanakan struktur tabel data dan field. Selanjutnya, Anda akan menemukan bahwa mengimplementasikan fitur-fitur ini lebih sederhana daripada mendesainnya.

Contohnya, awal tabel tugas akan sangat ringkas, seperti ini:

```text
Tabel Tugas (Tasks):
        Nama Tugas (task_name) Teks Satu Baris
        Deskripsi Tugas (task_description) Teks Multi Baris
```

Bukankah sangat intuitif? Siap menyambut [bab berikutnya (Bab 3: Manajemen Data Tugas — Strategi Cermat, Mulai dengan Mudah)](https://www.nocobase.com/cn/tutorials/task-tutorial-data-management-guide)?

---

Lanjutkan menjelajah, ciptakan kemungkinan tak terbatas! Jika Anda mengalami masalah saat operasi, jangan lupa Anda dapat mengakses [Dokumentasi Resmi NocoBase](https://docs-cn.nocobase.com/) atau bergabung dengan [Komunitas NocoBase](https://forum.nocobase.com/) untuk mendapatkan bantuan kapan saja. Sampai jumpa di bab berikutnya!
