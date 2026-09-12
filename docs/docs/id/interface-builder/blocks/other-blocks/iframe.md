---
pkg: "@nocobase/plugin-block-iframe"
title: "Block Iframe"
description: "Block Iframe: menyematkan halaman web atau aplikasi eksternal, memuat konten pihak ketiga melalui URL, mendukung tampilan cross-domain."
keywords: "Block Iframe, Iframe, embed halaman web, link eksternal, interface builder, NocoBase"
---
# Block Iframe

## Pengantar

Block IFrame memungkinkan menyematkan halaman web eksternal atau konten ke dalam halaman saat ini. Pengguna dapat dengan mudah mengintegrasikan aplikasi eksternal ke dalam halaman dengan mengkonfigurasi URL atau langsung memasukkan kode HTML. Dengan menggunakan halaman HTML, pengguna dapat mengkustomisasi konten secara fleksibel untuk memenuhi kebutuhan tampilan tertentu. Cara ini sangat cocok untuk skenario yang memerlukan tampilan terkustomisasi, dapat memuat resource eksternal tanpa jump, meningkatkan pengalaman pengguna dan efek interaksi halaman.

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## Sintaks Template

Dalam mode HTML, konten Block mendukung sintaks **[Liquid Template Engine](https://shopify.github.io/liquid/basics/introduction/)**.

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## Mendukung Variabel

### HTML Mendukung Parsing Variabel

- Mendukung pemilihan variabel konteks Block saat ini dari selector variabel
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- Mendukung injeksi variabel ke aplikasi melalui kode dan menggunakannya

Anda juga dapat menginjeksikan variabel kustom ke aplikasi melalui kode dan menggunakannya di HTML. Misalnya, menggunakan Vue 3 dan Element Plus untuk membuat aplikasi kalender dinamis:

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

Contoh: Komponen kalender sederhana yang dibuat menggunakan React dan Ant Design (antd), dikombinasikan dengan dayjs untuk menangani tanggal

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

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

Untuk informasi lebih lanjut tentang variabel, silakan lihat [Variabel](/interface-builder/variables)
