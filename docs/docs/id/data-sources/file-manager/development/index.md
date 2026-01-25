:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pengembangan Ekstensi

## Memperluas Tipe File Frontend

Untuk file yang sudah diunggah, antarmuka pengguna frontend dapat menampilkan konten pratinjau yang berbeda berdasarkan tipe file. Bidang lampiran pada pengelola file memiliki pratinjau file berbasis browser (tertanam dalam iframe) yang mendukung sebagian besar format file (seperti gambar, video, audio, dan PDF) untuk pratinjau langsung di browser. Ketika format file tidak didukung untuk pratinjau browser, atau jika ada kebutuhan interaksi pratinjau khusus, Anda dapat memperluas komponen pratinjau berdasarkan tipe file.

### Contoh

Misalnya, jika Anda ingin memperluas komponen carousel untuk file gambar, Anda dapat menggunakan kode berikut:

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

`attachmentFileTypes` adalah objek entri yang disediakan dalam paket `@nocobase/client` untuk memperluas tipe file. Gunakan metode `add` yang disediakannya untuk memperluas objek deskriptor tipe file.

Setiap tipe file harus mengimplementasikan metode `match()` untuk memeriksa apakah tipe file memenuhi persyaratan. Dalam contoh ini, metode yang disediakan oleh paket `mime-match` digunakan untuk memeriksa atribut `mimetype` file. Jika cocok dengan tipe `image/*`, maka dianggap sebagai tipe file yang perlu diproses. Jika tidak cocok, maka akan kembali ke penanganan tipe bawaan.

Properti `Previewer` pada objek deskriptor tipe adalah komponen yang digunakan untuk pratinjau. Ketika tipe file cocok, komponen ini akan dirender untuk pratinjau. Umumnya disarankan untuk menggunakan komponen tipe modal (seperti `<Modal />` dll.) sebagai kontainer dasar, kemudian menempatkan konten pratinjau dan interaktif ke dalam komponen tersebut untuk mengimplementasikan fungsionalitas pratinjau.

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

`attachmentFileTypes` adalah sebuah instance global, diimpor dari `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Mendaftarkan objek deskriptor tipe file baru ke pusat registrasi tipe file. Tipe objek deskriptor adalah `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metode pencocokan format file.

Parameter `file` yang diteruskan adalah objek data untuk file yang diunggah, berisi properti terkait yang dapat digunakan untuk penentuan tipe:

*   `mimetype`: Deskripsi mimetype
*   `extname`: Ekstensi file, termasuk tanda "."
*   `path`: Jalur penyimpanan relatif file
*   `url`: URL file

Nilai kembaliannya adalah tipe `boolean`, menunjukkan hasil kecocokan.

##### `Previewer`

Komponen React untuk pratinjau file.

Parameter Props yang diteruskan adalah:

*   `index`: Indeks file dalam daftar lampiran
*   `list`: Daftar lampiran
*   `onSwitchIndex`: Metode untuk mengganti indeks

`onSwitchIndex` dapat menerima nilai indeks apa pun dari `list` untuk beralih ke file lain. Jika `null` digunakan sebagai parameter untuk beralih, komponen pratinjau akan langsung ditutup.

```ts
onSwitchIndex(null);
```