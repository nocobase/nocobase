:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Uw eerste plugin schrijven

Deze handleiding begeleidt u stap voor stap bij het maken van een blok-plugin die u op pagina's kunt gebruiken. Zo krijgt u inzicht in de basisstructuur en het ontwikkelproces van NocoBase plugins.

## Vereisten

Voordat u begint, moet u ervoor zorgen dat NocoBase succesvol is geïnstalleerd. Als dit nog niet het geval is, kunt u de volgende installatiehandleidingen raadplegen:

- [Installeren met create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Installeren vanuit Git-broncode](/get-started/installation/git)

Zodra de installatie is voltooid, kunt u officieel beginnen met het ontwikkelen van uw plugin.

## Stap 1: Maak een plugin-skelet via de CLI

Voer de volgende opdracht uit in de hoofdmap van de repository om snel een lege plugin te genereren:

```bash
yarn pm create @my-project/plugin-hello
```

Nadat de opdracht succesvol is uitgevoerd, worden de basisbestanden gegenereerd in de map `packages/plugins/@my-project/plugin-hello`. De standaardstructuur is als volgt:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Default export server-side plugin
     ├─ client                   # Client-side code location
     │  ├─ index.tsx             # Default exported client-side plugin class
     │  ├─ plugin.tsx            # Plugin entry (extends @nocobase/client Plugin)
     │  ├─ models                # Optional: frontend models (such as flow nodes)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Server-side code location
     │  ├─ index.ts              # Default exported server-side plugin class
     │  ├─ plugin.ts             # Plugin entry (extends @nocobase/server Plugin)
     │  ├─ collections           # Optional: server-side collections
     │  ├─ migrations            # Optional: data migrations
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Optional: multi-language
        ├─ en-US.json
        └─ zh-CN.json
```

Na het aanmaken kunt u de plugin-managerpagina in uw browser bezoeken (standaard-URL: http://localhost:13000/admin/settings/plugin-manager) om te controleren of de plugin in de lijst verschijnt.

## Stap 2: Implementeer een eenvoudig client-blok

Vervolgens voegen we een aangepast blokmodel toe aan de plugin om een welkomsttekst weer te geven.

1. **Maak een nieuw blokmodelbestand** `client/models/HelloBlockModel.tsx`:

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

2. **Registreer het blokmodel**. Bewerk `client/models/index.ts` om het nieuwe model te exporteren, zodat het door de frontend-runtime kan worden geladen:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Nadat u de code hebt opgeslagen, zou u hot-reload logs moeten zien in de terminaluitvoer als u een ontwikkelingsscript uitvoert.

## Stap 3: Activeer en test de plugin

U kunt de plugin inschakelen via de commandoregel of de interface:

- **Commandoregel**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Beheerinterface**: Ga naar de plugin-manager, zoek `@my-project/plugin-hello` en klik op "Activeren".

Na activering maakt u een nieuwe "Modern page (v2)" aan. Wanneer u blokken toevoegt, ziet u "Hello block". Voeg dit in de pagina in om de welkomstinhoud te zien die u zojuist hebt geschreven.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Stap 4: Bouwen en verpakken

Wanneer u de plugin wilt distribueren naar andere omgevingen, moet u deze eerst bouwen en vervolgens verpakken:

```bash
yarn build @my-project/plugin-hello --tar
# Of voer in twee stappen uit
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Tip: Als de plugin is aangemaakt in de bronrepository, zal de eerste build een volledige typecontrole van de repository activeren, wat enige tijd kan duren. Het wordt aanbevolen om ervoor te zorgen dat de afhankelijkheden zijn geïnstalleerd en dat de repository in een bouwbare staat verkeert.

Nadat de build is voltooid, bevindt het pakketbestand zich standaard in `storage/tar/@my-project/plugin-hello.tar.gz`.

## Stap 5: Uploaden naar een andere NocoBase-applicatie

Upload en pak het uit naar de `./storage/plugins` map van de doelapplicatie. Voor meer details, zie [Plugins installeren en upgraden](../get-started/install-upgrade-plugins.mdx).