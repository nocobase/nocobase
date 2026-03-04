:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/resource/api-resource).
:::

# APIResource

**Sumber daya API umum** berbasis URL untuk membuat permintaan, cocok untuk antarmuka HTTP apa pun. Mewarisi kelas dasar `FlowResource` dan memperluasnya dengan konfigurasi permintaan serta `refresh()`. Berbeda dengan [MultiRecordResource](./multi-record-resource.md) dan [SingleRecordResource](./single-record-resource.md), `APIResource` tidak bergantung pada nama sumber daya; ia melakukan permintaan langsung berdasarkan URL, sehingga cocok untuk antarmuka kustom, API pihak ketiga, dan skenario lainnya.

**Cara pembuatan**: `ctx.makeResource('APIResource')` atau `ctx.initResource('APIResource')`. Anda harus memanggil `setURL()` sebelum digunakan. Dalam konteks RunJS, `ctx.api` (APIClient) disuntikkan secara otomatis, sehingga tidak perlu memanggil `setAPIClient` secara manual.

---

## Skenario Penggunaan

| Skenario | Penjelasan |
|------|------|
| **Antarmuka Kustom** | Memanggil API sumber daya non-standar (misalnya, `/api/custom/stats`, `/api/reports/summary`). |
| **API Pihak Ketiga** | Meminta layanan eksternal melalui URL lengkap (memerlukan dukungan CORS dari target). |
| **Kueri Sekali Pakai** | Pengambilan data sementara yang bersifat sekali pakai dan tidak perlu diikat ke `ctx.resource`. |
| **Pilihan antara APIResource dan ctx.request** | Gunakan `APIResource` saat membutuhkan data reaktif, event, atau status kesalahan; gunakan `ctx.request()` untuk permintaan sekali pakai yang sederhana. |

---

## Kemampuan Kelas Dasar (FlowResource)

Semua Resource memiliki kemampuan berikut:

| Metode | Penjelasan |
|------|------|
| `getData()` | Mendapatkan data saat ini. |
| `setData(value)` | Mengatur data (hanya lokal). |
| `hasData()` | Memeriksa apakah data tersedia. |
| `getMeta(key?)` / `setMeta(meta)` | Membaca/menulis metadata. |
| `getError()` / `setError(err)` / `clearError()` | Manajemen status kesalahan. |
| `on(event, callback)` / `once` / `off` / `emit` | Berlangganan dan memicu event. |

---

## Konfigurasi Permintaan

| Metode | Penjelasan |
|------|------|
| `setAPIClient(api)` | Mengatur instance APIClient (biasanya disuntikkan secara otomatis di RunJS). |
| `getURL()` / `setURL(url)` | URL permintaan. |
| `loading` | Membaca/menulis status pemuatan (get/set). |
| `clearRequestParameters()` | Menghapus parameter permintaan. |
| `setRequestParameters(params)` | Menggabungkan dan mengatur parameter permintaan. |
| `setRequestMethod(method)` | Mengatur metode permintaan (misalnya, `'get'`, `'post'`, default adalah `'get'`). |
| `addRequestHeader(key, value)` / `removeRequestHeader(key)` | Header permintaan. |
| `addRequestParameter(key, value)` / `getRequestParameter(key)` / `removeRequestParameter(key)` | Menambah, menghapus, atau mencari parameter tunggal. |
| `setRequestBody(data)` | Body permintaan (digunakan untuk POST/PUT/PATCH). |
| `setRequestOptions(key, value)` / `getRequestOptions()` | Opsi permintaan umum. |

---

## Format URL

- **Gaya Sumber Daya**: Mendukung singkatan sumber daya NocoBase, seperti `users:list` atau `posts:get`, yang akan digabungkan dengan `baseURL`.
- **Jalur Relatif**: Misalnya, `/api/custom/endpoint`, yang digabungkan dengan `baseURL` aplikasi.
- **URL Lengkap**: Gunakan alamat lengkap untuk permintaan lintas domain; target harus dikonfigurasi dengan CORS.

---

## Pengambilan Data

| Metode | Penjelasan |
|------|------|
| `refresh()` | Melakukan permintaan berdasarkan URL, metode, parameter, header, dan data saat ini. Menulis respons `data` ke dalam `setData(data)` dan memicu event `'refresh'`. Jika gagal, ia akan mengatur `setError(err)` dan melempar `ResourceError`, tanpa memicu event `refresh`. Memerlukan `api` dan URL yang sudah diatur. |

---

## Contoh

### Permintaan GET Dasar

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/endpoint');
res.setRequestParameters({ page: 1, pageSize: 10 });
await res.refresh();
const data = res.getData();
```

### URL Gaya Sumber Daya

```js
const res = ctx.makeResource('APIResource');
res.setURL('users:list');
res.setRequestParameters({ pageSize: 20, sort: ['-createdAt'] });
await res.refresh();
const rows = res.getData()?.data ?? [];
```

### Permintaan POST (dengan Body Permintaan)

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/custom/submit');
res.setRequestMethod('post');
res.setRequestBody({ name: 'uji coba', type: 'report' });
await res.refresh();
const result = res.getData();
```

### Mendengarkan Event refresh

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/stats');
res.on('refresh', () => {
  const data = res.getData();
  ctx.render(<div>Statistik: {JSON.stringify(data)}</div>);
});
await res.refresh();
```

### Penanganan Kesalahan

```js
const res = ctx.makeResource('APIResource');
res.setURL('/api/may-fail');
try {
  await res.refresh();
  const data = res.getData();
} catch (e) {
  const err = res.getError();
  ctx.message.error(err?.message ?? 'Permintaan gagal');
}
```

### Header Permintaan Kustom

```js
const res = ctx.makeResource('APIResource');
res.setURL('https://api.example.com/data');
res.addRequestHeader('X-Custom-Header', 'value');
res.addRequestParameter('key', 'xxx');
await res.refresh();
```

---

## Catatan

- **Ketergantungan ctx.api**: Dalam RunJS, `ctx.api` disuntikkan oleh lingkungan; pemanggilan `setAPIClient` secara manual biasanya tidak diperlukan. Jika digunakan dalam skenario tanpa konteks, Anda harus mengaturnya sendiri.
- **Refresh Berarti Permintaan**: `refresh()` memulai permintaan berdasarkan konfigurasi saat ini; metode, parameter, data, dll., harus dikonfigurasi sebelum pemanggilan.
- **Kesalahan Tidak Memperbarui Data**: Jika terjadi kegagalan, `getData()` tetap mempertahankan nilai sebelumnya; informasi kesalahan dapat diambil melalui `getError()`.
- **Perbandingan dengan ctx.request**: Gunakan `ctx.request()` untuk permintaan sekali pakai yang sederhana; gunakan `APIResource` saat membutuhkan data reaktif, event, dan manajemen status kesalahan.

---

## Terkait

- [ctx.resource](../context/resource.md) - Instance resource dalam konteks saat ini
- [ctx.initResource()](../context/init-resource.md) - Menginisialisasi dan mengikat ke `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Membuat instance resource baru tanpa mengikat
- [ctx.request()](../context/request.md) - Permintaan HTTP umum, cocok untuk pemanggilan sekali pakai yang sederhana
- [MultiRecordResource](./multi-record-resource.md) - Untuk koleksi/daftar, mendukung CRUD dan paginasi
- [SingleRecordResource](./single-record-resource.md) - Untuk rekaman tunggal