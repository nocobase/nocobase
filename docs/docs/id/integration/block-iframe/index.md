---
title: "Embed Blok Iframe"
description: "Blok Iframe untuk menanam halaman web eksternal atau HTML: konfigurasi URL/HTML, template Handlebars, injeksi variabel, JS Block membuat iframe secara dinamis, contoh Vue/React, pertimbangan keamanan."
keywords: "Blok Iframe,embed halaman web,template Handlebars,injeksi variabel,JS Block,integrasi aplikasi eksternal,NocoBase"
---

# Blok Iframe

<PluginInfo name="block-iframe"></PluginInfo>

## Pengenalan

Blok IFrame memungkinkan Anda menanam halaman web eksternal atau konten ke halaman saat ini. Pengguna dapat dengan mudah mengintegrasikan aplikasi eksternal ke halaman dengan mengkonfigurasi URL atau menyisipkan kode HTML secara langsung. Saat menggunakan halaman HTML, pengguna dapat secara fleksibel menyesuaikan konten untuk memenuhi kebutuhan tampilan tertentu. Cara ini sangat cocok untuk skenario yang membutuhkan tampilan kustomisasi, dapat memuat sumber daya eksternal tanpa navigasi, meningkatkan pengalaman pengguna dan efek interaksi halaman.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Tambahkan Blok

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Konfigurasikan URL atau HTML untuk menanam aplikasi eksternal secara langsung.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Engine Template

### Template String

Engine template default

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Untuk informasi lebih lanjut, lihat dokumentasi engine template Handlebars

## Meneruskan Variabel

### HTML Mendukung Parsing Variabel

#### Mendukung Pemilihan Variabel Konteks Blok Saat Ini dari Pemilih Variabel

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Mendukung Injeksi Variabel ke Aplikasi melalui Kode dan Penggunaannya

Anda juga dapat menginjeksikan variabel kustom ke aplikasi melalui kode dan menggunakannya di HTML. Misalnya, gunakan Vue 3 dan Element Plus untuk membuat aplikasi kalender dinamis:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

Contoh: komponen kalender sederhana yang dibuat dengan React dan Ant Design (antd), dikombinasikan dengan dayjs untuk menangani tanggal

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### URL Mendukung Variabel

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Untuk informasi lebih lanjut tentang variabel, lihat dokumentasi variabel

## Membuat Iframe dengan JS Block (NocoBase 2.0)

Pada NocoBase 2.0, Anda dapat menggunakan JS Block untuk membuat iframe secara dinamis, sehingga mendapatkan kontrol yang lebih banyak. Pendekatan ini memberikan fleksibilitas yang lebih baik untuk menyesuaikan perilaku dan gaya iframe.

### Contoh Dasar

Buat JS Block dan gunakan kode berikut untuk membuat iframe:

```javascript
// Buat iframe yang mengisi container blok saat ini
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Ganti elemen anak yang ada, sehingga iframe menjadi konten satu-satunya
ctx.element.replaceChildren(iframe);
```

### Poin Penting

- **ctx.element**: elemen DOM container JS Block saat ini
- **Atribut sandbox**: mengontrol batasan keamanan konten iframe
  - `allow-scripts`: memungkinkan iframe mengeksekusi skrip
  - `allow-same-origin`: memungkinkan iframe mengakses asalnya sendiri
- **replaceChildren()**: mengganti semua elemen anak container dengan iframe

### Contoh Lanjutan dengan Status Loading

Anda dapat meningkatkan pembuatan iframe dengan status loading dan penanganan error:

```javascript
// Tampilkan tip loading
ctx.message.loading('Memuat konten eksternal...');

try {
  // Buat iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Tambahkan listener event load
  iframe.addEventListener('load', () => {
    ctx.message.success('Konten berhasil dimuat');
  });

  // Tambahkan listener event error
  iframe.addEventListener('error', () => {
    ctx.message.error('Gagal memuat konten');
  });

  // Sisipkan iframe ke container
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Error membuat iframe: ' + error.message);
}
```

### Pertimbangan Keamanan

Saat menggunakan iframe, pertimbangkan praktik terbaik keamanan berikut:

1. **Gunakan HTTPS**: jika memungkinkan, selalu muat konten iframe melalui HTTPS
2. **Batasi izin Sandbox**: aktifkan hanya izin sandbox yang diperlukan
3. **Kebijakan Keamanan Konten**: konfigurasikan header CSP yang sesuai
4. **Kebijakan Same-origin**: perhatikan batasan cross-origin
5. **Sumber tepercaya**: muat konten hanya dari domain tepercaya
