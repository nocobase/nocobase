---
title: "Render dalam Container RunJS"
description: "ctx.render() merender elemen React, JSX, atau DOM ke container ctx.element, secara otomatis mewarisi ConfigProvider dan tema, cocok untuk tampilan kustom JSBlock dan JSField."
keywords: "ctx.render,render container,JSX,React,ConfigProvider,JSBlock,JSField,NocoBase RunJS"
---

# Render dalam Container

Gunakan `ctx.render()` untuk merender konten ke container saat ini (`ctx.element`), mendukung tiga bentuk berikut:

## `ctx.render()`

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

## Catatan JSX

RunJS dapat langsung merender JSX, baik menggunakan React/library komponen bawaan maupun memuat dependensi eksternal sesuai kebutuhan.

### Menggunakan React dan Library Komponen Bawaan

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Menggunakan React dan Library Komponen Eksternal

Memuat versi tertentu sesuai kebutuhan melalui `ctx.importAsync()`:

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

Cocok untuk skenario yang membutuhkan versi tertentu atau komponen pihak ketiga.

## ctx.element

Penggunaan yang tidak direkomendasikan (sudah deprecated):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

Cara yang direkomendasikan:

```js
ctx.render(<h1>Hello World</h1>);
```
