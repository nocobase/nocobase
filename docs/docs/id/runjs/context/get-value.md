:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/get-value).
:::

# ctx.getValue()

Dalam skenario bidang (field) yang dapat diedit seperti JSField dan JSItem, gunakan ini untuk mendapatkan nilai terbaru dari bidang saat ini. Dikombinasikan dengan `ctx.setValue(v)`, ini memungkinkan pengikatan dua arah (two-way binding) dengan formulir.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSField** | Membaca input pengguna atau nilai formulir saat ini dalam bidang kustom yang dapat diedit. |
| **JSItem** | Membaca nilai sel saat ini dalam item tabel/sub-tabel yang dapat diedit. |
| **JSColumn** | Membaca nilai bidang dari baris yang sesuai saat perenderan kolom tabel. |

> **Catatan**: `ctx.getValue()` hanya tersedia dalam konteks RunJS dengan pengikatan formulir; metode ini tidak tersedia dalam skenario tanpa pengikatan bidang, seperti alur kerja atau aturan keterkaitan (linkage rules).

## Definisi Tipe

```ts
getValue<T = any>(): T | undefined;
```

- **Nilai Kembalian**: Nilai bidang saat ini, yang tipenya ditentukan oleh tipe item formulir bidang tersebut; mungkin bernilai `undefined` jika bidang belum terdaftar atau belum diisi.

## Urutan Pengambilan Nilai

`ctx.getValue()` mengambil nilai dengan urutan sebagai berikut:

1. **Status Formulir**: Memprioritaskan pembacaan dari status saat ini pada Ant Design Form.
2. **Nilai Cadangan (Fallback)**: Jika bidang tidak ada dalam formulir, maka akan kembali ke nilai awal atau props bidang tersebut.

> Jika formulir belum selesai dirender atau bidang belum terdaftar, mungkin akan mengembalikan `undefined`.

## Contoh

### Perenderan berdasarkan nilai saat ini

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Silakan masukkan konten terlebih dahulu</span>);
} else {
  ctx.render(<span>Nilai saat ini: {current}</span>);
}
```

### Pengikatan dua arah dengan setValue

```tsx
const { Input } = ctx.libs.antd;

// Membaca nilai saat ini sebagai nilai default
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Terkait

- [ctx.setValue()](./set-value.md) - Mengatur nilai bidang saat ini, digunakan bersama `getValue` untuk pengikatan dua arah.
- [ctx.form](./form.md) - Instans Ant Design Form, untuk membaca/menulis bidang lainnya.
- `js-field:value-change` - Peristiwa kontainer yang dipicu saat nilai eksternal berubah, digunakan untuk memperbarui tampilan.