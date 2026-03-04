:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/jsx).
:::

# JSX

RunJS mendukung sintaks JSX, yang memungkinkan Anda menulis kode seperti komponen React. JSX akan dikompilasi secara otomatis sebelum dijalankan.

## Catatan Kompilasi

- Menggunakan [sucrase](https://github.com/alangpierce/sucrase) untuk mengonversi JSX.
- JSX akan dikompilasi menjadi `ctx.libs.React.createElement` dan `ctx.libs.React.Fragment`.
- **Tidak perlu mengimpor React**: Anda dapat menulis JSX secara langsung; setelah dikompilasi, `ctx.libs.React` akan digunakan secara otomatis.
- Saat memuat React eksternal melalui `ctx.importAsync('react@x.x.x')`, JSX akan beralih menggunakan metode `createElement` dari instans tersebut.

## Menggunakan React dan Komponen Bawaan

RunJS menyertakan React dan pustaka UI umum secara bawaan. Anda dapat mengaksesnya secara langsung melalui `ctx.libs` tanpa perlu menggunakan `import`:

- **ctx.libs.React** — Inti React
- **ctx.libs.ReactDOM** — ReactDOM (dapat digunakan dengan `createRoot` jika diperlukan)
- **ctx.libs.antd** — Komponen Ant Design
- **ctx.libs.antdIcons** — Ikon Ant Design

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klik</Button>);
```

Saat menulis JSX secara langsung, Anda tidak perlu melakukan destrukturisasi React. Anda hanya perlu melakukan destrukturisasi dari `ctx.libs` saat menggunakan **Hooks** (seperti `useState`, `useEffect`) atau **Fragment** (`<>...</>`):

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**Catatan**: React bawaan dan React eksternal yang diimpor melalui `ctx.importAsync()` **tidak dapat dicampur**. Jika Anda menggunakan pustaka UI eksternal, React juga harus diimpor dari sumber eksternal yang sama.

## Menggunakan React dan Komponen Eksternal

Saat memuat versi tertentu dari React dan pustaka UI melalui `ctx.importAsync()`, JSX akan menggunakan instans React tersebut:

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Klik</Button>);
```

Jika antd bergantung pada react/react-dom, Anda dapat menentukan versi yang sama melalui `deps` untuk menghindari adanya beberapa instans:

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**Catatan**: Saat menggunakan React eksternal, pustaka UI seperti antd juga harus diimpor melalui `ctx.importAsync()`. Jangan mencampurnya dengan `ctx.libs.antd`.

## Poin Penting Sintaks JSX

- **Komponen dan props**: `<Button type="primary">Teks</Button>`
- **Fragment**: `<>...</>` atau `<React.Fragment>...</React.Fragment>` (memerlukan destrukturisasi `const { React } = ctx.libs` saat menggunakan Fragment)
- **Ekspresi**: Gunakan `{ekspresi}` dalam JSX untuk memasukkan variabel atau operasi, seperti `{ctx.user.name}` atau `{count + 1}`; jangan gunakan sintaks templat `{{ }}`.
- **Render Kondisional**: `{flag && <span>Konten</span>}` atau `{flag ? <A /> : <B />}`
- **Render Daftar**: Gunakan `array.map()` untuk mengembalikan daftar elemen, dan pastikan setiap elemen memiliki `key` yang stabil.

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