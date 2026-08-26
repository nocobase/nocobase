---
title: "Mengimpor Modul RunJS"
description: "Impor modul RunJS: ctx.libs bawaan dengan React/antd/dayjs/formula, ctx.importAsync untuk loading dinamis ESM, ctx.requireAsync untuk UMD, konfigurasi CDN esm.sh."
keywords: "Mengimpor Modul,ctx.libs,ctx.importAsync,ctx.requireAsync,ESM,esm.sh,NocoBase RunJS"
---

# Mengimpor Modul

Pada RunJS Anda dapat menggunakan dua jenis modul: **modul bawaan** (digunakan langsung melalui `ctx.libs` tanpa perlu import) dan **modul eksternal** (dimuat sesuai kebutuhan melalui `ctx.importAsync()` atau `ctx.requireAsync()`).

---

## Modul Bawaan - ctx.libs (tanpa perlu import)

RunJS memiliki library umum bawaan yang dapat diakses langsung melalui `ctx.libs`, **tanpa** perlu `import` atau loading async.

| Properti | Deskripsi |
|------|------|
| **ctx.libs.React** | React itu sendiri, untuk JSX dan Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (dapat digunakan dengan createRoot dll.) |
| **ctx.libs.antd** | Library komponen Ant Design |
| **ctx.libs.antdIcons** | Ikon Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): ekspresi matematika, operasi matriks, dll. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): rumus mirip Excel (SUM, AVERAGE, dll.) |

### Contoh: React dan antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Klik</Button>);
```

### Contoh: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Contoh: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Modul Eksternal

Saat membutuhkan library pihak ketiga, pilih cara loading berdasarkan format modul:

- **Modul ESM** → gunakan `ctx.importAsync()`
- **Modul UMD/AMD** → gunakan `ctx.requireAsync()`

---

### Mengimpor Modul ESM

Gunakan **`ctx.importAsync()`** untuk memuat modul ESM secara dinamis berdasarkan URL, cocok untuk skenario seperti JS Block, JS Field, JS Action, dll.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: alamat modul ESM. Mendukung format singkat `<nama-paket>@<versi>` atau dengan sub-path `<nama-paket>@<versi>/<path-file>` (seperti `vue@3.4.0`, `lodash@4/lodash.js`), akan digabungkan dengan prefix CDN sesuai konfigurasi; juga mendukung URL lengkap.
- **Return**: objek namespace modul yang sudah di-resolve.

#### Default https://esm.sh

Saat tidak dikonfigurasi, format singkat akan menggunakan **https://esm.sh** sebagai prefix CDN. Contoh:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Setara dengan loading dari https://esm.sh/vue@3.4.0
```

#### Layanan esm.sh Mandiri

Jika perlu intranet atau CDN mandiri, Anda dapat mendeploy layanan yang kompatibel dengan protokol esm.sh, dan menentukannya melalui environment variable:

- **ESM_CDN_BASE_URL**: alamat dasar ESM CDN (default `https://esm.sh`)
- **ESM_CDN_SUFFIX**: suffix opsional (seperti `/+esm` dari jsDelivr)

Layanan mandiri dapat merujuk ke: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Mengimpor Modul UMD/AMD

Gunakan **`ctx.requireAsync()`** untuk memuat UMD/AMD atau script yang di-mount ke global secara async berdasarkan URL.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: mendukung dua bentuk:
  - **Path singkat**: `<nama-paket>@<versi>/<path-file>`, sama seperti `ctx.importAsync()`, akan di-resolve sesuai konfigurasi ESM CDN saat ini; saat di-resolve akan ditambahkan `?raw`, langsung meminta file asli dari path tersebut (sebagian besar adalah build UMD). Contoh `echarts@5/dist/echarts.min.js` sebenarnya meminta `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (saat default menggunakan esm.sh).
  - **URL lengkap**: alamat lengkap CDN apa pun (seperti `https://cdn.jsdelivr.net/npm/xxx`).
- **Return**: objek library setelah loading (bentuk spesifik tergantung cara ekspor library tersebut)

Setelah loading, banyak library UMD akan ter-mount ke objek global (seperti `window.xxx`), gunakan sesuai dokumentasi library tersebut.

**Contoh**

```ts
// Path singkat (di-resolve oleh esm.sh menjadi ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL lengkap
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Perhatian**: Jika library juga menyediakan versi ESM, lebih utamakan `ctx.importAsync()` untuk mendapatkan semantik modul yang lebih baik dan Tree-shaking.
