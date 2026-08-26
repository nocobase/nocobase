# Cara Men-deploy NocoBase Lebih Cepat

Banyak teman yang saat men-deploy NocoBase mungkin merasa kecepatan akses kurang ideal. Hal ini biasanya disebabkan oleh pengaruh environment jaringan, konfigurasi server, atau arsitektur deployment. Sebelum mulai memperkenalkan tips optimasi, saya tampilkan terlebih dahulu referensi kecepatan akses NocoBase pada konfigurasi normal, untuk menghindari kekhawatiran yang tidak perlu.

### Referensi Kecepatan Loading Normal NocoBase

Berikut adalah kecepatan loading yang diuji di environment demo NocoBase:

- Memasukkan URL, waktu yang dibutuhkan untuk masuk ke aplikasi pertama kali sekitar 2 detik
- Beralih halaman di dalam aplikasi membutuhkan waktu sekitar 50-300 milidetik

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/886b8e6afd4eea8fd1ff601fdbaecaf0.mp4">
</video>

<video autoplay loop width="100%">
      <source src="https://static-docs.nocobase.com/c240cf4029820f0e4c2bbb58723e2d76.mp4">
</video>

Selanjutnya, saya akan membagikan serangkaian tips optimasi deployment yang sederhana namun efisien. Metode ini tidak memerlukan perubahan kode, hanya perlu menyesuaikan pengaturan deployment, dapat secara signifikan meningkatkan kecepatan akses:

## I. Optimasi Jaringan dan Infrastruktur

### 1. Versi Protokol HTTP: Mudah Beralih ke HTTP/2

【Prasyarat】

- **Membutuhkan dukungan HTTPS**: Hal ini sangat penting! Hampir semua browser modern hanya mendukung HTTP/2 pada koneksi HTTPS, jadi Anda harus mengkonfigurasi sertifikat SSL terlebih dahulu.
- **Persyaratan server**: Anda perlu menggunakan software server yang mendukung HTTP/2, seperti Nginx 1.9.5+ atau Apache 2.4.17+.
- **Versi TLS**: Disarankan menggunakan TLS 1.2 atau lebih tinggi (TLS 1.3 adalah yang terbaik), versi SSL lama tidak mendukung HTTP/2.

【Tips】

Protokol HTTP/1.1 tradisional memiliki batasan saat memproses banyak request — biasanya hanya dapat memproses 6-8 koneksi secara bersamaan, ini seperti antri membeli tiket, mudah menyebabkan delay.
![250409http1](https://static-docs.nocobase.com/250409http1.png)

HTTP/2 menggunakan teknologi "multiplexing", dapat memproses banyak request secara bersamaan, sangat mempercepat loading resource; sedangkan HTTP/3 terbaru tampil lebih baik di jaringan yang tidak stabil, efeknya juga sangat bagus.

![250409http2](https://static-docs.nocobase.com/250409http2.png)

【Saran Optimasi】

- Pastikan web server Anda telah mengaktifkan dukungan HTTP/2. Saat ini sebagian besar server (seperti Nginx, Caddy) sangat mudah dikonfigurasi.
- Di Nginx, hanya perlu menambahkan parameter `http2` setelah perintah listen:

```nginx
listen 443 ssl http2;
```

【Verifikasi】

Panel developer browser, buka opsi "Network", klik kanan dan centang "Protocol", maka dapat melihat versi protokol koneksi saat ini:
![20250407145442](https://static-docs.nocobase.com/20250407145442.png)

Berdasarkan pengujian kami, kecepatan keseluruhan meningkat sekitar 10%. Pada kondisi banyak Block dan resource di sistem, peningkatan performa lebih jelas.

### 2. Bandwidth Jaringan: Lebih Besar Lebih Baik, Penagihan Fleksibel

【Tips】

Sama seperti highway yang lebih lancar dari jalan biasa, bandwidth menentukan efisiensi transmisi data. Saat NocoBase pertama kali dimuat perlu mendownload banyak resource frontend. Jika bandwidth tidak cukup, mudah membentuk bottleneck.

【Saran Optimasi】

- Pilih bandwidth yang cukup (jika banyak Pengguna, direkomendasikan di atas 50M), jangan pelit pada resource kunci ini.
- Direkomendasikan menggunakan cara "penagihan berdasarkan traffic": banyak penyedia cloud menyediakan mode fleksibel ini, di waktu puncak Anda dapat menikmati bandwidth yang lebih tinggi, dan di waktu biasa juga dapat mengontrol biaya.

### 3. Latensi Jaringan dan Lokasi Geografis Server: Jarak Dekat, Reaksi Cepat

【Tips】

Latensi sebenarnya adalah waktu menunggu transmisi data. Bahkan dengan bandwidth yang cukup, jika server terlalu jauh dari Pengguna (misalnya Pengguna di China, server di Amerika), setiap request response dapat melambat karena jarak yang jauh.

【Saran Optimasi】

- Sebisa mungkin men-deploy NocoBase di area yang lebih dekat dengan grup Pengguna utama Anda.
- Jika Pengguna Anda tersebar di seluruh dunia, dapat mempertimbangkan menggunakan layanan akselerasi global (seperti Alibaba Cloud Global Accelerator atau AWS Global Accelerator), untuk mengoptimalkan routing jaringan, mengurangi latensi.

【Verifikasi】

Melalui perintah ping, uji latensi server di area yang berbeda.
Cara ini memberikan peningkatan paling jelas. Berdasarkan area yang berbeda, kecepatan akses meningkat 1-3 kali lipat atau lebih.
Cross 12 zona waktu, 13 detik:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)

Cross 2 zona waktu, 8 detik:
![20250409131039](https://static-docs.nocobase.com/20250409131039.png)

Area saat ini, sekitar 3 detik:
![20250409130928](https://static-docs.nocobase.com/20250409130928.png)

## II. Optimasi Arsitektur Deployment

### 4. Deployment Server-side dan Cara Proxy: Memilih Arsitektur Paling Sesuai

【Prasyarat】

- **Permission server**: Anda perlu memiliki permission root atau sudo untuk mengkonfigurasi Nginx dan layanan lainnya.
- **Skill dasar**: Membutuhkan beberapa pengetahuan konfigurasi server dasar, namun jangan khawatir, di sini akan disediakan contoh konfigurasi spesifik.
- **Akses port**: Pastikan firewall mengizinkan akses port 80 (HTTP) dan port 443 (HTTPS).

【Tips】

Ketika Pengguna mengakses NocoBase, request akan langsung sampai ke server Anda. Cara deployment yang sesuai dapat membuat server lebih efisien dalam memproses request, sehingga memberikan response yang lebih cepat.

【Berbagai Solusi dan Saran】

**Setelah memulai NocoBase, tidak menggunakan reverse proxy untuk static resource (Tidak direkomendasikan):**

- Kekurangan: Cara ini meskipun sederhana, namun performa lemah saat memproses concurrency tinggi atau static file, cocok untuk development dan testing;
- Saran: Sebisa mungkin hindari cara ini.

> Rujuk "[Dokumentasi Instalasi](https://docs.nocobase.com/cn/get-started/quickstart)"

Tanpa reverse proxy, loading homepage sekitar 6.1 detik
![20250409131357](https://static-docs.nocobase.com/20250409131357.png)

**Menggunakan Nginx / Caddy sebagai reverse proxy (Sangat Direkomendasikan):**

- Keunggulan: Reverse proxy server dapat efisien memproses koneksi concurrent, melayani static file, mengimplementasikan load balancing, dan konfigurasi HTTP/2 juga sangat sederhana;
- Saran: Di environment production, setelah aplikasi selesai di-deploy (deploy source code / create-nocobase-app / Docker image), gunakan Nginx atau Caddy sebagai reverse proxy.

> Rujuk "[Dokumentasi Deployment](https://docs.nocobase.com/cn/get-started/deployment/production)"

Setelah menggunakan proxy Nginx, loading homepage sekitar 3-4 detik
![20250409131541](https://static-docs.nocobase.com/20250409131541.png)

![20250407192453](https://static-docs.nocobase.com/20250407192453.png)

**Menggunakan deployment cluster dan load balancing (Cocok untuk skenario concurrency tinggi dan high availability):**

- Keunggulan: Dengan men-deploy banyak instance untuk memproses request, dapat secara signifikan meningkatkan stabilitas dan kemampuan concurrency keseluruhan sistem;
- Cara deployment spesifik lihat **[Mode Cluster](https://docs-cn.nocobase.com/welcome/getting-started/deployment/cluster-mode)**

### 5. Menggunakan CDN untuk Mempercepat Static Resource

【Prasyarat】

- **Persyaratan domain**: Anda perlu memiliki domain yang telah terdaftar, dan dapat mengelola pengaturan DNS-nya.
- **Sertifikat SSL**: Sebagian besar layanan CDN memerlukan konfigurasi sertifikat SSL (dapat menggunakan Let's Encrypt gratis).
- **Pemilihan layanan**: Pilih penyedia CDN yang sesuai dengan area Pengguna (Pengguna China daratan perlu memilih CDN yang memiliki ICP filing).

【Tips】

CDN (Content Delivery Network) men-cache static resource Anda ke node-node di seluruh dunia. Pengguna dapat mendapatkan resource dari node terdekat, seperti mengambil air dari sumber terdekat, dapat sangat mengurangi latensi loading.

Selain itu, keunggulan terbesar CDN adalah dapat **secara signifikan mengurangi beban dan tekanan bandwidth dari aplikasi server**. Ketika banyak Pengguna mengakses NocoBase secara bersamaan, jika tidak ada CDN, semua request static resource (seperti JavaScript, CSS, gambar, dll.) akan langsung mengakses server Anda, mungkin menyebabkan bandwidth server tidak cukup, performa menurun, bahkan crash. Dengan CDN mendistribusikan request-request ini, server Anda dapat fokus memproses logika bisnis inti, untuk memberikan pengalaman yang lebih stabil bagi Pengguna.

![202504071845_cdn](https://static-docs.nocobase.com/202504071845_cdn.png)

【Saran Optimasi】• Konfigurasi server Anda agar request static resource didistribusikan melalui CDN; • Pilih penyedia CDN yang sesuai dengan lokasi Pengguna:

- Pengguna global: Cloudflare, Akamai, AWS CloudFront;
- Pengguna China daratan: Alibaba Cloud CDN, Tencent Cloud CDN, Baidu Cloud Acceleration. Contoh konfigurasi:

```nginx
# Redirect static resource ke domain CDN
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    rewrite ^(.*)$ https://your-cdn-domain.com$1 permanent;
}
```

Untuk proyek kecil, Cloudflare versi gratis juga dapat memberikan efek akselerasi CDN yang lumayan:

1. Daftar akun di Cloudflare dan tambahkan domain Anda;
2. Modifikasi DNS untuk mengarahkan domain ke server yang disediakan Cloudflare;
3. Atur level cache yang sesuai di control panel.

**Tips Khusus**: Bahkan jika grup Pengguna Anda semua di area yang sama, masih sangat direkomendasikan menggunakan CDN, karena dapat secara efektif mengurangi beban server, meningkatkan stabilitas keseluruhan sistem, terutama dalam kondisi traffic akses yang besar.

## III. Optimasi Static Resource

### 6. Konfigurasi Kompresi Server dan Cache

【Prasyarat】

- **Resource CPU**: Kompresi akan menambah beban CPU server, jadi server Anda harus memiliki kemampuan pemrosesan yang cukup.
- **Dukungan modul Nginx**: Kompresi Gzip umumnya didukung secara built-in, namun kompresi Brotli mungkin memerlukan instalasi modul tambahan.
- **Permission konfigurasi**: Perlu memiliki permission untuk memodifikasi konfigurasi server.

【Tips】

Dengan mengaktifkan kompresi dan strategi cache yang wajar, dapat secara signifikan mengurangi jumlah transmisi data dan request berulang, setara dengan melakukan "diet" pada resource Anda, membuat kecepatan loading terbang.
![20250409175241](https://static-docs.nocobase.com/20250409175241.png)

【Saran Optimasi】

- Solusi paling sederhana: Gunakan layanan CDN gratis Cloudflare, dapat secara otomatis mengaktifkan kompresi Gzip.
- Aktifkan kompresi Gzip atau Brotli, di Nginx dapat diatur seperti ini:

```nginx
# Aktifkan kompresi Gzip
gzip on;
gzip_comp_level 6;
gzip_min_length 1000;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Jika mendukung kompresi Brotli, dapat diaktifkan untuk mendapatkan efek kompresi yang lebih efisien
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

• Atur cache header yang sesuai untuk static resource, untuk mengurangi loading berulang:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    access_log off;
}
```

### 7. Menggunakan SSL/TLS dan Mengoptimalkan Performa

【Prasyarat】

- **Sertifikat SSL**: Anda perlu memiliki sertifikat SSL yang valid (dapat menggunakan Let's Encrypt gratis).
- **Permission konfigurasi server**: Perlu dapat memodifikasi konfigurasi SSL.
- **Konfigurasi DNS**: Untuk OCSP Stapling konfigurasikan DNS resolver yang reliable.

【Tips】

Keamanan selalu nomor satu, namun konfigurasi HTTPS jika tidak tepat juga dapat menambah beberapa latensi. Berikut beberapa tips optimasi yang dapat membantu Anda memastikan keamanan sambil mempertahankan performa yang efisien.

【Saran Optimasi】

- Gunakan TLS 1.3, yang merupakan versi TLS tercepat saat ini. Konfigurasi di Nginx:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
```

- Aktifkan OCSP Stapling untuk mengurangi waktu yang dibutuhkan untuk verifikasi sertifikat:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

- Mengurangi waktu handshake berulang melalui session reuse:

```nginx
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

【Efek Optimasi Skenario Lintas Negara】
**Tips Khusus**: Berikut adalah efek optimasi pada skenario cross-country/cross 12 zona waktu, ini berbeda secara fundamental dengan skenario akses lokal (sekitar 3 detik) yang disebutkan sebelumnya. Latensi jaringan yang disebabkan jarak geografis tidak dapat dihindari, tetapi melalui optimasi tetap dapat secara signifikan meningkatkan kecepatan:

Setelah aplikasi gabungan Http2 + Cache CDN + Kompresi Gzip + Kompresi Brotli:
Sebelum optimasi (akses cross-country), 13 detik:
![20250409130618](https://static-docs.nocobase.com/20250409130618.png)
Setelah optimasi (akses cross-country), 8 detik:
![20250409173528](https://static-docs.nocobase.com/20250409173528.png)

Contoh ini menunjukkan, bahkan pada kondisi lokasi geografis yang berjauhan, langkah optimasi yang wajar masih dapat mempersingkat waktu loading sekitar 40%, sangat meningkatkan pengalaman Pengguna.

## IV. Monitoring dan Troubleshooting

### 8. Monitoring Performa dan Analisis Dasar

【Prasyarat】

- **Aksesibilitas**: Website Anda harus dapat diakses publik untuk dapat menggunakan sebagian besar tool testing online.
- **Skill dasar**: Perlu memahami arti dasar metrik performa, namun kami akan menjelaskan setiap metrik kunci.

【Tips】

Jika tidak tahu di mana yang menjadi bottleneck, akan sulit untuk melakukan optimasi secara akurat. Disarankan menggunakan beberapa tool gratis untuk memonitor performa website, untuk membantu semua orang menemukan masalah.

【Saran Optimasi】

**Gunakan tool gratis berikut untuk memeriksa performa website:**

- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Pingdom](https://tools.pingdom.com/)

**Perhatikan metrik kunci berikut:**

- Waktu loading halaman
- Waktu response server
- Waktu DNS resolution
- Waktu SSL handshake

**Penanganan masalah umum:**

- DNS resolution lambat? Pertimbangkan untuk mengganti layanan DNS atau mengaktifkan DNS pre-resolution.
- SSL handshake lambat? Optimalkan konfigurasi SSL, aktifkan session reuse.
- Response server lambat? Periksa resource server, jika perlu lakukan upgrade.
- Static resource loading lambat? Coba implementasikan CDN dan sesuaikan strategi cache.

## Checklist Cepat Optimasi Deployment

Checklist berikut dapat membantu semua orang dengan cepat memeriksa dan mengoptimalkan deployment NocoBase:

1. **Pemeriksaan Versi HTTP**

   - [ ]  HTTPS sudah diaktifkan (prasyarat HTTP/2)
   - [ ]  HTTP/2 sudah diaktifkan
   - [ ]  Jika kondisi memungkinkan, dapat mempertimbangkan dukungan HTTP/3
2. **Penilaian Bandwidth**

   - [ ]  Bandwidth server cukup (direkomendasikan minimal 10Mbps, lebih disukai di atas 50Mbps)
   - [ ]  Dapat menggunakan mode penagihan berdasarkan traffic, bukan bandwidth tetap
3. **Pemilihan Lokasi Server**

   - [ ]  Lokasi server harus dekat dengan area Pengguna
   - [ ]  Untuk Pengguna global, pertimbangkan menggunakan layanan akselerasi global
4. **Arsitektur Deployment**

   - [ ]  Gunakan Nginx/Caddy sebagai reverse proxy, pisahkan static resource dengan API
   - [ ]  Jika diperlukan, gunakan deployment multi-instance dan teknologi load balancing
5. **Implementasi CDN**

   - [ ]  Percepat distribusi static resource melalui CDN
   - [ ]  Konfigurasi strategi cache yang sesuai
   - [ ]  Pastikan CDN mendukung HTTP/2 atau HTTP/3
6. **Kompresi dan Cache**

   - [ ]  Aktifkan kompresi Gzip atau Brotli
   - [ ]  Atur browser cache header yang sesuai
7. **Optimasi SSL/TLS**

   - [ ]  Gunakan TLS 1.3 untuk meningkatkan kecepatan handshake
   - [ ]  Aktifkan OCSP Stapling
   - [ ]  Konfigurasi SSL session reuse
8. **Monitoring Performa**

   - [ ]  Secara rutin gunakan tool testing performa untuk mengevaluasi website
   - [ ]  Monitor metrik kunci (loading, response, resolution, waktu handshake)
   - [ ]  Lakukan penyesuaian optimasi berdasarkan masalah

## Pertanyaan dan Jawaban Umum

【T】Server saya di-deploy di luar negeri, Pengguna China mengakses lambat, bagaimana solusinya?

【J】Solusi terbaik adalah memilih cloud server di area China untuk men-deploy ulang. Jika benar-benar tidak bisa diganti, juga dapat:

1. Gunakan CDN domestik untuk mempercepat static resource;
2. Manfaatkan layanan akselerasi global untuk mengoptimalkan routing jaringan;
3. Aktifkan semua langkah optimasi kompresi dan cache sebanyak mungkin.

【T】Mengapa NocoBase saya pertama kali load lambat, namun setelah itu cepat?

【J】Pertama kali load lambat itu cukup normal, karena pertama kali perlu mendownload banyak resource. Mengambil Demo resmi kami sebagai contoh, biasanya waktu pertama kali load sekitar 3 detik.

Selanjutnya kecepatan memasukkan URL dan masuk ke aplikasi sekitar 1-2 detik, sedangkan kecepatan beralih halaman dalam aplikasi sekitar 50-300 milidetik, latensi sangat rendah.

![20250416130719](https://static-docs.nocobase.com/20250416130719.png)

Untuk kondisi waktu loading yang terlalu lama, masih ada ruang optimasi:

1. Pastikan HTTP/2 sudah diaktifkan;
2. Implementasikan akselerasi CDN;
3. Aktifkan kompresi Gzip/Brotli;
4. Periksa apakah bandwidth server cukup.

【T】Saya saat ini menggunakan virtual host, tidak dapat memodifikasi konfigurasi Nginx, bagaimana?

【J】Pada kondisi ini, meskipun opsi optimasi lebih sedikit, tetap disarankan:

1. Coba gunakan layanan CDN (seperti Cloudflare);
2. Optimalkan parameter dalam aplikasi yang dapat disesuaikan;
3. Jika kondisi memungkinkan, dapat mempertimbangkan upgrade ke VPS yang mendukung lebih banyak konfigurasi custom.

---

Melalui strategi optimasi deployment yang sederhana dan praktis ini, Anda dapat secara signifikan meningkatkan kecepatan akses NocoBase, memberikan pengalaman yang lebih lancar bagi Pengguna. Banyak langkah optimasi hanya perlu beberapa jam untuk menyelesaikan setup, tanpa perlu mengubah kode, dengan mudah dapat melihat hasilnya.
