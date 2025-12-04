:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Uw eerste blok-plugin schrijven

Voordat u begint, raden we u aan om eerst '[Uw eerste plugin schrijven](../plugin-development/write-your-first-plugin.md)' te lezen. Hierin leert u hoe u snel een basis-plugin maakt. Vervolgens gaan we hierop voortbouwen door een eenvoudige blok-functionaliteit toe te voegen.

## Stap 1: Het blokmodelbestand aanmaken

Maak een nieuw bestand aan in de plugin-map: `client/models/SimpleBlockModel.tsx`

## Stap 2: De inhoud van het model schrijven

Definieer en implementeer in dit bestand een basis blokmodel, inclusief de renderlogica:

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

## Stap 3: Het blokmodel registreren

Exporteer het zojuist aangemaakte model in het bestand `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Stap 4: Het blok activeren en uitproberen

Nadat u de plugin heeft ingeschakeld, ziet u de nieuwe optie **Hello block** in het keuzemenu 'Blok toevoegen'.

Demonstratie:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Stap 5: Configuratiemogelijkheden toevoegen aan het blok

Vervolgens voegen we configureerbare functionaliteit toe aan het blok via **Flow**, zodat gebruikers de inhoud van het blok direct in de interface kunnen bewerken.

Blijf het bestand `SimpleBlockModel.tsx` bewerken:

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

Demonstratie:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Samenvatting

Dit artikel heeft u laten zien hoe u een eenvoudige blok-plugin maakt, inclusief:

- Hoe u een blokmodel definieert en implementeert
- Hoe u een blokmodel registreert
- Hoe u configureerbare functionaliteit toevoegt aan een blok via Flow

Volledige broncode vindt u hier: [Voorbeeld van een eenvoudig blok](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)