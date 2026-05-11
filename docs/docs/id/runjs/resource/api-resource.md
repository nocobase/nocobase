---
title: "RunJS APIResource"
description: "RunJS APIResource adalah resource umum untuk melakukan HTTP request berdasarkan URL, cocok untuk API kustom, API pihak ketiga, setURL, refresh, getData, mewarisi FlowResource."
keywords: "APIResource,ctx.makeResource,setURL,FlowResource,API kustom,RunJS,NocoBase"
---

# APIResource

**API resource umum** yang melakukan request berdasarkan URL, cocok untuk semua HTTP API. Mewarisi base class FlowResource, dan meng-extend konfigurasi request dan `refresh()`. Berbeda dengan [MultiRecordResource](./multi-record-resource.md), [SingleRecordResource](./single-record-resource.md), APIResource tidak bergantung pada nama resource, langsung melakukan request berdasarkan URL, cocok untuk skenario seperti API kustom, API pihak ketiga.

**Cara Pembuatan**: `ctx.makeResource('APIResource')` atau `ctx.initResource('APIResource')`. Sebelum digunakan perlu menyetel `setURL()`; dalam konteks RunJS akan otomatis menyuntikkan `ctx.api` (APIClient), tidak perlu `setAPIClient` manual.

---

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **API Kustom** | Memanggil API resource non-standar (seperti `/api/custom/stats`, `/api/reports/summary`) |
| **API Pihak Ketiga** | Request layanan eksternal melalui URL lengkap (target perlu mendukung CORS) |
| **Query Sekali Pakai** | Mengambil data sementara, dibuang setelah digunakan, tidak perlu mengikat ke `ctx.resource` |
| **Pemilihan dengan ctx.request** | Saat memerlukan data reaktif, event, status error gunakan APIResource; request sekali pakai sederhana dapat menggunakan `ctx.request()` |

---

## Kemampuan Base Class (FlowResource)

Semua Resource memiliki:

| Method | Deskripsi |
|------|------|
| `getData()` | Mendapatkan data saat ini |
| `setData(value)` | Menyetel data (hanya lokal) |
| `hasData()` | Apakah ada data |
| `getMeta(key?)` / `setMeta(meta)` | Membaca/menulis metadata |
| `getError()` / `setError(err)` / `clearError()` | Status error |
| `on(event, callback)` / `once` / `off` / `emit` | Subscribe dan memicu event |

---

## Konfigurasi Request

| Method | Deskripsi |
|------|------|
| `setAPIClient(api)` | Menyetel instance APIClient (di RunJS biasanya otomatis disuntikkan oleh konteks) |
| `getURL()` / `setURL(url)` | URL request |
| `loading` | Membaca/menulis status loading (get/set) |
| `clearRequestParameters()` | Menghapus parameter request |
| `setRequestParameters(params)` | Merge dan menyetel parameter request |
| `setRequestMethod(method)` | Menyetel method request (seperti `'get'`, `'post'`, default `'get'`) |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Request header |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Tambah/hapus/cari parameter tunggal |
| `setRequestBody(data)` | Request body (digunakan saat POST/PUT/PATCH) |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Opsi request umum |

---

## Format URL

- **Gaya resource**: mendukung bentuk singkat resource NocoBase, seperti `users:list`, `posts:get`, akan digabungkan dengan baseURL
- **Path relatif**: seperti `/api/custom/endpoint`, digabungkan dengan baseURL aplikasi
- **URL lengkap**: gunakan alamat lengkap saat cross-domain, target perlu mengkonfigurasi CORS

---

## Pengambilan Data

| Method | Deskripsi |
|------|------|
| `refresh()` | Melakukan request berdasarkan URL, method, params, headers, data saat ini, menulis response `data` ke `setData(data)` dan memicu event `'refresh'`. Saat gagal menyetel `setError(err)` dan melempar `ResourceError`, tidak memicu event `refresh`. Perlu sudah menyetel `api` dan URL. |

---

## Contoh

### GET Request Dasar

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL Gaya Resource

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### POST Request (dengan Request Body)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'Test', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Memantau Event refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statistik: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Error Handling

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Request gagal');
}
```

### Custom Request Header

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Hal yang Perlu Diperhatikan

- **Ketergantungan ctx.api**: di RunJS `ctx.api` disuntikkan oleh runtime environment, biasanya tidak perlu `setAPIClient` manual; jika digunakan pada skenario tanpa konteks, perlu menyetelnya sendiri.
- **refresh adalah request**: `refresh()` akan melakukan satu request berdasarkan konfigurasi saat ini, method, params, data, dll. perlu dikonfigurasi sebelum dipanggil.
- **Error tidak update data**: saat request gagal `getData()` mempertahankan nilai asli, dapat melalui `getError()` mendapatkan informasi error.
- **Dengan ctx.request**: request sekali pakai sederhana dapat menggunakan `ctx.request()`; saat memerlukan data reaktif, event, manajemen status error gunakan APIResource.

---

## Terkait

- [ctx.resource](../context/resource.md) - Instance resource dalam konteks saat ini
- [ctx.initResource()](../context/init-resource.md) - Inisialisasi dan mengikat ke ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Membuat instance resource baru, tidak mengikat
- [ctx.request()](../context/request.md) - HTTP request umum, cocok untuk panggilan sekali pakai sederhana
- [MultiRecordResource](./multi-record-resource.md) - Berorientasi data table/list, mendukung CRUD, pagination
- [SingleRecordResource](./single-record-resource.md) - Berorientasi single record
