:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/import-modules).
:::

# Mengimpor Modul

Di RunJS, Anda dapat menggunakan dua jenis modul: **Modul bawaan** (digunakan langsung melalui `ctx.libs`, tanpa perlu `import`) dan **Modul eksternal** (dimuat sesuai kebutuhan melalui `ctx.importAsync()` atau `ctx.requireAsync()`).

---

## Modul Bawaan - ctx.libs (Tanpa perlu import)

RunJS menyertakan pustaka umum bawaan yang dapat diakses langsung melalui `ctx.libs`, **tanpa** perlu `import` atau pemuatan asinkron.

| Properti | Deskripsi |
|------|------|
| **ctx.libs.React** | Inti React, digunakan untuk JSX dan Hook |
| **ctx.libs.ReactDOM** | ReactDOM (dapat digunakan untuk `createRoot`, dll.) |
| **ctx.libs.antd** | Pustaka komponen Ant Design |
| **ctx.libs.antdIcons** | Ikon Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Ekspresi matematika, operasi matriks, dll. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Formula mirip Excel (SUM, AVERAGE, dll.) |

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

Saat membutuhkan pustaka pihak ketiga, pilih metode pemuatan berdasarkan format modul:

- **Modul ESM** → Gunakan `ctx.importAsync()`
- **Modul UMD/AMD** → Gunakan `ctx.requireAsync()`

---

### Mengimpor Modul ESM

Gunakan **`ctx.importAsync()`** untuk memuat modul ESM secara dinamis melalui URL, cocok untuk skenario seperti blok JS, bidang JS, operasi JS, dll.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: Alamat modul ESM. Mendukung format singkatan `<nama-paket>@<versi>` atau sub-jalur `<nama-paket>@<versi>/<jalur-file>` (misalnya `vue@3.4.0`, `lodash@4/lodash.js`), yang akan digabungkan dengan awalan CDN yang dikonfigurasi; URL lengkap juga didukung.
- **Mengembalikan**: Objek namespace modul yang telah diurai.

#### Default: https://esm.sh

Jika tidak dikonfigurasi, format singkatan akan menggunakan **https://esm.sh** sebagai awalan CDN. Contoh:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Setara dengan memuat dari https://esm.sh/vue@3.4.0
```

#### Layanan esm.sh Mandiri

Jika Anda memerlukan jaringan internal atau CDN mandiri, Anda dapat menerapkan layanan yang kompatibel dengan protokol esm.sh dan menentukannya melalui variabel lingkungan:

- **ESM_CDN_BASE_URL**: Alamat dasar ESM CDN (default `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Akhiran opsional (seperti `/+esm` untuk jsDelivr)

Untuk layanan mandiri, silakan merujuk ke: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Mengimpor Modul UMD/AMD

Gunakan **`ctx.requireAsync()`** untuk memuat modul UMD/AMD atau skrip yang dipasang ke objek global secara asinkron melalui URL.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Mendukung dua bentuk:
  - **Jalur singkatan**: `<nama-paket>@<versi>/<jalur-file>`, sama seperti `ctx.importAsync()`, akan diurai sesuai konfigurasi ESM CDN saat ini; saat penguraian, `?raw` akan ditambahkan untuk meminta file mentah dari jalur tersebut secara langsung (biasanya build UMD). Misalnya `echarts@5/dist/echarts.min.js` sebenarnya meminta `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (saat menggunakan esm.sh secara default).
  - **URL Lengkap**: Alamat lengkap dari CDN mana pun (misalnya `https://cdn.jsdelivr.net/npm/xxx`).
- **Mengembalikan**: Objek pustaka yang dimuat (bentuk spesifik bergantung pada cara pustaka tersebut mengekspor kontennya).

Setelah dimuat, banyak pustaka UMD akan dipasang ke objek global (seperti `window.xxx`), gunakan sesuai dengan dokumentasi pustaka tersebut.

**Contoh**

```ts
// Jalur singkatan (diurai melalui esm.sh sebagai ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL Lengkap
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Catatan**: Jika pustaka menyediakan versi ESM, prioritaskan penggunaan `ctx.importAsync()` untuk mendapatkan semantik modul dan *Tree-shaking* yang lebih baik.