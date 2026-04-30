---
title: "ctx.render()"
description: "ctx.render() merender elemen React, string HTML, atau DOM ke ctx.element, otomatis mewarisi ConfigProvider, tema, untuk JSBlock, JSField, dll."
keywords: "ctx.render,React,JSX,ctx.element,ConfigProvider,JSBlock,JSField,RunJS,NocoBase"
---

# ctx.render()

Merender elemen React, string HTML, atau node DOM ke container tertentu. Saat tidak meneruskan `container`, secara default merender ke `ctx.element`, dan otomatis mewarisi ConfigProvider, tema, dll. dari aplikasi.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | Merender konten kustom block (chart, list, card, dll.) |
| **JSField / JSItem / JSColumn** | Merender tampilan kustom field yang dapat diedit atau kolom tabel |
| **Block Detail** | Bentuk tampilan kustom field di halaman detail |

> Perhatian: `ctx.render()` membutuhkan container render. Jika tidak meneruskan `container` dan `ctx.element` tidak ada (seperti skenario logika murni tanpa UI), akan melempar error.

## Definisi Tipe

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Konten yang akan dirender |
| `container` | `Element` \| `DocumentFragment` (opsional) | Container target render, default `ctx.element` |

**Return Value**:

- Saat merender **elemen React**: mengembalikan `ReactDOMClient.Root`, untuk memudahkan memanggil `root.render()` untuk update
- Saat merender **string HTML** atau **node DOM**: mengembalikan `null`

## Penjelasan Tipe vnode

| Tipe | Perilaku |
|------|------|
| `React.ReactElement` (JSX) | Menggunakan `createRoot` React untuk render, dengan kemampuan React lengkap, otomatis mewarisi konteks aplikasi |
| `string` | Setelah dibersihkan oleh DOMPurify menyetel `innerHTML` container, akan unmount React root yang ada terlebih dahulu |
| `Node` (Element, Text, dll.) | Mengosongkan container kemudian `appendChild`, akan unmount React root yang ada terlebih dahulu |
| `DocumentFragment` | Sub-node fragment ditambahkan ke container, akan unmount React root yang ada terlebih dahulu |

## Contoh

### Render Elemen React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Judul')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Diklik'))}>
      {ctx.t('Tombol')}
    </Button>
  </Card>
);
```

### Render String HTML

```ts
ctx.render('<h1>Hello World</h1>');

// Dikombinasikan dengan ctx.t untuk internasionalisasi
ctx.render('<div style="padding:16px">' + ctx.t('Konten') + '</div>');

// Render bersyarat
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### Render Node DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Render container kosong terlebih dahulu, kemudian serahkan ke library pihak ketiga (seperti ECharts) untuk inisialisasi
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Menentukan Container Kustom

```ts
// Render ke elemen DOM tertentu
const customEl = document.getElementById('my-container');
ctx.render(<div>Konten</div>, customEl);
```

### Pemanggilan Beberapa Kali Akan Mengganti Konten

```ts
// Pemanggilan kedua akan mengganti konten yang sudah ada di container
ctx.render(<div>Pertama</div>);
ctx.render(<div>Kedua</div>);  // Hanya menampilkan "Kedua"
```

## Hal yang Perlu Diperhatikan

- **Pemanggilan beberapa kali akan mengganti**: setiap `ctx.render()` akan mengganti konten yang sudah ada di container, tidak akan menambahkan.
- **Keamanan string HTML**: HTML yang diteruskan akan dibersihkan oleh DOMPurify, mengurangi risiko XSS, tetapi tetap disarankan untuk menghindari menggabungkan input pengguna yang tidak terpercaya.
- **Jangan langsung mengoperasikan ctx.element**: `ctx.element.innerHTML` sudah deprecated, harus menggunakan `ctx.render()` secara seragam.
- **Saat tidak ada container perlu meneruskan container**: pada skenario di mana `ctx.element` adalah `undefined` (seperti dalam modul yang dimuat oleh `ctx.importAsync`), perlu meneruskan `container` secara eksplisit.

## Terkait

- [ctx.element](./element.md) - Container render default, `ctx.render()` digunakan saat tidak meneruskan container
- [ctx.libs](./libs.md) - Library bawaan seperti React, antd, untuk render JSX
- [ctx.importAsync()](./import-async.md) - Memuat React/library komponen eksternal sesuai kebutuhan kemudian digunakan dengan `ctx.render()`
