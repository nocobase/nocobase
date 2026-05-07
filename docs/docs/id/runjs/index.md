---
title: "Ikhtisar NocoBase RunJS"
description: "RunJS adalah environment eksekusi JavaScript di NocoBase untuk JS Block, JS Field, dan JS Action, mendukung top-level await, ctx context, impor modul, render dalam container, dan berjalan di sandbox aman."
keywords: "RunJS,JS Block,JS Field,JS Action,environment eksekusi JavaScript,ctx context,sandbox,NocoBase"
---

# Ikhtisar RunJS

RunJS adalah environment eksekusi JavaScript di NocoBase yang digunakan dalam skenario seperti **JS Block**, **JS Field**, dan **JS Action**. Kode dijalankan di sandbox terbatas, dapat secara aman mengakses `ctx` (API context), dan menyediakan kemampuan berikut:

- Top-level async (Top-level `await`)
- Mengimpor modul eksternal
- Render dalam container
- Variabel Global

## Top-level async (Top-level `await`)

RunJS mendukung top-level `await`, tanpa perlu dibungkus dalam IIFE.

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

- Modul ESM menggunakan `ctx.importAsync()` (direkomendasikan)
- Modul UMD/AMD menggunakan `ctx.requireAsync()`

## Render dalam Container

Gunakan `ctx.render()` untuk merender konten ke container saat ini (`ctx.element`), mendukung tiga bentuk berikut:

### Render JSX

```jsx
ctx.render(<button>Button</button>);
```

### Render Node DOM

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';

ctx.render(div);
```

### Render String HTML

```js
ctx.render('<h1>Hello World</h1>');
```

## Variabel Global

- `window`
- `document`
- `navigator`
- `ctx`
