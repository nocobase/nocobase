:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Manajemen Dependensi

Dalam pengembangan **plugin** NocoBase, dependensi dibagi menjadi dua kategori: **dependensi mandiri** dan **dependensi global**.

-   **Dependensi Global**: Disediakan oleh `@nocobase/server` dan `@nocobase/client`. **Plugin** tidak perlu membundelnya secara terpisah.
-   **Dependensi Mandiri**: Dependensi unik **plugin** (termasuk dependensi sisi server) akan dibundel ke dalam artefak **plugin**.

## Prinsip Pengembangan

Karena dependensi mandiri akan dibundel ke dalam artefak **plugin** (termasuk dependensi server yang akan dibundel ke `dist/node_modules`), maka saat mengembangkan **plugin**, Anda dapat mendeklarasikan semua dependensi di `devDependencies` daripada di `dependencies`. Hal ini dapat menghindari perbedaan antara lingkungan pengembangan dan lingkungan produksi.

Ketika sebuah **plugin** perlu menginstal dependensi berikut, pastikan **nomor versi** sesuai dengan dependensi global di `@nocobase/server` dan `@nocobase/client`, jika tidak, dapat menyebabkan konflik saat runtime.

## Dependensi Global

Dependensi berikut disediakan oleh NocoBase dan tidak perlu dibundel dalam **plugin**. Jika memang diperlukan, dependensi tersebut harus sesuai dengan versi framework.

``` js
// nocobase core
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client',
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

// Common utilities
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

## Rekomendasi Pengembangan

1.  **Pertahankan Konsistensi Dependensi**
    Jika Anda perlu menggunakan paket yang sudah ada dalam dependensi global, hindari menginstal versi yang berbeda, dan gunakan langsung dependensi global tersebut.

2.  **Minimalkan Ukuran Bundel**
    Untuk pustaka UI umum (seperti `antd`), pustaka utilitas (seperti `lodash`), driver basis data (seperti `pg`, `mysql2`), Anda harus mengandalkan versi yang disediakan secara global untuk menghindari pembundelan ganda.

3.  **Konsistensi antara Lingkungan Debug dan Produksi**
    Menggunakan `devDependencies` dapat memastikan konsistensi antara pengembangan dan artefak akhir, menghindari perbedaan lingkungan yang disebabkan oleh konfigurasi `dependencies` dan `peerDependencies` yang tidak tepat.