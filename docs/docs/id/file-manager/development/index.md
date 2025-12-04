:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pengembangan Ekstensi

## Memperluas Mesin Penyimpanan

### Sisi Server

1.  **Mewarisi `StorageType`**

    Buat kelas baru dan implementasikan metode `make()` serta `delete()`. Jika diperlukan, timpa (override) *hook* seperti `getFileURL()`, `getFileStream()`, atau `getFileData()`.

Contoh:

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4.  **Daftarkan Tipe Baru**
    Suntikkan implementasi penyimpanan baru dalam siklus hidup `beforeLoad` atau `load` dari plugin Anda:

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

Setelah pendaftaran, konfigurasi penyimpanan akan muncul di sumber daya `storages`, sama seperti tipe bawaan. Konfigurasi yang disediakan oleh `StorageType.defaults()` dapat digunakan untuk mengisi formulir secara otomatis atau menginisialisasi catatan default.

### Konfigurasi Sisi Klien dan Antarmuka Manajemen
Di sisi klien, Anda perlu memberi tahu pengelola berkas (file manager) cara merender formulir konfigurasi dan apakah ada logika unggah khusus. Setiap objek tipe penyimpanan memiliki properti berikut:

## Memperluas Tipe Berkas Frontend

Untuk berkas yang sudah diunggah, Anda dapat menampilkan konten pratinjau yang berbeda di antarmuka frontend berdasarkan tipe berkas yang berbeda. Bidang lampiran pengelola berkas memiliki pratinjau berkas berbasis browser bawaan (tertanam dalam iframe), yang mendukung pratinjau sebagian besar format berkas (seperti gambar, video, audio, dan PDF) langsung di browser. Ketika format berkas tidak didukung oleh browser untuk pratinjau, atau ketika interaksi pratinjau khusus diperlukan, Anda dapat memperluas komponen pratinjau berbasis tipe berkas.

### Contoh

Misalnya, jika Anda ingin memperluas tipe berkas gambar dengan komponen *carousel* (geser), Anda dapat menggunakan kode berikut:

```tsx
import React, { useCallback } from 'react';
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

Di sini, `attachmentFileTypes` adalah objek *entry* yang disediakan dalam paket `@nocobase/client` untuk memperluas tipe berkas. Gunakan metode `add` yang disediakannya untuk memperluas objek deskripsi tipe berkas.

Setiap tipe berkas harus mengimplementasikan metode `match()` untuk memeriksa apakah tipe berkas memenuhi persyaratan. Dalam contoh ini, metode yang disediakan oleh paket `mime-match` digunakan untuk memeriksa atribut `mimetype` berkas. Jika cocok dengan tipe `image/*`, maka berkas tersebut dianggap sebagai tipe berkas yang perlu diproses. Jika tidak ada kecocokan, maka akan kembali ke penanganan tipe bawaan.

Properti `Previewer` pada objek deskripsi tipe adalah komponen yang digunakan untuk pratinjau. Ketika tipe berkas cocok, komponen ini akan dirender untuk pratinjau. Umumnya disarankan untuk menggunakan komponen tipe dialog (seperti `<Modal />`) sebagai wadah dasar, lalu menempatkan pratinjau dan konten interaktif di dalamnya untuk mengimplementasikan fungsionalitas pratinjau.

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes` adalah instans global, diimpor dari `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Mendaftarkan objek deskripsi tipe berkas baru ke registri tipe berkas. Tipe objek deskripsi adalah `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metode pencocokan format berkas.

Parameter masukan `file` adalah objek data dari berkas yang diunggah, berisi properti relevan yang dapat digunakan untuk pemeriksaan tipe:

*   `mimetype`: deskripsi mimetype
*   `extname`: ekstensi berkas, termasuk "."
*   `path`: jalur penyimpanan relatif berkas
*   `url`: URL berkas

Mengembalikan nilai `boolean` yang menunjukkan hasil kecocokan.

##### `Previewer`

Komponen React untuk pratinjau berkas.

Parameter Props yang masuk adalah:

*   `index`: Indeks berkas dalam daftar lampiran
*   `list`: Daftar lampiran
*   `onSwitchIndex`: Metode untuk mengganti indeks

`onSwitchIndex` dapat menerima nilai indeks apa pun dari `list` untuk beralih ke berkas lain. Jika `null` diteruskan sebagai argumen, komponen pratinjau akan langsung ditutup.

```ts
onSwitchIndex(null);
```