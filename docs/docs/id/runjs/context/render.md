:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/render).
:::

# ctx.render()

Merender elemen React, string HTML, atau node DOM ke dalam kontainer yang ditentukan. Jika `container` tidak diberikan, secara default akan dirender ke dalam `ctx.element` dan secara otomatis mewarisi konteks aplikasi seperti ConfigProvider, tema, dan lainnya.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock** | Merender konten kustom blok (grafik, daftar, kartu, dll.) |
| **JSField / JSItem / JSColumn** | Merender tampilan kustom untuk bidang yang dapat diedit atau kolom tabel |
| **Blok Detail** | Menyesuaikan format tampilan bidang pada halaman detail |

> Catatan: `ctx.render()` memerlukan kontainer rendering. Jika `container` tidak dikirimkan dan `ctx.element` tidak ada (misalnya dalam skenario logika murni tanpa UI), kesalahan (error) akan muncul.

## Definisi Tipe

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parameter | Tipe | Keterangan |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Konten yang akan dirender |
| `container` | `Element` \| `DocumentFragment` (Opsional) | Kontainer target rendering, defaultnya adalah `ctx.element` |

**Nilai Kembalian**:

- Saat merender **elemen React**: Mengembalikan `ReactDOMClient.Root`, memudahkan pemanggilan `root.render()` untuk pembaruan selanjutnya.
- Saat merender **string HTML** atau **node DOM**: Mengembalikan `null`.

## Penjelasan Tipe vnode

| Tipe | Perilaku |
|------|------|
| `React.ReactElement` (JSX) | Dirender menggunakan `createRoot` React, menyediakan kemampuan React penuh dan secara otomatis mewarisi konteks aplikasi. |
| `string` | Mengatur `innerHTML` kontainer setelah dibersihkan dengan DOMPurify; root React yang ada akan dilepas (unmount) terlebih dahulu. |
| `Node` (Element, Text, dll.) | Menambahkan melalui `appendChild` setelah mengosongkan kontainer; root React yang ada akan dilepas terlebih dahulu. |
| `DocumentFragment` | Menambahkan node anak fragmen ke kontainer; root React yang ada akan dilepas terlebih dahulu. |

## Contoh

### Merender Elemen React (JSX)

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

### Merender String HTML

```ts
ctx.render('<h1>Hello World</h1>');

// Menggabungkan dengan ctx.t untuk internasionalisasi
ctx.render('<div style="padding:16px">' + ctx.t('Konten') + '</div>');

// Rendering kondisional
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Tidak ada data') + '</span>');
```

### Merender Node DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Render kontainer kosong terlebih dahulu, lalu serahkan ke pustaka pihak ketiga (misalnya ECharts) untuk inisialisasi
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Menentukan Kontainer Kustom

```ts
// Merender ke elemen DOM tertentu
const customEl = document.getElementById('my-container');
ctx.render(<div>Konten</div>, customEl);
```

### Pemanggilan Berulang Akan Mengganti Konten

```ts
// Pemanggilan kedua akan mengganti konten yang ada di dalam kontainer
ctx.render(<div>Pertama</div>);
ctx.render(<div>Kedua</div>);  // Hanya "Kedua" yang akan ditampilkan
```

## Catatan

- **Pemanggilan berulang akan mengganti konten**: Setiap pemanggilan `ctx.render()` akan mengganti konten yang ada di dalam kontainer, bukan menambahkannya.
- **Keamanan string HTML**: HTML yang dikirimkan akan dibersihkan melalui DOMPurify untuk mengurangi risiko XSS, namun tetap disarankan untuk menghindari penggabungan input pengguna yang tidak terpercaya.
- **Jangan memanipulasi ctx.element secara langsung**: `ctx.element.innerHTML` sudah tidak digunakan lagi (deprecated); sebaiknya gunakan `ctx.render()` secara konsisten.
- **Kirimkan kontainer jika tidak ada default**: Dalam skenario di mana `ctx.element` bernilai `undefined` (misalnya di dalam modul yang dimuat melalui `ctx.importAsync`), `container` harus diberikan secara eksplisit.

## Terkait

- [ctx.element](./element.md) - Kontainer rendering default, digunakan saat tidak ada kontainer yang dikirimkan ke `ctx.render()`.
- [ctx.libs](./libs.md) - Pustaka bawaan seperti React dan Ant Design, digunakan untuk rendering JSX.
- [ctx.importAsync()](./import-async.md) - Digunakan bersama dengan `ctx.render()` setelah memuat pustaka React/komponen eksternal sesuai kebutuhan.