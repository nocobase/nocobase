:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Event Interaksi Kustom

Di editor event, Anda dapat menulis kode JS dan mendaftarkan perilaku interaksi melalui instance ECharts `chart` untuk mengaktifkan keterkaitan. Contohnya, navigasi ke halaman baru atau membuka dialog untuk analisis mendalam (drill-down).

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Registrasi dan Pembatalan Registrasi Event
- Registrasi: `chart.on(eventName, handler)`
- Pembatalan Registrasi: `chart.off(eventName, handler)` atau `chart.off(eventName)` untuk menghapus event dengan nama yang sama.

**Catatan:**
Untuk alasan keamanan, sangat disarankan untuk membatalkan registrasi event sebelum mendaftarkannya kembali!

## Struktur Data Parameter `params` pada Fungsi Handler

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Field yang umum digunakan meliputi `params.data` dan `params.name`.

## Contoh: Klik untuk Menyorot Pilihan
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Sorot titik data saat ini
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Batalkan sorotan lainnya
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Contoh: Klik untuk Navigasi Halaman
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Opsi 1: Navigasi internal aplikasi, tidak memaksa refresh halaman, pengalaman lebih baik (direkomendasikan), hanya memerlukan path relatif
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Opsi 2: Navigasi ke halaman eksternal, memerlukan URL lengkap
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Opsi 3: Buka halaman eksternal di tab baru, memerlukan URL lengkap
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Contoh: Klik untuk Membuka Dialog Detail (Drill-down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // daftarkan variabel konteks untuk dialog baru
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Dalam dialog yang baru dibuka, gunakan variabel konteks `ctx.view.inputArgs.XXX` yang dideklarasikan oleh grafik.

## Pratinjau dan Simpan
- Klik "Pratinjau" untuk memuat dan menjalankan kode event.
- Klik "Simpan" untuk menyimpan konfigurasi event saat ini.
- Klik "Batal" untuk kembali ke status terakhir yang disimpan.

**Rekomendasi:**
- Selalu gunakan `chart.off('event')` sebelum melakukan binding untuk menghindari eksekusi ganda atau peningkatan penggunaan memori.
- Dalam handler event, usahakan untuk menggunakan operasi ringan (misalnya, `dispatchAction`, `setOption`) untuk menghindari pemblokiran proses rendering.
- Lakukan validasi terhadap opsi grafik dan kueri data untuk memastikan bahwa field yang ditangani dalam event konsisten dengan data saat ini.