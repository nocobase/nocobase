:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` adalah namespace terpadu untuk library bawaan di RunJS, yang berisi library umum seperti React, Ant Design, dayjs, dan lodash. **Tidak memerlukan `import` atau pemuatan asinkron**; library ini dapat digunakan secara langsung melalui `ctx.libs.xxx`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Menggunakan React + Ant Design untuk merender UI, dayjs untuk penanganan tanggal, dan lodash untuk pemrosesan data. |
| **Formula / Kalkulasi** | Menggunakan formula atau math untuk formula mirip Excel dan operasi ekspresi matematika. |
| **Alur Peristiwa / Aturan Keterkaitan** | Memanggil library utilitas seperti lodash, dayjs, dan formula dalam skenario logika murni. |

## Daftar Library Bawaan

| Properti | Deskripsi | Dokumentasi |
|------|------|------|
| `ctx.libs.React` | Inti React, digunakan untuk JSX dan Hook | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API klien ReactDOM (termasuk `createRoot`), digunakan bersama React untuk perenderan | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Library komponen Ant Design (Button, Card, Table, Form, Input, Modal, dll.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Library ikon Ant Design (misalnya PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Library utilitas tanggal dan waktu | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Library utilitas (get, set, debounce, dll.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Library fungsi formula mirip Excel (SUM, AVERAGE, IF, dll.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Library ekspresi matematika dan kalkulasi | [Math.js](https://mathjs.org/docs/) |

## Alias Tingkat Atas

Untuk kompatibilitas dengan kode lama, beberapa library juga diekspos pada tingkat atas: `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, dan `ctx.dayjs`. **Direkomendasikan untuk menggunakan `ctx.libs.xxx` secara konsisten** demi kemudahan pemeliharaan dan pencarian dokumentasi.

## Lazy Loading

`lodash`, `formula`, dan `math` menggunakan **lazy loading**: import dinamis hanya dipicu saat `ctx.libs.lodash` diakses untuk pertama kalinya, dan setelah itu cache akan digunakan kembali. `React`, `antd`, `dayjs`, dan `antdIcons` telah dikonfigurasi sebelumnya oleh konteks dan dapat langsung digunakan.

## Contoh

### Perenderan dengan React dan Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Judul">
    <Button type="primary">Klik</Button>
  </Card>
);
```

### Menggunakan Hook

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

ctx.render(<Button icon={<UserOutlined />}>Pengguna</Button>);
```

### Pemrosesan Tanggal dengan dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Fungsi Utilitas dengan lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Kalkulasi Formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Ekspresi Matematika dengan math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Catatan

- **Pencampuran dengan ctx.importAsync**: Jika React eksternal dimuat melalui `ctx.importAsync('react@19')`, JSX akan menggunakan instance tersebut. Dalam hal ini, **jangan** mencampurnya dengan `ctx.libs.antd`. Ant Design harus dimuat agar sesuai dengan versi React tersebut (misalnya, `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Beberapa Instance React**: Jika terjadi kesalahan "Invalid hook call" atau hook dispatcher bernilai null, hal ini biasanya disebabkan oleh adanya beberapa instance React. Sebelum membaca `ctx.libs.React` atau memanggil Hook, jalankan `await ctx.importAsync('react@versi')` terlebih dahulu untuk memastikan instance React yang sama digunakan bersama dengan halaman tersebut.

## Terkait

- [ctx.importAsync()](./import-async.md) - Memuat modul ESM eksternal sesuai kebutuhan (misalnya versi spesifik React, Vue)
- [ctx.render()](./render.md) - Merender konten ke dalam kontainer