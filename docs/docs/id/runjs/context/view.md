:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/view).
:::

# ctx.view

Kontroler tampilan yang aktif saat ini (dialog, laci/drawer, popover, area tersemat, dll.), digunakan untuk mengakses informasi dan operasi tingkat tampilan. Disediakan oleh `FlowViewContext`, fitur ini hanya tersedia dalam konten tampilan yang dibuka melalui `ctx.viewer` atau `ctx.openView`.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Konten Dialog/Laci** | Gunakan `ctx.view.close()` di dalam `content` untuk menutup tampilan saat ini, atau gunakan `Header` dan `Footer` untuk merender judul dan bagian bawah. |
| **Setelah Pengiriman Formulir** | Panggil `ctx.view.close(result)` setelah pengiriman berhasil untuk menutup tampilan dan mengembalikan hasil. |
| **JSBlock / Tindakan** | Tentukan tipe tampilan saat ini melalui `ctx.view.type`, atau baca parameter pembukaan dari `ctx.view.inputArgs`. |
| **Pemilihan Relasi, Sub-tabel** | Baca `collectionName`, `filterByTk`, `parentId`, dll., dari `inputArgs` untuk pemuatan data. |

> Catatan: `ctx.view` hanya tersedia di lingkungan RunJS dengan konteks tampilan (misalnya, di dalam `content` dari `ctx.viewer.dialog()`, dalam formulir dialog, atau di dalam pemilih relasi). Pada halaman standar atau konteks backend, nilainya adalah `undefined`. Disarankan untuk menggunakan *optional chaining* (`ctx.view?.close?.()`).

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
  submit?: () => Promise<any>;  // Tersedia dalam tampilan konfigurasi alur kerja
};
```

## Properti dan Metode Umum

| Properti/Metode | Tipe | Keterangan |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Tipe tampilan saat ini |
| `inputArgs` | `Record<string, any>` | Parameter yang diteruskan saat membuka tampilan (lihat di bawah) |
| `Header` | `React.FC \| null` | Komponen header, digunakan untuk merender judul dan area tindakan |
| `Footer` | `React.FC \| null` | Komponen footer, digunakan untuk merender tombol, dll. |
| `close(result?, force?)` | `void` | Menutup tampilan saat ini; `result` dapat dikirim kembali ke pemanggil |
| `update(newConfig)` | `void` | Memperbarui konfigurasi tampilan (misalnya, lebar, judul) |
| `navigation` | `ViewNavigation \| undefined` | Navigasi tampilan dalam halaman, termasuk perpindahan Tab, dll. |

> Saat ini, hanya `dialog` dan `drawer` yang mendukung `Header` dan `Footer`.

## Field inputArgs yang Umum

Field dalam `inputArgs` bervariasi tergantung pada skenario pembukaan. Field yang umum meliputi:

| Field | Keterangan |
|------|------|
| `viewUid` | UID Tampilan |
| `collectionName` | Nama koleksi |
| `filterByTk` | Filter kunci utama (untuk detail rekaman tunggal) |
| `parentId` | ID Induk (untuk skenario relasi) |
| `sourceId` | ID rekaman sumber |
| `parentItem` | Data item induk |
| `scene` | Skenario (misalnya, `create`, `edit`, `select`) |
| `onChange` | Callback setelah pemilihan atau perubahan |
| `tabUid` | UID Tab saat ini (dalam halaman) |

Akses field ini melalui `ctx.getVar('ctx.view.inputArgs.xxx')` atau `ctx.view.inputArgs.xxx`.

## Contoh

### Menutup Tampilan Saat Ini

```ts
// Tutup dialog setelah pengiriman berhasil
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Tutup dan kembalikan hasil
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Menggunakan Header / Footer dalam Konten

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Ubah" extra={<Button size="small">Bantuan</Button>} />
      <div>Konten formulir...</div>
      <Footer>
        <Button onClick={() => close()}>Batal</Button>
        <Button type="primary" onClick={handleSubmit}>Simpan</Button>
      </Footer>
    </div>
  );
}
```

### Percabangan Berdasarkan Tipe Tampilan atau inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Sembunyikan header dalam tampilan tersemat
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Skenario pemilih pengguna
}
```

## Hubungan dengan ctx.viewer dan ctx.openView

| Kegunaan | Penggunaan yang Disarankan |
|------|----------|
| **Membuka tampilan baru** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` atau `ctx.openView()` |
| **Mengoperasikan tampilan saat ini** | `ctx.view.close()`, `ctx.view.update()` |
| **Mendapatkan parameter pembukaan** | `ctx.view.inputArgs` |

`ctx.viewer` bertanggung jawab untuk "membuka" tampilan, sedangkan `ctx.view` mewakili instans tampilan "saat ini"; `ctx.openView` digunakan untuk membuka tampilan alur kerja yang telah dikonfigurasi.

## Catatan

- `ctx.view` hanya tersedia di dalam tampilan; nilainya adalah `undefined` pada halaman standar.
- Gunakan *optional chaining*: `ctx.view?.close?.()` untuk menghindari kesalahan saat tidak ada konteks tampilan.
- `result` dari `close(result)` diteruskan ke Promise yang dikembalikan oleh `ctx.viewer.open()`.

## Terkait

- [ctx.openView()](./open-view.md): Membuka tampilan alur kerja yang telah dikonfigurasi
- [ctx.modal](./modal.md): Popup ringan (info, konfirmasi, dll.)

> `ctx.viewer` menyediakan metode seperti `dialog()`, `drawer()`, `popover()`, dan `embed()` untuk membuka tampilan. `content` yang dibuka oleh metode ini dapat mengakses `ctx.view`.