:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Skapa din första plugin

Den här guiden tar dig igenom hur du skapar en block-plugin från grunden som kan användas på sidor. Den hjälper dig att förstå den grundläggande strukturen och utvecklingsprocessen för NocoBase-plugins.

## Förutsättningar

Innan du börjar, se till att du har installerat NocoBase framgångsrikt. Om du inte har gjort det kan du läsa följande installationsguider:

- [Installera med create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Installera från Git-källkod](/get-started/installation/git)

När installationen är klar kan du officiellt påbörja din resa med plugin-utveckling.

## Steg 1: Skapa plugin-skelett via CLI

Kör följande kommando i rotkatalogen för ditt repository för att snabbt generera en tom plugin:

```bash
yarn pm create @my-project/plugin-hello
```

När kommandot har körts framgångsrikt kommer grundläggande filer att genereras i katalogen `packages/plugins/@my-project/plugin-hello`. Standardstrukturen är följande:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Standardexport för server-side plugin
     ├─ client                   # Plats för klient-sidekod
     │  ├─ index.tsx             # Standardexporterad klient-side plugin-klass
     │  ├─ plugin.tsx            # Plugin-ingång (ärver @nocobase/client Plugin)
     │  ├─ models                # Valfritt: frontend-modeller (t.ex. flödesnoder)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Plats för server-sidekod
     │  ├─ index.ts              # Standardexporterad server-side plugin-klass
     │  ├─ plugin.ts             # Plugin-ingång (ärver @nocobase/server Plugin)
     │  ├─ collections           # Valfritt: server-side samlingar
     │  ├─ migrations            # Valfritt: datamigreringar
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Valfritt: flerspråkighet
        ├─ en-US.json
        └─ zh-CN.json
```

Efter att pluginen har skapats kan du öppna plugin-hanteraren i din webbläsare (standardadress: http://localhost:13000/admin/settings/plugin-manager) för att bekräfta att pluginen visas i listan.

## Steg 2: Implementera ett enkelt klient-block

Därefter lägger vi till en anpassad block-modell till pluginen för att visa ett välkomstmeddelande.

1. **Skapa en ny block-modellfil** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Registrera block-modellen**. Redigera `client/models/index.ts` för att exportera den nya modellen för att laddas av frontend-runtime:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Efter att du har sparat koden, om du kör ett utvecklingsskript, bör du se loggar för hot-reload i terminalutgången.

## Steg 3: Aktivera och testa pluginen

Du kan aktivera pluginen via kommandoraden eller gränssnittet:

- **Kommandorad**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Administrationsgränssnitt**: Gå till plugin-hanteraren, hitta `@my-project/plugin-hello` och klicka på ”Aktivera”.

Efter aktivering, skapa en ny sida ”Modern page (v2)”. När du lägger till block kommer du att se ”Hello block”. Infoga det på sidan för att se välkomstinnehållet du just skrev.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Steg 4: Bygg och paketera

När du är redo att distribuera pluginen till andra miljöer måste du först bygga och paketera den:

```bash
yarn build @my-project/plugin-hello --tar
# Eller kör i två steg
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Tips: Om pluginen skapas i källkodsrepositoryt kommer den första byggningen att utlösa en fullständig typkontroll av hela repositoryt, vilket kan ta en stund. Det rekommenderas att säkerställa att beroenden är installerade och att repositoryt är i ett byggbart tillstånd.

När byggningen är klar finns paketeringsfilen som standard i `storage/tar/@my-project/plugin-hello.tar.gz`.

## Steg 5: Ladda upp till en annan NocoBase-applikation

Ladda upp och packa upp till målapplikationens `./storage/plugins`-katalog. För mer information, se [Installera och uppgradera plugins](../get-started/install-upgrade-plugins.mdx).