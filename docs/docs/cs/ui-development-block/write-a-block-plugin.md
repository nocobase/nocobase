:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vytvořte svůj první blokový plugin

Než začnete, doporučujeme si přečíst „[Vytvořte svůj první plugin](../plugin-development/write-your-first-plugin.md)“, abyste se dozvěděli, jak rychle vytvořit základní plugin. Dále jej rozšíříme o jednoduchou funkci bloku.

## Krok 1: Vytvořte soubor modelu bloku

V adresáři pluginu vytvořte nový soubor: `client/models/SimpleBlockModel.tsx`

## Krok 2: Napište obsah modelu

V souboru definujte a implementujte základní model bloku, včetně jeho logiky vykreslování:

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

## Krok 3: Zaregistrujte model bloku

V souboru `client/models/index.ts` exportujte nově vytvořený model:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Krok 4: Aktivujte a vyzkoušejte blok

Po aktivaci pluginu uvidíte v rozbalovací nabídce „Přidat blok“ novou možnost **Hello block**.

Ukázka efektu:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Krok 5: Přidejte bloku možnost konfigurace

Dále přidáme bloku konfigurovatelnou funkcionalitu pomocí **pracovního postupu**, což uživatelům umožní upravovat obsah bloku přímo v rozhraní.

Pokračujte v úpravách souboru `SimpleBlockModel.tsx`:

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

Ukázka efektu:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Shrnutí

Tento článek představil, jak vytvořit jednoduchý blokový plugin, včetně:

- Jak definovat a implementovat model bloku
- Jak zaregistrovat model bloku
- Jak přidat konfigurovatelnou funkcionalitu bloku pomocí pracovního postupu

Kompletní zdrojový kód naleznete zde: [Příklad jednoduchého bloku](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)