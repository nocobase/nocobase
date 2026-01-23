:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Scrivere il Suo primo plugin

Questa guida La accompagnerà nella creazione di un plugin a blocchi utilizzabile nelle pagine, partendo da zero. L'obiettivo è aiutarLa a comprendere la struttura di base e il flusso di sviluppo dei plugin NocoBase.

## Prerequisiti

Prima di iniziare, si assicuri di aver installato NocoBase correttamente. Se non lo ha ancora fatto, può consultare le seguenti guide all'installazione:

- [Installazione tramite create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Installazione da codice sorgente Git](/get-started/installation/git)

Una volta completata l'installazione, potrà iniziare ufficialmente il Suo percorso di sviluppo plugin.

## Passaggio 1: Creare lo scheletro del plugin tramite CLI

Esegua il seguente comando nella directory radice del repository per generare rapidamente un plugin vuoto:

```bash
yarn pm create @my-project/plugin-hello
```

Dopo l'esecuzione del comando, verranno generati i file di base nella directory `packages/plugins/@my-project/plugin-hello`. La struttura predefinita è la seguente:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Esporta il plugin lato server predefinito
     ├─ client                   # Posizione del codice lato client
     │  ├─ index.tsx             # Classe plugin lato client esportata per impostazione predefinita
     │  ├─ plugin.tsx            # Punto di ingresso del plugin (estende @nocobase/client Plugin)
     │  ├─ models                # Opzionale: modelli frontend (ad esempio, nodi di flusso)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Posizione del codice lato server
     │  ├─ index.ts              # Classe plugin lato server esportata per impostazione predefinita
     │  ├─ plugin.ts             # Punto di ingresso del plugin (estende @nocobase/server Plugin)
     │  ├─ collections           # Opzionale: collezioni lato server
     │  ├─ migrations            # Opzionale: migrazioni di dati
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Opzionale: multilingua
        ├─ en-US.json
        └─ zh-CN.json
```

Dopo la creazione, può accedere alla pagina del gestore dei plugin nel Suo browser (URL predefinito: http://localhost:13000/admin/settings/plugin-manager) per verificare che il plugin sia presente nell'elenco.

## Passaggio 2: Implementare un semplice blocco client

Successivamente, aggiungeremo un modello di blocco personalizzato al plugin per visualizzare un messaggio di benvenuto.

1. **Creare un nuovo file per il modello di blocco** `client/models/HelloBlockModel.tsx`:

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

2. **Registrare il modello di blocco**. Modifichi `client/models/index.ts` per esportare il nuovo modello, in modo che possa essere caricato dal runtime frontend:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Dopo aver salvato il codice, se sta eseguendo uno script di sviluppo, dovrebbe vedere i log di hot-reload nell'output del terminale.

## Passaggio 3: Attivare e testare il plugin

Può abilitare il plugin tramite riga di comando o interfaccia:

- **Riga di comando**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Interfaccia di gestione**: Acceda al gestore dei plugin, trovi `@my-project/plugin-hello` e clicchi su "Attiva".

Dopo l'attivazione, crei una nuova pagina "Modern page (v2)". Quando aggiunge i blocchi, vedrà "Hello block". Lo inserisca nella pagina per visualizzare il contenuto di benvenuto che ha appena scritto.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Passaggio 4: Compilazione e impacchettamento

Quando è pronto a distribuire il plugin in altri ambienti, deve prima compilarlo e poi impacchettarlo:

```bash
yarn build @my-project/plugin-hello --tar
# Oppure esegua in due passaggi
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> **Nota**: Se il plugin è stato creato nel repository del codice sorgente, la prima compilazione attiverà un controllo completo dei tipi dell'intero repository, il che potrebbe richiedere del tempo. Si consiglia di assicurarsi che le dipendenze siano installate e che il repository sia in uno stato compilabile.

Una volta completata la compilazione, il file impacchettato si troverà per impostazione predefinita in `storage/tar/@my-project/plugin-hello.tar.gz`.

## Passaggio 5: Caricare su un'altra applicazione NocoBase

Carichi ed estragga il file nella directory `./storage/plugins` dell'applicazione di destinazione. Per maggiori dettagli, consulti [Installare e aggiornare i plugin](../get-started/install-upgrade-plugins.mdx).