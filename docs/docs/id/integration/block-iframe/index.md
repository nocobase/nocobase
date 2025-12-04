---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Blok Iframe

## Pendahuluan

Blok Iframe memungkinkan Anda menyematkan halaman web atau konten eksternal ke dalam halaman saat ini. Pengguna dapat dengan mudah mengintegrasikan aplikasi eksternal ke halaman dengan mengonfigurasi URL atau langsung menyisipkan kode HTML. Saat menggunakan halaman HTML, pengguna dapat dengan fleksibel menyesuaikan konten untuk memenuhi kebutuhan tampilan tertentu. Pendekatan ini sangat cocok untuk skenario yang memerlukan tampilan kustomisasi, memungkinkan pemuatan sumber daya eksternal tanpa pengalihan, sehingga meningkatkan pengalaman pengguna dan interaktivitas halaman.

## Instalasi

Ini adalah plugin bawaan, tidak perlu instalasi.

## Menambahkan Blok

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Konfigurasi URL atau HTML untuk langsung menyematkan aplikasi eksternal.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Mesin Template

### Template String

Mesin template bawaan.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Untuk informasi lebih lanjut, lihat dokumentasi mesin template Handlebars.

## Meneruskan Variabel

### Dukungan HTML untuk Parsing Variabel

#### Dukungan untuk Memilih Variabel dari Pemilih Variabel dalam Konteks Blok Saat Ini

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Dukungan untuk Menginjeksikan Variabel ke dalam Aplikasi dan Menggunakannya melalui Kode

Anda juga dapat menginjeksikan variabel kustom ke dalam aplikasi melalui kode dan menggunakannya dalam HTML. Contohnya, membuat aplikasi kalender dinamis menggunakan Vue 3 dan Element Plus:

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

Contoh: Komponen kalender sederhana yang dibuat dengan React dan Ant Design (antd), menggunakan dayjs untuk menangani tanggal.

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

### URL mendukung variabel

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Untuk informasi lebih lanjut tentang variabel, lihat dokumentasi variabel.

## Membuat Iframe dengan Blok JS (NocoBase 2.0)

Di NocoBase 2.0, Anda dapat menggunakan blok JS untuk membuat iframe secara dinamis dengan kontrol yang lebih besar. Pendekatan ini memberikan fleksibilitas yang lebih baik untuk menyesuaikan perilaku dan gaya iframe.

### Contoh Dasar

Buat blok JS dan gunakan kode berikut untuk membuat iframe:

```javascript
// Membuat iframe yang mengisi kontainer blok saat ini
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Mengganti elemen anak yang ada agar iframe menjadi satu-satunya konten
ctx.element.replaceChildren(iframe);
```

### Poin Penting

- **ctx.element**: Elemen DOM dari kontainer blok JS saat ini.
- **Atribut sandbox**: Mengontrol batasan keamanan untuk konten iframe.
  - `allow-scripts`: Mengizinkan iframe untuk mengeksekusi skrip.
  - `allow-same-origin`: Mengizinkan iframe untuk mengakses sumber asalnya sendiri.
- **replaceChildren()**: Mengganti semua elemen anak dari kontainer dengan iframe.

### Contoh Lanjutan dengan Status Pemuatan

Anda dapat meningkatkan pembuatan iframe dengan status pemuatan dan penanganan kesalahan:

```javascript
// Menampilkan pesan pemuatan
ctx.message.loading('Sedang memuat konten eksternal...');

try {
  // Membuat iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Menambahkan event listener untuk pemuatan
  iframe.addEventListener('load', () => {
    ctx.message.success('Konten berhasil dimuat');
  });

  // Menambahkan event listener untuk kesalahan
  iframe.addEventListener('error', () => {
    ctx.message.error('Gagal memuat konten');
  });

  // Menyisipkan iframe ke dalam kontainer
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Terjadi kesalahan saat membuat iframe: ' + error.message);
}
```

### Pertimbangan Keamanan

Saat menggunakan iframe, pertimbangkan praktik terbaik keamanan berikut:

1. **Gunakan HTTPS**: Selalu muat konten iframe melalui HTTPS jika memungkinkan.
2. **Batasi Izin Sandbox**: Hanya aktifkan izin sandbox yang diperlukan.
3. **Kebijakan Keamanan Konten (CSP)**: Konfigurasikan header CSP yang sesuai.
4. **Kebijakan Asal yang Sama (Same-Origin Policy)**: Perhatikan batasan lintas-asal.
5. **Sumber Tepercaya**: Hanya muat konten dari domain tepercaya.