---
title: "Pengembangan ekstensi pengelola file"
description: "Memperluas komponen pratinjau tipe file, field lampiran kustom, dan logika unggah berdasarkan API seperti attachmentFileTypes dan mime-match."
keywords: "ekstensi pengelola file, ekstensi field lampiran, ekstensi pratinjau file,attachmentFileTypes,NocoBase"
---

# Pengembangan ekstensi

## Tipe file di frontend ekstensi

Untuk file yang telah selesai diunggah, antarmuka frontend dapat menampilkan konten pratinjau yang berbeda berdasarkan tipe file. Field lampiran pada pengelola file telah menyediakan pratinjau file berbasis browser (disematkan dalam iframe), yang mendukung pratinjau langsung sebagian besar format file (gambar, video, audio, PDF, dan lainnya) di browser. Jika format file tidak didukung oleh pratinjau browser, atau diperlukan interaksi pratinjau khusus, Anda dapat mewujudkannya dengan memperluas komponen pratinjau berdasarkan tipe file.

### Contoh

Misalnya, jika ingin menambahkan komponen carousel untuk file bertipe gambar, Anda dapat menggunakan kode berikut:

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

Di sini, `attachmentFileTypes` adalah objek entry untuk memperluas tipe file yang disediakan oleh paket `@nocobase/client`. Gunakan metode `add` yang disediakannya untuk memperluas objek deskripsi tipe file.

Setiap tipe file harus mengimplementasikan metode `match()` untuk memeriksa apakah tipe file memenuhi persyaratan. Pada contoh ini, metode yang disediakan oleh paket `mime-match` digunakan untuk memeriksa properti `mimetype` pada file. Jika cocok dengan tipe `image/*`, file tersebut dianggap sebagai tipe file yang perlu ditangani. Jika tidak cocok, penanganan akan diturunkan ke penanganan tipe bawaan.

Properti `Previewer` pada objek deskripsi tipe adalah komponen yang digunakan untuk pratinjau. Saat tipe file cocok, komponen tersebut akan dirender untuk pratinjau. Biasanya disarankan menggunakan komponen bertipe dialog sebagai wadah dasar (seperti `<Modal />`), lalu menempatkan konten pratinjau dan interaksi yang diperlukan ke dalam komponen tersebut untuk mewujudkan fungsi pratinjau.

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

`attachmentFileTypes` adalah instance global yang diimpor melalui `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Mendaftarkan objek deskripsi tipe file baru ke registry tipe file. Tipe objek deskripsi tersebut adalah `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metode pencocokan format file.

Parameter `file` yang diteruskan adalah objek data file yang telah diunggah, yang berisi atribut terkait untuk digunakan dalam menentukan tipe:

* `mimetype`: deskripsi mimetype
* `extname`: ekstensi file, termasuk “.”
* `path`: jalur relatif penyimpanan file
* `url`: URL file

Nilai yang dikembalikan bertipe `boolean`, yang menunjukkan hasil apakah terjadi kecocokan.

##### `Previewer`

Komponen React yang digunakan untuk mempratinjau file.

Parameter Props yang diteruskan:

* `index`: indeks file dalam daftar lampiran
* `list`: daftar lampiran
* `onSwitchIndex`: metode untuk mengganti indeks

`onSwitchIndex` dapat menerima nilai indeks apa pun dalam list untuk beralih ke file lain. Jika menggunakan `null` sebagai parameter untuk beralih, komponen pratinjau akan langsung ditutup.

```ts
onSwitchIndex(null);
```
