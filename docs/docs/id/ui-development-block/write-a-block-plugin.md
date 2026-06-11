---
title: "Menulis Plugin Block Pertama"
description: "Pengembangan Block Extension NocoBase: menulis plugin Block pertama"
keywords: "write,a,block,plugin,NocoBase"
---

# Menulis Plugin Block Pertama

Sebelum memulai, disarankan membaca "[Menulis Plugin Pertama](../plugin-development/write-your-first-plugin.md)" terlebih dahulu, untuk memahami cara membuat plugin dasar dengan cepat. Selanjutnya, kita akan extend fitur Block sederhana berdasarkan dasar tersebut.

## Langkah 1: Membuat File Block Model

Buat file di direktori plugin: `client/models/SimpleBlockModel.tsx`

## Langkah 2: Menulis Konten Model

Definisikan dan implementasikan base block model di file, termasuk logika rendering-nya:

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

## Langkah 3: Mendaftarkan Block Model

Export model yang baru dibuat di file `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Langkah 4: Mengaktifkan dan Mencoba Block

Setelah plugin diaktifkan, di dropdown menu "Add Block", Anda akan melihat opsi Block **Hello block** yang baru ditambahkan.

Demo:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Langkah 5: Menambahkan Kemampuan Konfigurasi pada Block

Selanjutnya, kita akan menambahkan fitur yang dapat dikonfigurasi pada Block melalui **Flow**, sehingga user dapat mengedit konten Block di antarmuka.

Lanjutkan mengedit file `SimpleBlockModel.tsx`:

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

Demo:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Ringkasan

Artikel ini memperkenalkan cara membuat plugin Block sederhana, termasuk:

- Cara mendefinisikan dan mengimplementasikan block model
- Cara mendaftarkan block model
- Cara menambahkan fitur yang dapat dikonfigurasi pada Block melalui Flow

Referensi kode sumber lengkap: [Contoh Simple Block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)
