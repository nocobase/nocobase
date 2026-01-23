:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Scrivere il Suo primo plugin di blocco

Prima di iniziare, Le consigliamo di leggere "[Scrivere il Suo primo plugin](../plugin-development/write-your-first-plugin.md)" per imparare a creare rapidamente un plugin di base. Successivamente, estenderemo questa base aggiungendo una semplice funzionalità di blocco.

## Passaggio 1: Creare il file del modello di blocco

Crei un nuovo file nella directory del plugin: `client/models/SimpleBlockModel.tsx`

## Passaggio 2: Scrivere il contenuto del modello

Definisca e implementi un modello di blocco di base nel file, inclusa la sua logica di rendering:

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

## Passaggio 3: Registrare il modello di blocco

Esporti il modello appena creato nel file `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Passaggio 4: Attivare e provare il blocco

Dopo aver abilitato il plugin, vedrà la nuova opzione **Hello block** nel menu a discesa "Aggiungi blocco".

Dimostrazione dell'effetto:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Passaggio 5: Aggiungere capacità di configurazione al blocco

Successivamente, aggiungeremo funzionalità configurabili al blocco tramite **Flow**, consentendo agli utenti di modificare il contenuto del blocco nell'interfaccia.

Continui a modificare il file `SimpleBlockModel.tsx`:

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

Dimostrazione dell'effetto:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Riepilogo

Questo articolo Le ha mostrato come creare un semplice plugin di blocco, includendo:

- Come definire e implementare un modello di blocco
- Come registrare un modello di blocco
- Come aggiungere funzionalità configurabili al blocco tramite Flow

Riferimento al codice sorgente completo: [Esempio di Blocco Semplice](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)