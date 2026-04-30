---
title: "ctx.libs"
description: "ctx.libs adalah namespace library bawaan RunJS, berisi React, antd, dayjs, lodash, formula, math, dll., tidak perlu import langsung digunakan."
keywords: "ctx.libs,React,antd,dayjs,lodash,formula,math,library bawaan,RunJS,NocoBase"
---

# ctx.libs

`ctx.libs` adalah namespace terpadu library bawaan RunJS, berisi library umum seperti React, Ant Design, dayjs, lodash. **Tidak perlu `import` atau loading async**, dapat langsung digunakan melalui `ctx.libs.xxx`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Menggunakan React + Ant Design untuk render UI, dayjs untuk pengolahan tanggal, lodash untuk pengolahan data |
| **Formula / Kalkulasi** | Menggunakan formula atau math untuk operasi rumus mirip Excel, ekspresi matematika |
| **Event Flow / Aturan Linkage** | Memanggil library utility seperti lodash, dayjs, formula pada skenario logika murni |

## Daftar Library Bawaan

| Properti | Deskripsi | Dokumentasi |
|------|------|------|
| `ctx.libs.React` | React itu sendiri, untuk JSX dan Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API client ReactDOM (termasuk `createRoot`), digunakan dengan React untuk render | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Library komponen Ant Design (Button, Card, Table, Form, Input, Modal, dll.) | [Ant Design](https://ant.design/components/overview-cn/) |
| `ctx.libs.antdIcons` | Library ikon Ant Design (seperti PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon-cn/) |
| `ctx.libs.dayjs` | Library utility tanggal-waktu | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Library utility (get, set, debounce, dll.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Library function rumus mirip Excel (SUM, AVERAGE, IF, dll.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Library ekspresi matematika dan kalkulasi | [Math.js](https://mathjs.org/docs/) |

## Alias Tingkat Atas

Untuk kompatibilitas dengan kode historis, sebagian library juga diekspos di tingkat atas: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, `ctx.dayjs`. **Direkomendasikan menggunakan `ctx.libs.xxx` secara seragam**, untuk pemeliharaan dan pencarian dokumentasi yang lebih mudah.

## Lazy Loading

`lodash`, `formula`, `math`, dll. menggunakan **lazy loading**: saat pertama kali mengakses `ctx.libs.lodash` baru memicu dynamic import, kemudian menggunakan cache. `React`, `antd`, `dayjs`, `antdIcons` sudah pre-set oleh konteks, langsung dapat digunakan saat diakses.

## Contoh

### Render React dan Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Judul">
    <Button type="primary">Klik</Button>
  </Card>
);
```

### Menggunakan Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### Menggunakan Ikon

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>User</Button>);
```

### Pengolahan Tanggal dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Function Utility lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Kalkulasi Formula formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Ekspresi Matematika math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Hal yang Perlu Diperhatikan

- **Mencampur dengan ctx.importAsync**: jika memuat React eksternal melalui `ctx.importAsync('react@19')`, JSX akan menggunakan instance tersebut; saat ini **jangan** dicampur dengan `ctx.libs.antd`, antd perlu dimuat sesuai dengan versi React tersebut (seperti `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Multiple instance React**: jika muncul "Invalid hook call" atau hook dispatcher null, biasanya disebabkan oleh multiple instance React. Sebelum membaca `ctx.libs.React` atau memanggil Hooks, jalankan `await ctx.importAsync('react@versi')` terlebih dahulu untuk memastikan menggunakan React yang sama dengan halaman.

## Terkait

- [ctx.importAsync()](./import-async.md) - Memuat modul ESM eksternal sesuai kebutuhan (seperti React, Vue versi tertentu)
- [ctx.render()](./render.md) - Merender konten ke container
