---
title: "Plugin Dokumentasi API"
description: "Dokumentasi API NocoBase berbasis Swagger: alamat akses, dokumentasi keseluruhan/kernel/Plugin/collections, aturan penulisan swagger, spesifikasi OpenAPI."
keywords: "dokumentasi API,Swagger,OpenAPI,dokumentasi antarmuka,swagger:get,pengembangan plugin,NocoBase"
---

# Dokumentasi API

<PluginInfo name="api-doc"></PluginInfo>

## Pengenalan

Menghasilkan dokumentasi HTTP API NocoBase berbasis Swagger.

## Instalasi

Plugin bawaan, tidak perlu instalasi. Dapat digunakan setelah diaktifkan.

## Petunjuk Penggunaan

### Akses Halaman Dokumentasi API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Ikhtisar Dokumentasi

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Dokumentasi API keseluruhan: `/api/swagger:get`
- Dokumentasi API kernel: `/api/swagger:get?ns=core`
- Dokumentasi API semua Plugin: `/api/swagger:get?ns=plugins`
- Dokumentasi setiap Plugin: `/api/swagger:get?ns=plugins/{name}`
- Dokumentasi API collections kustom pengguna: `/api/swagger:get?ns=collections`
- Sumber daya `${collection}` dan `${collection}.${association}` terkait: `/api/swagger:get?ns=collections/{name}`

## Panduan Pengembangan

### Cara Menulis Dokumentasi swagger untuk Plugin

Tambahkan file `swagger/index.ts` pada folder `src` Plugin, dengan konten sebagai berikut:

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

Untuk aturan penulisan rinci, lihat [Dokumentasi Resmi Swagger](https://swagger.io/docs/specification/about/)
