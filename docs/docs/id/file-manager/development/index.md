---
pkg: '@nocobase/plugin-file-manager'
title: "Pengembangan Ekstensi File Manager"
description: "Memperluas storage engine kustom (inherit StorageType, implementasi make/delete), memperluas tipe pratinjau file frontend (filePreviewTypes.add, match, Previewer), dengan contoh kode lengkap."
keywords: "Pengembangan ekstensi,StorageType,Storage kustom,filePreviewTypes,Ekstensi pratinjau file,File Manager,NocoBase"
---

# Pengembangan Ekstensi

## Memperluas Storage Engine

### Server-side

1. **Inherit `StorageType`**
   
   Buat class baru dan implementasikan method `make()` dan `delete()`. Jika perlu, override hook seperti `getFileURL()`, `getFileStream()`, `getFileData()`, dan lainnya.

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

4. **Mendaftarkan Tipe Baru**  
   Pada lifecycle `beforeLoad` atau `load` plugin, inject implementasi storage baru:

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

Setelah pendaftaran selesai, konfigurasi storage akan muncul pada resource `storages` seperti tipe bawaan. Konfigurasi yang disediakan oleh `StorageType.defaults()` dapat digunakan untuk mengisi form secara otomatis atau menginisialisasi record default.

<!--
### Konfigurasi Client-side dan Antarmuka Manajemen
Sisi client perlu memberi tahu File Manager bagaimana cara merender form konfigurasi dan apakah memiliki logika upload kustom. Setiap object tipe storage berisi properti berikut:
-->

## Memperluas Tipe File Frontend

Untuk file yang sudah selesai diunggah, pada antarmuka frontend Anda dapat menampilkan konten pratinjau yang berbeda berdasarkan tipe file yang berbeda. Field lampiran File Manager memiliki pratinjau file berbasis browser bawaan (disematkan dalam iframe). Cara ini mendukung sebagian besar format file (gambar, video, audio, PDF, dan lainnya) untuk dipratinjau langsung di browser. Saat format file tidak mendukung pratinjau browser, atau ada interaksi pratinjau khusus yang dibutuhkan, Anda dapat memperluasnya melalui komponen pratinjau berbasis tipe file.

### Contoh

Contoh, jika Anda ingin mengintegrasikan pratinjau online kustom untuk file Office, Anda dapat menggunakan kode berikut:

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

`filePreviewTypes` adalah object entry yang disediakan `@nocobase/plugin-file-manager/client` untuk memperluas pratinjau file. Gunakan method `add` yang disediakannya untuk memperluas object deskripsi tipe file.

Setiap tipe file harus mengimplementasikan method `match()` untuk memeriksa apakah tipe file memenuhi syarat. Pada contoh, `matchMimetype` digunakan untuk memeriksa properti `mimetype` file. Jika cocok dengan tipe `docx`, maka file dianggap sebagai tipe yang perlu diproses. Jika tidak cocok, akan didowngrade ke pemrosesan tipe bawaan.

Properti `Previewer` pada object deskripsi tipe adalah komponen yang digunakan untuk pratinjau. Saat tipe file cocok, komponen ini akan dirender untuk pratinjau. Komponen akan dirender dalam layer popup pratinjau file. Anda dapat mengembalikan view React apapun (contoh iframe, player, chart, dan lainnya).

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

`filePreviewTypes` adalah instance global, di-import melalui `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Mendaftarkan object deskripsi tipe file baru ke registry tipe file. Tipe object deskripsi adalah `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Method pencocokan format file.

Parameter `file` yang dikirim adalah object data file yang sudah diunggah, berisi properti terkait yang dapat digunakan untuk penilaian tipe:

* `mimetype`: deskripsi mimetype
* `extname`: ekstensi file, termasuk "."
* `path`: path relatif penyimpanan file
* `url`: URL file

Nilai kembalian bertipe `boolean`, menunjukkan hasil pencocokan.

##### `getThumbnailURL`

Digunakan untuk mengembalikan alamat thumbnail dalam daftar file. Saat nilai kembalian kosong, gambar placeholder bawaan akan digunakan.

##### `Previewer`

Komponen React yang digunakan untuk pratinjau file.

Parameter Props yang dikirim:

* `file`: object file saat ini (mungkin berupa string URL atau object yang berisi `url`/`preview`)
* `index`: indeks file dalam list
* `list`: list file
