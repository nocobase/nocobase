# Tips Block Markdown

Block Markdown adalah salah satu Block yang paling sering kami gunakan dan sangat powerful. Dari prompt teks ringan hingga gaya HTML sederhana, bahkan dapat menangani logika bisnis penting. Fungsinya beragam dan fleksibel.

## I. Fungsi Dasar Block Markdown

Karena Block Markdown memiliki karakteristik fleksibel, terbuka, dan dapat diubah kapan saja, ini sering digunakan untuk menampilkan pengumuman sistem. Baik itu modul bisnis, fitur, Block, atau Field, kita dapat menempelkan tips kecil yang kita inginkan kapan saja seperti sticky note kecil.

Sebelum menggunakan Block Markdown, disarankan untuk membiasakan diri dengan tata letak dan sintaks Markdown terlebih dahulu. Anda dapat merujuk pada [Contoh Vditor](https://docs.nocobase.com/api/field/markdown-vditor).

> Perhatian: Block Markdown di halaman relatif ringan. Beberapa fitur (seperti formula matematika, mind map, dll.) saat ini tidak didukung untuk rendering. Namun kita dapat mengimplementasikannya menggunakan HTML, dan sistem juga menyediakan komponen Field Vditor. Selamat mencoba.

### 1.1 Contoh Halaman

Kita dapat mengamati penggunaan Markdown pada halaman "Demo Online" sistem. Secara spesifik dapat melihat halaman utama, halaman pesanan, dan "Contoh Lainnya".

Misalnya peringatan dan tips di halaman utama kita:
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

Logika perhitungan modul pesanan:
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

Panduan dan gambar di "Contoh Lainnya":
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

Dengan beralih ke mode edit, kita dapat mengubah konten Markdown kapan saja dan mengamati perubahan halaman.
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Membuat Block Markdown

Pada halaman, popup, dan form, kita semua dapat membuat Block Markdown secara fleksibel.

#### Cara Pembuatan

- **Membuat di popup/halaman:**

  ![Block Markdown di popup/halaman](https://static-docs.nocobase.com/20250227091156.png)
- **Membuat di Block form:**

  ![Block Markdown di form](https://static-docs.nocobase.com/20250227091309.png)

#### Contoh Penggunaan

Dengan input `---` melalui sintaks Markdown, dapat mensimulasikan garis horizontal grup, sehingga merealisasikan efek pemisahan konten sederhana, seperti yang ditunjukkan di bawah ini:

![Contoh Pemisah 1](https://static-docs.nocobase.com/20250227092156.png)
![Contoh Pemisah 2](https://static-docs.nocobase.com/20250227092236.png)

---

## II. Tampilan Konten yang Dipersonalisasi

Keunggulan lain dari Block Markdown adalah mendukung pengisian variabel sistem, membantu menghasilkan judul dan informasi prompt yang dipersonalisasi, untuk memastikan setiap Pengguna dapat melihat tampilan informasi unik di form mereka masing-masing.

![Tampilan Personalisasi 1](https://static-docs.nocobase.com/20250227092400.png)
![Tampilan Personalisasi 2](https://static-docs.nocobase.com/20250227092430.png)

Selain itu, juga dapat dikombinasikan dengan data form untuk tata letak konten sederhana, seperti contoh di bawah ini:

**Contoh Highlight Judul:**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![Efek Highlight Judul](https://static-docs.nocobase.com/20250227164055.png)

**Contoh Pemisah Tengah:**

![Efek Field Tengah](https://static-docs.nocobase.com/20250227164456.png)

## III. Mengisi Konten yang Lebih Kaya

Sambil semakin terbiasa dengan sintaks Markdown dan variabel, kita juga dapat mengisi konten yang lebih kaya di Block Markdown, misalnya HTML!

### 3.1 Contoh HTML

Jika Anda belum pernah menyentuh sintaks HTML, Anda dapat meminta Deepseek menulis untuk kita (perhatikan tag `script` tidak didukung. Disarankan untuk menulis semua style di dalam `div` lokal).

Berikut adalah contoh pengumuman yang indah:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 Contoh Efek Animasi

Kita bahkan dapat mengkombinasikan dengan CSS untuk merealisasikan efek animasi sederhana, mirip tampilan dinamis dan penyembunyian slide (coba paste kode berikut ke dalam Markdown!):

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)
