:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/index).
:::

# Ikhtisar RunJS

RunJS adalah lingkungan eksekusi JavaScript yang digunakan dalam NocoBase untuk skenario seperti **Blok JS**, **Bidang JS**, dan **Tindakan JS**. Kode berjalan dalam *sandbox* terbatas, menyediakan akses aman ke `ctx` (API Konteks) dan memiliki kemampuan berikut:

- `await` tingkat atas (Top-level `await`)
- Mengimpor modul eksternal
- Perenderan di dalam kontainer
- Variabel global

## `await` Tingkat Atas (Top-level `await`)

RunJS mendukung `await` tingkat atas, sehingga tidak perlu membungkus kode dalam IIFE.

**Tidak Direkomendasikan**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**Direkomendasikan**

```js
async function test() {}
await test();
```

## Mengimpor Modul Eksternal

- Gunakan `ctx.importAsync()` untuk modul ESM (Direkomendasikan)
- Gunakan `ctx.requireAsync()` untuk modul UMD/AMD

## Perenderan di dalam Kontainer

Gunakan `ctx.render()` untuk merender konten ke dalam kontainer saat ini (`ctx.element`). Ini mendukung tiga format berikut:

### Merender JSX

```jsx
ctx.render(<button>Button</button>);
```

### Merender Node DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Merender String HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Variabel Global

- `window`
- `document`
- `navigator`
- `ctx`