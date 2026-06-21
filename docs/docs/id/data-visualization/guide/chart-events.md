---
title: "Kustomisasi Event Interaksi"
description: "Daftarkan event interaksi ECharts melalui chart.on: highlight klik, navigasi halaman, analisis drill-down, buka popup, mendukung parameter params dan dispatchAction."
keywords: "event interaksi chart,chart.on,highlight klik,navigasi,drill-down,dispatchAction,NocoBase"
---

# Kustomisasi Event Interaksi

Pada editor event, tulis JS dan daftarkan perilaku interaksi melalui instance ECharts `chart` untuk mengimplementasikan linkage. Misalnya navigasi ke halaman baru, buka popup untuk analisis drill-down, dll.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Pendaftaran dan Pelepasan Event
- Daftar: `chart.on(eventName, handler)`
- Lepas: `chart.off(eventName, handler)` atau `chart.off(eventName)` untuk membersihkan event dengan nama yang sama

**Perhatian:**
Untuk alasan keamanan, sangat disarankan untuk melepas event sebelum mendaftarkannya!


## Struktur Data Parameter params dari Fungsi handler

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Yang umum digunakan adalah `params.data`, `params.name`, dll.


## Contoh: Highlight saat Klik
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Highlight titik data saat ini
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Batalkan highlight lainnya
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Contoh: Klik untuk Navigasi Halaman
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Cara 1: navigasi internal aplikasi, tidak memaksa refresh halaman, pengalaman lebih baik (direkomendasikan), hanya butuh path relatif
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Cara 2: navigasi ke halaman eksternal, butuh URL lengkap
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Cara 3: buka halaman eksternal di tab baru, butuh URL lengkap
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Contoh: Klik untuk Menampilkan Popup Detail (Drill-Down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // Daftarkan variabel konteks untuk digunakan oleh popup baru
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Pada popup yang baru dibuka, gunakan variabel konteks yang dideklarasikan oleh Chart `ctx.view.inputArgs.XXX`


## Preview dan Simpan
- Klik "Preview" untuk memuat dan menjalankan kode event.
- Klik "Simpan" untuk menyimpan konten konfigurasi event saat ini.
- Klik "Batal" untuk kembali ke status simpan sebelumnya.

**Saran:**
- Sebelum setiap binding, lakukan `chart.off('event')` untuk menghindari binding berulang yang menyebabkan eksekusi duplikat atau peningkatan memori.
- Gunakan operasi ringan dalam event (`dispatchAction`, `setOption`), hindari pemblokiran rendering.
- Verifikasi bersama opsi Chart dan query data untuk memastikan field yang ditangani event konsisten dengan data saat ini.
