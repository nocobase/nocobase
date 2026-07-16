---
title: "Pengembangan Ekstensi File Manager"
description: "Memperluas komponen pratinjau tipe file, custom field lampiran, logika upload, berbasis API attachmentFileTypes, mime-match, dan lainnya."
keywords: "ekstensi file manager,ekstensi field lampiran,ekstensi pratinjau file,attachmentFileTypes,NocoBase"
---

# Pengembangan Ekstensi

## Memperluas Tipe File Front-end

Untuk file yang sudah selesai diupload, di antarmuka front-end Anda dapat menampilkan konten pratinjau yang berbeda berdasarkan tipe file yang berbeda. Field lampiran File Manager memiliki pratinjau file bawaan berbasis browser (di-embed dalam iframe). Cara ini mendukung sebagian besar format file (gambar, video, audio, PDF, dan lainnya) untuk pratinjau langsung di browser. Saat format file tidak didukung untuk pratinjau browser, atau ada kebutuhan interaksi pratinjau khusus, Anda dapat menerapkannya melalui ekstensi komponen pratinjau berbasis tipe file.

### Contoh

Misalnya jika Anda ingin memperluas komponen carousel switching untuk file tipe gambar, Anda dapat menggunakan kode berikut:

```ts
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

Di antaranya, `attachmentFileTypes` adalah objek entry yang disediakan dalam paket `@nocobase/client` untuk memperluas tipe file. Gunakan metode `add` yang disediakannya untuk memperluas objek deskripsi tipe file.

Setiap tipe file harus mengimplementasikan metode `match()`, yang digunakan untuk memeriksa apakah tipe file memenuhi persyaratan. Dalam contoh, metode yang disediakan paket `mime-match` digunakan untuk mendeteksi properti `mimetype` file. Jika cocok dengan tipe `image/*`, maka dianggap sebagai tipe file yang perlu diproses. Jika tidak cocok, akan downgrade ke pemrosesan tipe bawaan.

Properti `Previewer` pada objek deskripsi tipe adalah komponen yang digunakan untuk pratinjau. Ketika tipe file cocok, komponen ini akan dirender untuk pratinjau. Biasanya disarankan menggunakan komponen tipe popup sebagai container dasar (seperti `<Modal />` dan lainnya), lalu meletakkan konten pratinjau dan interaksi yang dibutuhkan ke dalam komponen tersebut, untuk mengimplementasikan fungsi pratinjau.

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

`attachmentFileTypes` adalah instance global, diimpor melalui `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Mendaftarkan objek deskripsi tipe file baru ke registry tipe file. Tipe objek deskripsi adalah `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metode pencocokan format file.

Parameter input `file` adalah objek data file yang sudah diupload, berisi properti terkait yang dapat digunakan untuk penilaian tipe:

* `mimetype`: Deskripsi mimetype
* `extname`: Ekstensi file, termasuk "."
* `path`: Path relatif penyimpanan file
* `url`: URL file

Nilai kembalian adalah tipe `boolean`, mewakili hasil apakah cocok.

##### `Previewer`

Komponen React untuk pratinjau file.

Parameter Props yang diteruskan adalah:

* `index`: Indeks file dalam daftar lampiran
* `list`: Daftar lampiran
* `onSwitchIndex`: Metode untuk mengganti indeks

`onSwitchIndex` dapat menerima nilai indeks apa pun dalam list, untuk berpindah ke file lain. Jika menggunakan `null` sebagai parameter pergantian, maka komponen pratinjau akan langsung ditutup.

```ts
onSwitchIndex(null);
```
