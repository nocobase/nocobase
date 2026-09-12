---
title: "ctx.element"
description: "ctx.element adalah node container DOM yang dirender RunJS saat ini, ctx.render() merender ke sini secara default, untuk JSBlock, JSField, dll."
keywords: "ctx.element,container DOM,ctx.render,JSBlock,JSField,RunJS,NocoBase"
---

# ctx.element

Menunjuk ke instance ElementProxy dari container DOM sandbox, sebagai target render default dari `ctx.render()`. Tersedia pada skenario yang memiliki container render seperti JSBlock, JSField, JSItem, JSColumn.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | Container DOM dari block, merender konten kustom block |
| **JSField / JSItem / FormJSFieldItem** | Container render field/item form (biasanya `<span>`) |
| **JSColumn** | Container DOM sel tabel, merender konten kolom kustom |

> Perhatian: `ctx.element` hanya tersedia pada konteks RunJS yang memiliki container render; pada skenario tanpa konteks UI (seperti logika pure backend) mungkin `undefined`, disarankan melakukan pengecekan null sebelum digunakan.

## Definisi Tipe

```typescript
element: ElementProxy | undefined;

// ElementProxy adalah proxy dari HTMLElement asli, mengekspos API yang aman
class ElementProxy {
  __el: HTMLElement;  // Elemen DOM native yang dipegang internal (hanya akses untuk skenario tertentu)
  innerHTML: string;  // Saat baca/tulis dibersihkan oleh DOMPurify
  outerHTML: string; // Sama dengan di atas
  appendChild(child: HTMLElement | string): void;
  // Method HTMLElement lainnya diteruskan (tidak direkomendasikan untuk digunakan langsung)
}
```

## Persyaratan Keamanan

**Direkomendasikan: semua render diselesaikan melalui `ctx.render()`.** Jangan langsung menggunakan API DOM dari `ctx.element` (seperti `innerHTML`, `appendChild`, `querySelector`, dll.).

### Mengapa Direkomendasikan ctx.render()

| Keunggulan | Deskripsi |
|------|------|
| **Keamanan** | Kontrol keamanan terpusat, menghindari XSS dan operasi DOM yang tidak tepat |
| **Dukungan React** | Dukungan penuh untuk JSX, komponen React, dan lifecycle |
| **Inheritance Konteks** | Otomatis mewarisi ConfigProvider, tema, dll. dari aplikasi |
| **Penanganan Konflik** | Otomatis mengelola pembuatan/penghapusan React root, menghindari konflik multi-instance |

### Tidak Direkomendasikan: Operasi Langsung pada ctx.element

```ts
// Tidak direkomendasikan: menggunakan API ctx.element langsung
ctx.element.innerHTML = '<div>konten</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` sudah deprecated, gunakan `ctx.render()` sebagai gantinya.

### Direkomendasikan: Menggunakan ctx.render()

```ts
// Render komponen React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Selamat Datang')}>
    <Button type="primary">Klik</Button>
  </Card>
);

// Render string HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Konten') + '</div>');

// Render node DOM
const div = document.createElement('div');
div.textContent = ctx.t('Halo');
ctx.render(div);
```

## Kasus Khusus: Sebagai Anchor Popup

Saat perlu menggunakan elemen saat ini sebagai anchor untuk membuka Popover, Anda dapat mengakses `ctx.element?.__el` untuk mendapatkan DOM native sebagai `target`:

```ts
// ctx.viewer.popover memerlukan DOM native sebagai target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Konten popup</div>,
});
```

> Hanya gunakan `__el` pada skenario "menggunakan container saat ini sebagai anchor" seperti ini; pada kasus lain jangan langsung mengoperasikan DOM.

## Hubungan dengan ctx.render

- `ctx.render(vnode)` jika tidak meneruskan `container`, secara default merender ke container `ctx.element`
- Jika `ctx.element` juga tidak ada dan `container` tidak diteruskan, akan melempar error
- Dapat menentukan container secara eksplisit: `ctx.render(vnode, customContainer)`

## Hal yang Perlu Diperhatikan

- `ctx.element` hanya digunakan sebagai container internal `ctx.render()`, tidak disarankan untuk diakses atau dimodifikasi langsung properti/methodnya
- Pada konteks tanpa container render `ctx.element` adalah `undefined`, sebelum memanggil `ctx.render()` perlu memastikan container tersedia atau meneruskan `container` secara manual
- `innerHTML`/`outerHTML` ElementProxy meskipun dibersihkan oleh DOMPurify, tetap direkomendasikan menggunakan `ctx.render()` untuk pengelolaan render terpadu

## Terkait

- [ctx.render](./render.md): Merender konten ke container
- [ctx.view](./view.md): Controller view saat ini
- [ctx.modal](./modal.md): API cepat modal
