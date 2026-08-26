# Penggunaan Variabel Template Markdown

Teman-teman yang terhormat, selamat datang di tutorial ini! Dalam bagian ini, kita akan mempelajari langkah demi langkah cara memanfaatkan Markdown dan template engine Handlebars untuk merealisasikan tampilan konten dinamis. Sebelumnya pada "Tips Block Markdown", Anda telah memahami sintaks dasar, cara pembuatan, dan pengisian variabel. Selanjutnya mari kita eksplorasi lebih dalam penggunaan lanjutan variabel template.

## 1 Pengantar Template Engine [Handlebars](https://docs-cn.nocobase.com/handbook/template-handlebars)

Setelah Anda membuat Block Markdown, di konfigurasi pojok kanan atas akan terlihat opsi "Template Engine", yang secara default adalah Handlebars. Handlebars dapat membantu Anda menampilkan konten halaman secara dinamis berdasarkan kondisi, sehingga Markdown juga dapat merespons perubahan.

![Ilustrasi Template Engine](https://static-docs.nocobase.com/20250304011925.png)

### 1.1 Peran Handlebars

Meskipun Markdown secara native hanya mendukung tampilan konten statis, melalui Handlebars, Anda dapat mengandalkan kondisi (seperti status, angka, atau opsi) untuk secara dinamis mengganti tampilan teks dan style. Dengan demikian, meskipun menghadapi skenario bisnis yang berubah-ubah, halaman Anda dapat selalu menampilkan informasi yang benar.

## 2 Skenario Aplikasi Praktis

Sekarang, mari kita lihat beberapa skenario praktis, dan implementasikan fungsinya langkah demi langkah.

### 2.1 Memproses Status Order

Dalam Demo online, kita seringkali perlu menampilkan informasi prompt yang berbeda berdasarkan status order. Asumsikan tabel data order Anda memiliki Field status, dengan status sebagai berikut:

![Field Status Order](https://static-docs.nocobase.com/20250304091420.png)

Berikut adalah konten tampilan yang sesuai dengan 4 status:


| Label Opsi       | Nilai Opsi | Konten Tampilan                                              |
| ---------------- | ---------- | ------------------------------------------------------------ |
| Pending Approval | 1          | Order telah disubmit, menunggu review internal.              |
| Pending Payment  | 2          | Menunggu pembayaran Pelanggan. Harap pantau status order dengan cermat. |
| Paid             | 3          | Pembayaran telah dikonfirmasi, harap lakukan pemrosesan selanjutnya. Konsultan yang ditunjuk akan menghubungi Pelanggan dalam 1 jam. |
| Rejected         | 4          | Persetujuan order tidak lulus. Jika diperlukan, harap review dan submit ulang. |

Pada halaman, kita dapat menangkap nilai status order, dan secara dinamis menampilkan informasi yang berbeda. Selanjutnya kita akan menjelaskan secara detail cara menggunakan sintaks if, else, dan else if untuk merealisasikan fungsi ini.

#### 2.1.1 Sintaks if

Menggunakan kondisi if, dapat menampilkan konten yang sesuai dengan kondisi. Contoh:

```
{{#if kondisi}}
  <p>tampilkan hasil</p>
{{/if}}
```

"Kondisi" di sini perlu menggunakan sintaks Handlebars (seperti eq, gt, lt, dll.). Coba contoh sederhana ini:

```
{{#if (eq 1 1)}}
  <p>Tampilkan hasil: 1 = 1</p>
{{/if}}
```

Referensi efek pada gambar berikut:

![Contoh if 1](https://static-docs.nocobase.com/20250305115416.png)
![Contoh if 2](https://static-docs.nocobase.com/20250305115434.png)

#### 2.1.2 Sintaks else

Ketika kondisi tidak terpenuhi, dapat menggunakan else untuk menentukan konten alternatif. Contoh:

```
{{#if (eq 1 2)}}
  <p>Tampilkan hasil: 1 = 2</p>
{{else}}
  <p>Tampilkan hasil: 1 ≠ 2</p>
{{/if}}
```

Efek sebagai berikut:

![Contoh else](https://static-docs.nocobase.com/20250305115524.png)

#### 2.1.3 Penilaian Multi-kondisi

Jika ingin melakukan penilaian berdasarkan beberapa kondisi, dapat menggunakan else if. Contoh kode:

```
{{#if (eq 1 7)}}
  <p>Tampilkan hasil: 1 = 7</p>
{{else if (eq 1 5)}}
  <p>Tampilkan hasil: 1 = 5</p>
{{else if (eq 1 4)}}
  <p>Tampilkan hasil: 1 = 4</p>
{{else}}
  <p>Tampilkan hasil: 1 ≠ 7 ≠ 5 ≠ 3</p>
{{/if}}
```

Gambar efek yang sesuai:

![Contoh penilaian multi-kondisi](https://static-docs.nocobase.com/20250305115719.png)

### 2.2 Tampilan Efek

Setelah konfigurasi status order, halaman akan secara dinamis berganti tampilan berdasarkan status yang berbeda. Lihat gambar di bawah:

![Efek dinamis status order](https://static-docs.nocobase.com/202503040942-handlebar1.gif)

Kode di halaman sebagai berikut:

```
{{#if order.status}}
  <div>
    {{#if (eq order.status "1")}}
      <span style="color: orange;">⏳ Pending Approval</span>
      <p>Order telah disubmit, menunggu review internal.</p>
    {{else if (eq order.status "2")}}
      <span style="color: #1890ff;">💳 Pending Payment</span>
      <p>Menunggu pembayaran Pelanggan. Harap pantau status order dengan cermat.</p>
    {{else if (eq order.status "3")}}
      <span style="color: #52c41a;">✔ Paid</span>
      <p>Pembayaran telah dikonfirmasi, harap lakukan pemrosesan selanjutnya. Konsultan yang ditunjuk akan menghubungi Pelanggan dalam 1 jam.</p>
    {{else if (eq order.status "4")}}
      <span style="color: #f5222d;">✖ Rejected</span>
      <p>Persetujuan order tidak lulus. Jika diperlukan, harap review dan submit ulang.</p>
    {{/if}}
  </div>
{{else}}
  <p class="empty-state">Saat ini tidak ada order yang menunggu pemrosesan.</p>
{{/if}}
```

Coba ganti status order, amati apakah konten halaman ikut update, untuk memverifikasi apakah kode Anda benar.

### 2.3 Menampilkan Detail Order

Selain tampilan status order, detail order (seperti list detail produk) juga merupakan kebutuhan umum. Selanjutnya, kita gunakan sintaks each untuk merealisasikan fungsi ini.

#### 2.3.1 Pengantar Sintaks each

each digunakan untuk loop melalui list. Misalnya, untuk array [1,2,3], Anda dapat menulis seperti ini:

```
{{#each list}}
  <p>Tampilkan hasil: {{this}}</p>
  <p>Index: {{@index}}</p>
{{/each}}
```

Dalam loop, {{this}} mewakili elemen saat ini, {{@index}} mewakili index saat ini.

#### 2.3.2 Contoh Detail Produk

Jika Anda perlu menampilkan semua informasi produk dalam order, Anda dapat menggunakan kode berikut:

```
{{#each $nRecord.order_items}}
    <p>{{@index}}</p>
    <p>{{this.id}}</p>
    <p>{{this.price}}</p>
    <p>{{this.quantity}}</p>
    <p>{{this.product.name}}</p>
---
{{/each}}
```

Jika halaman tidak menampilkan data, harap pastikan Field detail order sudah ditampilkan dengan benar, jika tidak sistem akan menganggap bagian data ini sebagai informasi redundant dan tidak akan melakukan query.
![20250305122543_handlebar_each](https://static-docs.nocobase.com/20250305122543_handlebar_each.gif)

Anda mungkin akan menemukan bahwa nama object produk (product.name) tidak tercetak. Alasannya sama dengan di atas, kita perlu menampilkan object produk juga.
![20250305122543_each2](https://static-docs.nocobase.com/20250305122543_each2.gif)

Setelah ditampilkan, kita atur linkage rule untuk menyembunyikan Field asosiasi ini.
![20250305122543_hidden_each](https://static-docs.nocobase.com/20250305122543_hidden_each.gif)

### 2.4 Hasil Akhir: List Produk Order

Setelah menyelesaikan langkah-langkah di atas, Anda akan mengimplementasikan template tampilan list produk order yang lengkap. Silakan rujuk pada kode berikut:

```
### List Produk Order

{{#if $nRecord.order_items}}
  <div class="cart-summary">Total: {{$nRecord.order_items.length}} produk, total harga: ¥{{$nRecord.total}}</div>
  
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Nama Produk</th>
        <th>Harga Satuan</th>
        <th>Jumlah</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {{#each $nRecord.order_items}}
        <tr style="{{#if this.out_of_stock}}color: red;{{/if}}">
          <td>{{@index}}</td>
          <td>{{this.product.name}}</td>
          <td>¥{{this.price}}</td>
          <td>{{this.quantity}}</td>
          <td>¥{{multiply this.price this.quantity}}</td>
          <td>
            {{#if this.out_of_stock}}
              <span>Stok habis</span>
            {{else if this.low_stock}}
              <span style="color:orange;">Stok menipis</span>
            {{/if}}
          </td>
        </tr>
      {{/each}}
    </tbody>
  </table>
{{else}}
  <p>Order kosong</p>
{{/if}}
```

Setelah dijalankan, Anda akan melihat efek seperti berikut:

![Efek list produk order](https://static-docs.nocobase.com/20250305124125.png)

Untuk lebih baik menampilkan fleksibilitas Handlebars, kita menambahkan Field "stok habis" (out_of_stock) dan "stok menipis" (low_stock) di detail order:

- Ketika out_of_stock adalah true, akan menampilkan "Stok habis", dan item produk berubah menjadi merah.
- Ketika low_stock adalah true, sisi kanan menampilkan prompt "Stok menipis" dengan warna oranye.

![Efek tambahan: stok habis dan stok menipis](https://static-docs.nocobase.com/20250305130258.png)

## 3 Ringkasan dan Saran

Melalui penjelasan di atas, Anda telah mempelajari cara menggunakan Handlebars untuk merealisasikan rendering dinamis template Markdown, termasuk sintaks inti seperti kondisi if/else, loop each, dll. Dalam development nyata, untuk logika yang lebih kompleks, disarankan untuk menggabungkan dengan linkage rule, computed field, workflow, atau node script untuk meningkatkan fleksibilitas dan skalabilitas.

Semoga Anda dapat menguasai keterampilan ini melalui latihan, dan menerapkannya secara fleksibel dalam proyek. Terus semangat, eksplorasi lebih banyak kemungkinan!

---

Jika selama proses pengoperasian menemui masalah apa pun, silakan kunjungi [Komunitas NocoBase](https://forum.nocobase.com) untuk berdiskusi atau merujuk pada [Dokumentasi Resmi](https://docs-cn.nocobase.com). Kami berharap panduan ini dapat membantu Anda merealisasikan review registrasi Pengguna sesuai kebutuhan aktual, dan dapat diperluas secara fleksibel sesuai kebutuhan. Semoga sukses dalam penggunaan, dan proyek Anda berhasil!
