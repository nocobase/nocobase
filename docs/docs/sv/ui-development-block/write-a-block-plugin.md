:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Skapa ditt första block-plugin

Innan du börjar rekommenderar vi att du läser "[Skapa ditt första plugin](../plugin-development/write-your-first-plugin.md)" för att lära dig hur du snabbt skapar ett grundläggande plugin. Därefter kommer vi att utöka det med en enkel block-funktion.

## Steg 1: Skapa blockmodellfilen

Skapa en ny fil i plugin-katalogen: `client/models/SimpleBlockModel.tsx`

## Steg 2: Skriv modellinnehållet

Definiera och implementera en grundläggande blockmodell i filen, inklusive dess renderingslogik:

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

## Steg 3: Registrera blockmodellen

Exportera den nyskapade modellen i filen `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Steg 4: Aktivera och upplev blocket

Efter att du har aktiverat pluginet kommer du att se det nya alternativet **Hello block** i rullgardinsmenyn "Lägg till block".

Demostration:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Steg 5: Lägg till konfigurationsmöjligheter för blocket

Därefter lägger vi till konfigurerbar funktionalitet till blocket via **Flow**, vilket gör att användare kan redigera blockets innehåll direkt i gränssnittet.

Fortsätt att redigera filen `SimpleBlockModel.tsx`:

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

Demostration:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Sammanfattning

Denna artikel har beskrivit hur du skapar ett enkelt block-plugin, inklusive:

- Hur du definierar och implementerar en blockmodell
- Hur du registrerar en blockmodell
- Hur du lägger till konfigurerbar funktionalitet via Flow för blocket

Fullständig källkod finns här: [Exempel på enkelt block](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)