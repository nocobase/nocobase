:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/element).
:::

# ctx.element

Instans `ElementProxy` yang menunjuk ke kontainer DOM sandbox, berfungsi sebagai target rendering default untuk `ctx.render()`. Tersedia dalam skenario yang memiliki kontainer rendering seperti `JSBlock`, `JSField`, `JSItem`, dan `JSColumn`.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock** | Kontainer DOM untuk blok, digunakan untuk merender konten kustom blok. |
| **JSField / JSItem / FormJSFieldItem** | Kontainer rendering untuk bidang (field) atau item formulir (biasanya berupa `<span>`). |
| **JSColumn** | Kontainer DOM untuk sel tabel, digunakan untuk merender konten kolom kustom. |

> Catatan: `ctx.element` hanya tersedia dalam konteks RunJS yang memiliki kontainer rendering. Dalam skenario tanpa UI (seperti logika backend murni), nilainya mungkin `undefined`. Disarankan untuk melakukan pengecekan nilai kosong sebelum digunakan.

## Definisi Tipe

```typescript
element: ElementProxy | undefined;

// ElementProxy adalah proksi untuk HTMLElement mentah, mengekspos API yang aman
class ElementProxy {
  __el: HTMLElement;  // Elemen DOM asli internal (hanya diakses pada skenario tertentu)
  innerHTML: string;  // Dibersihkan melalui DOMPurify saat baca/tulis
  outerHTML: string; // Sama seperti di atas
  appendChild(child: HTMLElement | string): void;
  // Metode HTMLElement lainnya diteruskan (tidak disarankan untuk digunakan secara langsung)
}
```

## Persyaratan Keamanan

**Rekomendasi: Semua rendering dilakukan melalui `ctx.render()`.** Hindari menggunakan API DOM dari `ctx.element` secara langsung (seperti `innerHTML`, `appendChild`, `querySelector`, dll.).

### Mengapa ctx.render() Direkomendasikan

| Keunggulan | Keterangan |
|------|------|
| **Keamanan** | Kontrol keamanan terpusat untuk menghindari XSS dan operasi DOM yang tidak tepat. |
| **Dukungan React** | Dukungan penuh untuk JSX, komponen React, dan siklus hidup (lifecycle). |
| **Pewarisan Konteks** | Secara otomatis mewarisi `ConfigProvider` aplikasi, tema, dll. |
| **Penanganan Konflik** | Mengelola pembuatan/pelepasan root React secara otomatis untuk menghindari konflik multi-instans. |

### ❌ Tidak Direkomendasikan: Manipulasi langsung ctx.element

```ts
// ❌ Tidak direkomendasikan: Menggunakan API ctx.element secara langsung
ctx.element.innerHTML = '<div>Konten</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` telah usang (deprecated), silakan gunakan `ctx.render()` sebagai gantinya.

### ✅ Direkomendasikan: Menggunakan ctx.render()

```ts
// ✅ Merender komponen React
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Selamat Datang')}>
    <Button type="primary">Klik</Button>
  </Card>
);

// ✅ Merender string HTML
ctx.render('<div style="padding:16px;">' + ctx.t('Konten') + '</div>');

// ✅ Merender node DOM
const div = document.createElement('div');
div.textContent = ctx.t('Halo');
ctx.render(div);
```

## Kasus Khusus: Sebagai Jangkar Popover

Dalam kasus di mana Anda perlu membuka Popover dengan elemen saat ini sebagai jangkar (anchor), Anda dapat mengakses `ctx.element?.__el` untuk mendapatkan DOM asli sebagai `target`:

```ts
// ctx.viewer.popover memerlukan DOM asli sebagai target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Konten Pop-up</div>,
});
```

> Gunakan `__el` hanya dalam skenario seperti "menggunakan kontainer saat ini sebagai jangkar"; jangan memanipulasi DOM secara langsung dalam kasus lain.

## Hubungan dengan ctx.render

- Jika `ctx.render(vnode)` dipanggil tanpa argumen `container`, secara default akan merender ke dalam kontainer `ctx.element`.
- Jika `ctx.element` tidak ada dan `container` tidak diberikan, kesalahan (error) akan muncul.
- Anda dapat menentukan kontainer secara eksplisit: `ctx.render(vnode, customContainer)`.

## Catatan

- `ctx.element` ditujukan untuk penggunaan internal oleh `ctx.render()`. Mengakses atau memodifikasi properti/metodenya secara langsung tidak disarankan.
- Dalam konteks tanpa kontainer rendering, `ctx.element` akan bernilai `undefined`. Pastikan kontainer tersedia atau berikan `container` secara manual sebelum memanggil `ctx.render()`.
- Meskipun `innerHTML`/`outerHTML` pada `ElementProxy` dibersihkan melalui DOMPurify, tetap disarankan untuk menggunakan `ctx.render()` untuk manajemen rendering yang terpadu.

## Terkait

- [ctx.render](./render.md): Merender konten ke kontainer
- [ctx.view](./view.md): Pengontrol tampilan saat ini
- [ctx.modal](./modal.md): API cepat untuk modal