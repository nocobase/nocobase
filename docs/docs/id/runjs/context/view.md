---
title: "ctx.view"
description: "ctx.view adalah view model halaman atau block saat ini, untuk mendapatkan route, membuka popup, mengakses status level halaman."
keywords: "ctx.view,view model,route,popup,status halaman,RunJS,NocoBase"
---

# ctx.view

View controller yang aktif saat ini (popup, drawer, popover, area embedded, dll.), untuk mengakses informasi level view dan operasi. Disediakan oleh FlowViewContext, hanya tersedia di konten view yang dibuka melalui `ctx.viewer` atau `ctx.openView`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Konten Popup/Drawer** | Di `content` melalui `ctx.view.close()` menutup view saat ini, atau menggunakan `Header`, `Footer` untuk merender judul dan footer |
| **Setelah Submit Form** | Setelah submit berhasil memanggil `ctx.view.close(result)` untuk menutup dan mengembalikan hasil |
| **JSBlock / Action** | Menentukan tipe view saat ini berdasarkan `ctx.view.type`, atau membaca parameter pembukaan di `ctx.view.inputArgs` |
| **Pemilihan Relasi, Sub-Table** | Membaca `collectionName`, `filterByTk`, `parentId`, dll. di `inputArgs` untuk loading data |

> Perhatian: `ctx.view` hanya tersedia pada environment RunJS yang memiliki konteks view (seperti dalam content `ctx.viewer.dialog()`, popup form, dalam pemilih relasi); pada halaman biasa atau konteks backend adalah `undefined`, disarankan melakukan optional chaining saat digunakan (`ctx.view?.close?.()`).

## Definisi Tipe

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Tersedia pada view konfigurasi flow
};
```

## Properti dan Method Umum

| Properti/Method | Tipe | Deskripsi |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Tipe view saat ini |
| `inputArgs` | `Record<string, any>` | Parameter yang diteruskan saat membuka view, lihat di bawah |
| `Header` | `React.FC \| null` | Komponen header, untuk merender judul, area aksi |
| `Footer` | `React.FC \| null` | Komponen footer, untuk merender tombol, dll. |
| `close(result?, force?)` | `void` | Menutup view saat ini, dapat meneruskan `result` mengembalikan ke pemanggil |
| `update(newConfig)` | `void` | Update konfigurasi view (seperti lebar, judul) |
| `navigation` | `ViewNavigation \| undefined` | Navigasi view dalam halaman, termasuk perpindahan Tab, dll. |

> Saat ini hanya `dialog` dan `drawer` yang mendukung `Header` dan `Footer`.

## Field Umum inputArgs

Field `inputArgs` berbeda pada skenario pembukaan yang berbeda, yang umum termasuk:

| Field | Deskripsi |
|------|------|
| `viewUid` | UID view |
| `collectionName` | Nama data table |
| `filterByTk` | Filter primary key (detail single record) |
| `parentId` | ID parent (skenario relasi) |
| `sourceId` | ID record sumber |
| `parentItem` | Data parent item |
| `scene` | Skenario (seperti `create`, `edit`, `select`) |
| `onChange` | Callback setelah pemilihan/perubahan |
| `tabUid` | UID Tab saat ini (dalam halaman) |

Diakses melalui `ctx.getVar('ctx.view.inputArgs.xxx')` atau `ctx.view.inputArgs.xxx`.

## Contoh

### Menutup View Saat Ini

```ts
// Menutup popup setelah submit berhasil
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Menutup dan mengembalikan hasil
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Menggunakan Header / Footer di content

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Edit" extra={<Button size="small">Bantuan</Button>} />
      <div>Konten form...</div>
      <Footer>
        <Button onClick={() => close()}>Batal</Button>
        <Button type="primary" onClick={handleSubmit}>OK</Button>
      </Footer>
    </div>
  );
}
```

### Membuat Cabang Berdasarkan Tipe View atau inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Sembunyikan header pada view embedded
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Skenario pemilih user
}
```

## Hubungan dengan ctx.viewer, ctx.openView

| Tujuan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Membuka view baru** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` atau `ctx.openView()` |
| **Mengoperasikan view saat ini** | `ctx.view.close()`, `ctx.view.update()` |
| **Mendapatkan parameter pembukaan** | `ctx.view.inputArgs` |

`ctx.viewer` bertanggung jawab atas "membuka" view, `ctx.view` merepresentasikan instance view "saat ini" tempat berada; `ctx.openView` digunakan untuk membuka flow view yang sudah dikonfigurasi.

## Hal yang Perlu Diperhatikan

- `ctx.view` hanya tersedia di dalam view, di halaman biasa adalah `undefined`
- Gunakan optional chaining: `ctx.view?.close?.()` untuk menghindari error pada konteks tanpa view
- `result` dari `close(result)` akan diteruskan ke Promise yang dikembalikan `ctx.viewer.open()`

## Terkait

- [ctx.openView()](./open-view.md): Membuka flow view yang sudah dikonfigurasi
- [ctx.modal](./modal.md): Popup ringan (informasi, konfirmasi, dll.)

> `ctx.viewer` menyediakan method seperti `dialog()`, `drawer()`, `popover()`, `embed()` untuk membuka view, di dalam `content` yang dibuka dapat mengakses `ctx.view`.
