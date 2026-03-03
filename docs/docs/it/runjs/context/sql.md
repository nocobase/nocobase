:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` fornisce funzionalità di esecuzione e gestione SQL, comunemente utilizzate in RunJS (come JSBlock e flussi di eventi) per accedere direttamente al database. Supporta l'esecuzione di SQL temporaneo, l'esecuzione di template SQL salvati tramite ID, il binding dei parametri, le variabili di template (`{{ctx.xxx}}`) e il controllo del tipo di risultato.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock** | Report statistici personalizzati, liste con filtri complessi, query di aggregazione tra più tabelle. |
| **Blocco grafico** | Salvataggio di template SQL per alimentare le fonti dati dei grafici. |
| **Flusso di lavoro / Interazione** | Esecuzione di SQL predefiniti per recuperare dati da utilizzare nella logica successiva. |
| **SQLResource** | Utilizzato in combinazione con `ctx.initResource('SQLResource')` per scenari come liste paginate. |

> Nota: `ctx.sql` accede al database tramite l'API `flowSql`. Si assicuri che l'utente corrente disponga dei permessi di esecuzione per la fonte dati corrispondente.

## Descrizione dei permessi

| Permesso | Metodo | Descrizione |
|------|------|------|
| **Utente loggato** | `runById` | Esecuzione basata su un ID di template SQL già configurato. |
| **Permesso di configurazione SQL** | `run`, `save`, `destroy` | Esecuzione di SQL temporaneo, salvataggio/aggiornamento/eliminazione di template SQL. |

La logica frontend destinata agli utenti comuni dovrebbe utilizzare `ctx.sql.runById(uid, options)`. Quando è necessario SQL dinamico o la gestione dei template, si assicuri che il ruolo corrente disponga dei permessi di configurazione SQL.

## Definizione dei tipi

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Metodi comuni

| Metodo | Descrizione | Requisiti di permesso |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Esegue SQL temporaneo; supporta il binding dei parametri e le variabili di template. | Permesso di configurazione SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Salva o aggiorna un template SQL tramite ID per il riutilizzo. | Permesso di configurazione SQL |
| `ctx.sql.runById(uid, options?)` | Esegue un template SQL precedentemente salvato tramite il suo ID. | Qualsiasi utente loggato |
| `ctx.sql.destroy(uid)` | Elimina un template SQL specificato tramite ID. | Permesso di configurazione SQL |

Nota:

- `run` viene utilizzato per il debug SQL e richiede i permessi di configurazione.
- `save` e `destroy` vengono utilizzati per gestire i template SQL e richiedono i permessi di configurazione.
- `runById` è aperto agli utenti comuni; può solo eseguire template salvati e non può eseguire il debug o modificare l'SQL.
- Quando un template SQL viene modificato, è necessario chiamare `save` per rendere effettive le modifiche.

## Descrizione dei parametri

### options per run / runById

| Parametro | Tipo | Descrizione |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Variabili di binding. Forma a oggetto con i segnaposto `:name`, forma ad array con `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Tipo di risultato: più righe, riga singola o valore singolo. Predefinito `selectRows`. |
| `dataSourceKey` | `string` | Identificativo della fonte dati. Se non specificato, utilizza la fonte dati principale. |
| `filter` | `Record<string, any>` | Condizioni di filtraggio aggiuntive (a seconda del supporto dell'interfaccia). |

### options per save

| Parametro | Tipo | Descrizione |
|------|------|------|
| `uid` | `string` | Identificativo unico del template. Una volta salvato, può essere eseguito tramite `runById(uid, ...)`. |
| `sql` | `string` | Contenuto SQL. Supporta le variabili di template `{{ctx.xxx}}` e i segnaposto `:name` / `?`. |
| `dataSourceKey` | `string` | Opzionale. Identificativo della fonte dati. |

## Variabili di template SQL e binding dei parametri

### Variabili di template `{{ctx.xxx}}`

In SQL è possibile utilizzare `{{ctx.xxx}}` per fare riferimento a variabili di contesto, che verranno risolte nel loro valore effettivo prima dell'esecuzione:

```js
// Riferimento a ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Le fonti delle variabili referenziabili sono le stesse di `ctx.getVar()` (ad esempio `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` personalizzati, ecc.).

### Binding dei parametri

- **Parametri nominati**: Utilizzare `:name` in SQL e passare un oggetto `{ name: value }` in `bind`.
- **Parametri posizionali**: Utilizzare `?` in SQL e passare un array `[value1, value2]` in `bind`.

```js
// Parametri nominati
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Parametri posizionali
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Roma', 'active'], type: 'selectVar' }
);
```

## Esempi

### Esecuzione di SQL temporaneo (richiede permesso di configurazione SQL)

```js
// Risultato a più righe (predefinito)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Risultato a riga singola
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Risultato a valore singolo (es. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Utilizzo delle variabili di template

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Salvataggio e riutilizzo dei template

```js
// Salvataggio (richiede permesso di configurazione SQL)
await ctx.sql.save({
  uid: 'report-utenti-attivi',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Eseguibile da qualsiasi utente loggato
const users = await ctx.sql.runById('report-utenti-attivi', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Eliminazione del template (richiede permesso di configurazione SQL)
await ctx.sql.destroy('report-utenti-attivi');
```

### Lista paginata (SQLResource)

```js
// Quando sono necessari paginazione o filtri, è possibile utilizzare SQLResource
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID del template SQL salvato
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Include page, pageSize, ecc.
```

## Relazione con ctx.resource e ctx.request

| Scopo | Utilizzo consigliato |
|------|----------|
| **Eseguire query SQL** | `ctx.sql.run()` o `ctx.sql.runById()` |
| **Lista SQL paginata (Blocco)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Richiesta HTTP generica** | `ctx.request()` |

`ctx.sql` incapsula l'API `flowSql` ed è specializzato per scenari SQL; `ctx.request` può essere utilizzato per chiamare qualsiasi API.

## Note

- Utilizzare il binding dei parametri (`:name` / `?`) invece della concatenazione di stringhe per evitare SQL injection.
- `type: 'selectVar'` restituisce un valore scalare, solitamente utilizzato per `COUNT`, `SUM`, ecc.
- Le variabili di template `{{ctx.xxx}}` vengono risolte prima dell'esecuzione; si assicuri che le variabili corrispondenti siano definite nel contesto.

## Correlati

- [ctx.resource](./resource.md): Risorse dati; SQLResource chiama internamente l'API `flowSql`.
- [ctx.initResource()](./init-resource.md): Inizializza SQLResource per liste paginate, ecc.
- [ctx.request()](./request.md): Richieste HTTP generiche.