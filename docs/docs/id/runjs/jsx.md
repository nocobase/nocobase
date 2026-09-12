---
title: "Sintaks JSX RunJS"
description: "RunJS mendukung sintaks JSX, sehingga Anda dapat menulis kode seperti komponen React, otomatis dikompilasi menjadi createElement, dengan React dan antd bawaan, untuk UI kustom JSBlock dan JSField."
keywords: "JSX,React,antd,JSBlock,JSField,createElement,RunJS,NocoBase"
---

# JSX

RunJS mendukung sintaks JSX, sehingga Anda dapat menulis kode seperti menulis komponen React. JSX akan dikompilasi secara otomatis sebelum eksekusi.

## Catatan Kompilasi

- Menggunakan [sucrase](https://github.com/alangpierce/sucrase) untuk mengonversi JSX
- JSX dikompilasi menjadi `ctx.libs.React.createElement` dan `ctx.libs.React.Fragment`
- **Tidak perlu import React**: tulis JSX langsung, setelah kompilasi otomatis menggunakan `ctx.libs.React`
- Saat memuat React eksternal melalui `ctx.importAsync('react@x.x.x')`, JSX akan menggunakan `createElement` dari instance tersebut

## Menggunakan React dan Komponen Bawaan

RunJS memiliki React dan library UI umum bawaan, dapat digunakan langsung melalui `ctx.libs` tanpa perlu `import`:

- **ctx.libs.React** — React itu sendiri
- **ctx.libs.ReactDOM** — ReactDOM (jika diperlukan dapat digunakan dengan createRoot)
- **ctx.libs.antd** — Komponen Ant Design
- **ctx.libs.antdIcons** — Ikon Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klik</Button>);
```

Saat menulis JSX langsung tidak perlu mendestrukturisasi React; hanya saat menggunakan **Hooks** (seperti `useState`, `useEffect`) atau **Fragment** (`<>...</>`) Anda perlu mendestrukturisasi dari `ctx.libs`:

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Perhatian**: React bawaan dan React eksternal yang diimpor melalui `ctx.importAsync()` **tidak dapat dicampur**. Jika menggunakan library UI eksternal, React juga harus diimpor dari sumber eksternal yang sama.

## Menggunakan React dan Komponen Eksternal

Saat memuat React dan library UI dengan versi tertentu melalui `ctx.importAsync()`, JSX akan menggunakan instance React tersebut:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Klik</Button>);
```

Jika antd bergantung pada react/react-dom, Anda dapat menentukan versi yang sama melalui `deps` untuk menghindari multiple instance:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Perhatian**: Saat menggunakan React eksternal, library UI seperti antd juga harus diimpor melalui `ctx.importAsync()`, jangan dicampur dengan `ctx.libs.antd`.

## Poin Penting Sintaks JSX

- **Komponen dan props**: `<Button type="primary">teks</Button>`
- **Fragment**: `<>...</>` atau `<React.Fragment>...</React.Fragment>` (saat menggunakan Fragment perlu mendestrukturisasi `const { React } = ctx.libs`)
- **Ekspresi**: gunakan `{ekspresi}` di JSX untuk menyisipkan variabel atau operasi, seperti `{ctx.user.name}`, `{count + 1}`; jangan gunakan sintaks template `{{ }}`
- **Render kondisional**: `{flag && <span>konten</span>}` atau `{flag ? <A /> : <B />}`
- **Render list**: gunakan `array.map()` untuk mengembalikan list elemen, dan setel `key` yang stabil untuk setiap elemen

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```
