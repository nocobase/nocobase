:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pengembangan Ekstensi

## Memperluas Mesin Penyimpanan

### Sisi Server

1. **Mewarisi `StorageType`**
   
   Buat kelas baru dan implementasikan metode `make()` dan `delete()`. Jika perlu, timpa hook seperti `getFileURL()`, `getFileStream()`, dan `getFileData()`.

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

4. **Mendaftarkan tipe baru**  
   Sisipkan implementasi penyimpanan baru pada siklus hidup `beforeLoad` atau `load` plugin:

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

Setelah didaftarkan, konfigurasi penyimpanan akan muncul di resource `storages`, sama seperti tipe bawaan. Konfigurasi yang disediakan oleh `StorageType.defaults()` dapat digunakan untuk mengisi formulir secara otomatis atau menginisialisasi record default.

<!--
### Konfigurasi sisi klien dan antarmuka manajemen
Di sisi klien, Anda perlu memberi tahu pengelola file bagaimana merender formulir konfigurasi dan apakah ada logika unggah kustom. Setiap objek tipe penyimpanan berisi properti berikut:
-->

## Memperluas Tipe File di Frontend

Untuk file yang sudah diunggah, Anda dapat menampilkan konten pratinjau yang berbeda di antarmuka frontend berdasarkan tipe file. Field lampiran pada pengelola file memiliki pratinjau file berbasis browser (disematkan dalam iframe), yang mendukung pratinjau sebagian besar format (seperti gambar, video, audio, dan PDF) langsung di browser. Ketika format file tidak didukung oleh browser atau memerlukan interaksi pratinjau khusus, Anda dapat memperluas komponen pratinjau berdasarkan tipe file.

### Contoh

Misalnya, jika Anda ingin mengintegrasikan pratinjau online kustom untuk file Office, Anda dapat menggunakan kode berikut:

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

Di sini, `filePreviewTypes` adalah objek entry yang disediakan oleh `@nocobase/plugin-file-manager/client` untuk memperluas pratinjau file. Gunakan metode `add` untuk menambahkan objek deskripsi tipe file.

Setiap tipe file harus mengimplementasikan metode `match()` untuk memeriksa apakah tipe file memenuhi persyaratan. Dalam contoh, `matchMimetype` digunakan untuk memeriksa atribut `mimetype` file. Jika cocok dengan tipe `docx`, maka dianggap tipe file yang harus ditangani. Jika tidak cocok, akan digunakan penanganan tipe bawaan.

Properti `Previewer` pada objek deskripsi tipe adalah komponen untuk pratinjau. Ketika tipe file cocok, komponen ini akan dirender dalam dialog pratinjau. Anda dapat mengembalikan tampilan React apa pun (misalnya iframe, pemutar, atau grafik).

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes` adalah instance global yang diimpor dari `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Mendaftarkan objek deskripsi tipe file baru ke registri tipe file. Tipe objek deskripsi adalah `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Metode pencocokan format file.

Parameter masukan `file` adalah objek data file yang diunggah, berisi properti relevan untuk pemeriksaan tipe:

* `mimetype`: deskripsi mimetype
* `extname`: ekstensi file, termasuk "."
* `path`: jalur penyimpanan relatif file
* `url`: URL file

Mengembalikan nilai `boolean` yang menunjukkan apakah cocok.

##### `getThumbnailURL`

Mengembalikan URL thumbnail yang digunakan pada daftar file. Jika nilai yang dikembalikan kosong, gambar placeholder bawaan akan digunakan.

##### `Previewer`

Komponen React untuk pratinjau file.

Props yang diterima adalah:

* `file`: objek file saat ini (bisa berupa URL string atau objek yang berisi `url`/`preview`)
* `index`: indeks file dalam daftar
* `list`: daftar file

