:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Collezioni

Nello sviluppo di plugin NocoBase, la **Collezione (tabella dati)** è uno dei concetti fondamentali. È possibile aggiungere o modificare le strutture delle tabelle dati nei plugin definendo o estendendo le Collezioni. A differenza delle tabelle dati create tramite l'interfaccia di gestione delle fonti dati, le **Collezioni definite nel codice sono solitamente tabelle di metadati a livello di sistema** e non appariranno nell'elenco di gestione delle fonti dati.

## Definire le Collezioni

Seguendo la struttura di directory convenzionale, i file delle Collezioni dovrebbero essere collocati nella directory `./src/server/collections`. Utilizzi `defineCollection()` per creare nuove tabelle e `extendCollection()` per estendere quelle esistenti.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Articoli di esempio',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Titolo', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Contenuto' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autore' },
    },
  ],
});
```

Nell'esempio precedente:

- `name`: Nome della tabella (una tabella con lo stesso nome verrà generata automaticamente nel database).
- `title`: Nome visualizzato della tabella nell'interfaccia.
- `fields`: Collezione di campi, ogni campo contiene attributi come `type`, `name` e altri.

Quando ha bisogno di aggiungere campi o modificare configurazioni per le Collezioni di altri plugin, può utilizzare `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Dopo aver attivato il plugin, il sistema aggiungerà automaticamente il campo `isPublished` alla tabella `articles` esistente.

:::tip
La directory convenzionale completerà il caricamento prima dell'esecuzione di tutti i metodi `load()` dei plugin, evitando così problemi di dipendenza causati dal mancato caricamento di alcune tabelle dati.
:::

## Sincronizzare la Struttura del Database

Quando un plugin viene attivato per la prima volta, il sistema sincronizzerà automaticamente le configurazioni delle Collezioni con la struttura del database. Se il plugin è già installato e in esecuzione, dopo aver aggiunto o modificato le Collezioni, dovrà eseguire manualmente il comando di aggiornamento:

```bash
yarn nocobase upgrade
```

Se si verificano eccezioni o dati non validi durante la sincronizzazione, può ricostruire la struttura della tabella reinstallando l'applicazione:

```bash
yarn nocobase install -f
```

## Generazione Automatica di Risorse

Dopo aver definito una Collezione, il sistema genererà automaticamente una Risorsa corrispondente, sulla quale potrà eseguire direttamente operazioni CRUD tramite API. Per maggiori dettagli, consulti [Gestione delle Risorse](./resource-manager.md).