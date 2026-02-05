---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Dokumentasi API



## Pengantar

Plugin ini menghasilkan dokumentasi API HTTP NocoBase berdasarkan Swagger.

## Instalasi

Ini adalah plugin bawaan, tidak perlu instalasi. Cukup aktifkan untuk menggunakannya.

## Petunjuk Penggunaan

### Mengakses Halaman Dokumentasi API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Ikhtisar Dokumentasi

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Dokumentasi API Total: `/api/swagger:get`
- Dokumentasi API Inti: `/api/swagger:get?ns=core`
- Dokumentasi API Semua plugin: `/api/swagger:get?ns=plugins`
- Dokumentasi Setiap plugin: `/api/swagger:get?ns=plugins/{name}`
- Dokumentasi API untuk koleksi kustom: `/api/swagger:get?ns=collections`
- Sumber daya `${collection}` yang ditentukan dan terkait `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Panduan Pengembang

### Cara Menulis Dokumentasi Swagger untuk Plugin

Tambahkan file `swagger/index.ts` di folder `src` plugin dengan konten sebagai berikut:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Untuk aturan penulisan yang lebih detail, silakan merujuk ke [Dokumentasi Resmi Swagger](https://swagger.io/docs/specification/about/).