---
title: "Manajemen Dependensi Plugin"
description: "Dependensi plugin NocoBase: package.json, peerDependencies, versi paket @nocobase, deklarasi dependensi antar plugin."
keywords: "manajemen dependensi,peerDependencies,package.json,dependensi plugin,NocoBase"
---

# Manajemen Dependensi

Dalam pengembangan plugin NocoBase, dependensi dibagi menjadi dua kategori: **dependensi sendiri** dan **dependensi global**.

- **Dependensi global**: Disediakan oleh `@nocobase/server` dan `@nocobase/client-v2`, tidak perlu di-package secara terpisah dalam plugin.
- **Dependensi sendiri**: Dependensi yang khusus dimiliki plugin (termasuk dependensi server), akan di-package ke dalam hasil produksi plugin.

## Prinsip Pengembangan

Karena dependensi sendiri akan di-package ke dalam hasil produksi plugin (dependensi server akan di-package ke `dist/node_modules`), Anda dapat mendeklarasikan semua dependensi di `devDependencies` daripada `dependencies`. Cara ini menghindari perbedaan antara environment development dengan production.

Ketika plugin perlu menggunakan dependensi berikut, pastikan **nomor versi** sama dengan dependensi global di `@nocobase/server` dan `@nocobase/client-v2`, jika tidak dapat menyebabkan konflik runtime.

## Dependensi Global

Dependensi berikut disediakan oleh NocoBase, tidak perlu di-package dalam plugin. Jika memang perlu digunakan, harus menjaga konsistensi dengan versi NocoBase.

``` js
// nocobase core
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client-v2',
'@nocobase/database',
'@nocobase/evaluators',
'@nocobase/logger',
'@nocobase/resourcer',
'@nocobase/sdk',
'@nocobase/server',
'@nocobase/test',
'@nocobase/utils',

// @nocobase/auth
'jsonwebtoken',

// @nocobase/cache
'cache-manager',
'cache-manager-fs-hash',

// @nocobase/database
'sequelize',
'umzug',
'async-mutex',

// @nocobase/evaluators
'@formulajs/formulajs',
'mathjs',

// @nocobase/logger
'winston',
'winston-daily-rotate-file',

// koa ecosystem
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React ecosystem
'react',
'react-dom',
'react/jsx-runtime',

// React Router
'react-router',
'react-router-dom',

// Ant Design
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18n
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// Utility umum
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash',
```

## Saran Pengembangan

1.  **Menjaga Konsistensi Dependensi**\
    Jika dependensi global sudah memiliki suatu paket, gunakan versi global secara langsung, jangan menginstal versi yang berbeda.

2.  **Meminimalkan Ukuran Package**\
    Library UI yang umum (seperti `antd`), library utility (seperti `lodash`), driver database (seperti `pg`, `mysql2`), semuanya harus menggunakan versi yang disediakan secara global, untuk menghindari packaging berulang.

3.  **Konsistensi Debug dan Production**\
    Menggunakan `devDependencies` cukup untuk memastikan konsistensi antara development dan hasil akhir, menghindari perbedaan environment akibat konfigurasi `dependencies` dan `peerDependencies` yang tidak tepat.

## Tautan Terkait

- [Build & Packaging](./build.md) — Konfigurasi build dan packaging plugin
- [Struktur Direktori Proyek](./project-structure.md) — Cara organisasi file plugin
- [Menulis Plugin Pertama](./write-your-first-plugin.md) — Membuat plugin dari nol
- [Ikhtisar Plugin Development](./index.md) — Pengantar menyeluruh tentang plugin development
