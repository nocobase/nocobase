:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menulis Plugin Blok Pertama Anda

Sebelum memulai, disarankan untuk membaca "[Menulis Plugin Pertama Anda](../plugin-development/write-your-first-plugin.md)" untuk memahami cara cepat membuat plugin dasar. Selanjutnya, kita akan mengembangkan fungsionalitas **blok** sederhana berdasarkan itu.

## Langkah 1: Membuat Berkas Model Blok

Buat berkas baru di direktori plugin: `client/models/SimpleBlockModel.tsx`

## Langkah 2: Menulis Konten Model

Definisikan dan implementasikan model blok dasar dalam berkas, termasuk logika *rendering*-nya:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Langkah 3: Mendaftarkan Model Blok

Ekspor model yang baru dibuat di berkas `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Langkah 4: Mengaktifkan dan Mencoba Blok

Setelah mengaktifkan plugin, Anda akan melihat opsi **Hello block** yang baru ditambahkan di menu *dropdown* "Tambah Blok".

Demonstrasi efek:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Langkah 5: Menambahkan Kemampuan Konfigurasi ke Blok

Selanjutnya, kita akan menambahkan fungsionalitas yang dapat dikonfigurasi ke blok melalui **Alur** (Flow), memungkinkan pengguna untuk mengedit konten blok di antarmuka.

Lanjutkan mengedit berkas `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Demonstrasi efek:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Ringkasan

Artikel ini menjelaskan cara membuat plugin blok sederhana, meliputi:

- Cara mendefinisikan dan mengimplementasikan model blok
- Cara mendaftarkan model blok
- Cara menambahkan fungsionalitas yang dapat dikonfigurasi ke blok melalui Alur (Flow)

Referensi kode sumber lengkap: [Contoh Blok Sederhana](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)