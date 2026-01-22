:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# ResourceManager

La funzionalità di gestione delle risorse di NocoBase converte automaticamente le `collezioni` e le associazioni esistenti in risorse, e include diversi tipi di operazioni predefinite per aiutare gli sviluppatori a costruire rapidamente operazioni sulle risorse REST API. A differenza delle REST API tradizionali, le operazioni sulle risorse di NocoBase non dipendono dai metodi di richiesta HTTP, ma determinano l'operazione specifica da eseguire tramite la definizione esplicita di `:action`.

## Generazione automatica delle risorse

NocoBase converte automaticamente le `collezioni` e le associazioni definite nel database in risorse. Ad esempio, definendo due `collezioni`, `posts` e `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Questo genererà automaticamente le seguenti risorse:

*   risorsa `posts`
*   risorsa `tags`
*   risorsa di associazione `posts.tags`

Esempi di richiesta:

| Metodo   | Percorso                     | Operazione            |
| -------- | ---------------------------- | --------------------- |
| `GET`    | `/api/posts:list`            | Interroga lista       |
| `GET`    | `/api/posts:get/1`           | Interroga singolo     |
| `POST`   | `/api/posts:create`          | Crea                  |
| `POST`   | `/api/posts:update/1`        | Aggiorna              |
| `POST`   | `/api/posts:destroy/1`       | Elimina               |

| Metodo   | Percorso                     | Operazione            |
| -------- | ---------------------------- | --------------------- |
| `GET`    | `/api/tags:list`             | Interroga lista       |
| `GET`    | `/api/tags:get/1`            | Interroga singolo     |
| `POST`   | `/api/tags:create`           | Crea                  |
| `POST`   | `/api/tags:update/1`         | Aggiorna              |
| `POST`   | `/api/tags:destroy/1`        | Elimina               |

| Metodo   | Percorso                             | Operazione                                    |
| -------- | ------------------------------------ | --------------------------------------------- |
| `GET`    | `/api/posts/1/tags:list`             | Interroga tutti i `tags` associati a un `post` |
| `GET`    | `/api/posts/1/tags:get/1`            | Interroga un singolo `tag` sotto un `post`    |
| `POST`   | `/api/posts/1/tags:create`           | Crea un singolo `tag` sotto un `post`         |
| `POST`   | `/api/posts/1/tags:update/1`         | Aggiorna un singolo `tag` sotto un `post`     |
| `POST`   | `/api/posts/1/tags:destroy/1`        | Elimina un singolo `tag` sotto un `post`      |
| `POST`   | `/api/posts/1/tags:add`              | Aggiungi `tags` associati a un `post`         |
| `POST`   | `/api/posts/1/tags:remove`           | Rimuovi `tags` associati da un `post`         |
| `POST`   | `/api/posts/1/tags:set`              | Imposta tutti i `tags` associati per un `post` |
| `POST`   | `/api/posts/1/tags:toggle`           | Attiva/disattiva l'associazione dei `tags` per un `post` |

:::tip Suggerimento

Le operazioni sulle risorse di NocoBase non dipendono direttamente dai metodi di richiesta, ma determinano le operazioni tramite definizioni esplicite di `:action`.

:::

## Operazioni sulle risorse

NocoBase offre una vasta gamma di tipi di operazioni predefinite per soddisfare le diverse esigenze aziendali.

### Operazioni CRUD di base

| Nome Operazione    | Descrizione                             | Tipi di Risorse Applicabili | Metodo di Richiesta | Percorso di Esempio                |
| ------------------ | --------------------------------------- | --------------------------- | ------------------- | ---------------------------------- |
| `list`             | Interroga dati di lista                 | Tutte                       | GET/POST            | `/api/posts:list`                  |
| `get`              | Interroga singolo dato                  | Tutte                       | GET/POST            | `/api/posts:get/1`                 |
| `create`           | Crea nuovo record                       | Tutte                       | POST                | `/api/posts:create`                |
| `update`           | Aggiorna record                         | Tutte                       | POST                | `/api/posts:update/1`              |
| `destroy`          | Elimina record                          | Tutte                       | POST                | `/api/posts:destroy/1`             |
| `firstOrCreate`    | Trova il primo record, crealo se non esiste | Tutte                       | POST                | `/api/users:firstOrCreate`         |
| `updateOrCreate`   | Aggiorna il record, crealo se non esiste    | Tutte                       | POST                | `/api/users:updateOrCreate`        |

### Operazioni sulle relazioni

| Nome Operazione | Descrizione               | Tipi di Relazioni Applicabili                     | Percorso di Esempio                   |
| --------------- | ------------------------- | ------------------------------------------------- | ------------------------------------- |
| `add`           | Aggiungi associazione     | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`               |
| `remove`        | Rimuovi associazione      | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove`        |
| `set`           | Reimposta associazione    | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`           |
| `toggle`        | Aggiungi o rimuovi associazione | `belongsToMany`                                   | `/api/posts/1/tags:toggle`            |

### Parametri delle operazioni

I parametri operativi comuni includono:

*   `filter`: Condizioni di query
*   `values`: Valori da impostare
*   `fields`: Specifica i campi da restituire
*   `appends`: Include dati associati
*   `except`: Esclude i campi
*   `sort`: Regole di ordinamento
*   `page`, `pageSize`: Parametri di paginazione
*   `paginate`: Abilita la paginazione
*   `tree`: Restituisce la struttura ad albero
*   `whitelist`, `blacklist`: Whitelist/blacklist dei campi
*   `updateAssociationValues`: Aggiorna i valori di associazione

## Operazioni sulle risorse personalizzate

NocoBase consente di registrare operazioni aggiuntive per le risorse esistenti. Può utilizzare `registerActionHandlers` per personalizzare le operazioni per tutte le risorse o per risorse specifiche.

### Registrare Operazioni Globali

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Registrare Operazioni Specifiche per le Risorse

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Esempi di richiesta:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Regola di denominazione: `resourceName:actionName`. Utilizzi la sintassi con il punto (`posts.comments`) quando include le associazioni.

## Risorse personalizzate

Se ha bisogno di fornire risorse non correlate alle `collezioni`, può utilizzare il metodo `resourceManager.define` per definirle:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

I metodi di richiesta sono coerenti con le risorse generate automaticamente:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (supporta GET/POST per impostazione predefinita)

## Middleware personalizzato

Utilizzi il metodo `resourceManager.use()` per registrare un middleware globale. Ad esempio:

Middleware di logging globale

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Proprietà speciali del Context

Poter accedere al middleware o all'azione del livello `resourceManager` implica che la risorsa deve esistere.

### ctx.action

*   `ctx.action.actionName`: Nome dell'operazione
*   `ctx.action.resourceName`: Può essere una `collezione` o un'associazione
*   `ctx.action.params`: Parametri dell'operazione

### ctx.dataSource

L'oggetto `fonte dati` corrente.

### ctx.getCurrentRepository()

L'oggetto repository corrente.

## Come ottenere gli oggetti resourceManager per diverse fonti dati

`resourceManager` appartiene a una `fonte dati`, e le operazioni possono essere registrate separatamente per diverse `fonti dati`.

### Fonte dati principale

Per la `fonte dati` principale, può utilizzare direttamente `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Altre fonti dati

Per le altre `fonti dati`, può ottenere un'istanza specifica della `fonte dati` tramite `dataSourceManager` e utilizzare il `resourceManager` di tale istanza per le operazioni:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterare tutte le fonti dati

Se ha bisogno di eseguire le stesse operazioni su tutte le `fonti dati` aggiunte, può utilizzare il metodo `dataSourceManager.afterAddDataSource` per iterare, assicurandosi che il `resourceManager` di ogni `fonte dati` possa registrare le operazioni corrispondenti:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```