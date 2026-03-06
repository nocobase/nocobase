:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/render).
:::

# Render di Dalam Kontainer

Gunakan `ctx.render()` untuk merender konten ke dalam kontainer saat ini (`ctx.element`). Fungsi ini mendukung tiga bentuk berikut:

## `ctx.render()`

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

## Penjelasan JSX

RunJS dapat merender JSX secara langsung. Anda dapat menggunakan pustaka React/komponen bawaan, atau memuat dependensi eksternal sesuai kebutuhan.

### Menggunakan React dan Pustaka Komponen Bawaan

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Menggunakan React dan Pustaka Komponen Eksternal

Muat versi tertentu sesuai kebutuhan melalui `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Cocok untuk skenario yang membutuhkan versi spesifik atau komponen pihak ketiga.

## ctx.element

Penggunaan yang tidak direkomendasikan (usang):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Cara yang direkomendasikan:

```js
ctx.render(<h1>Hello World</h1>);
```