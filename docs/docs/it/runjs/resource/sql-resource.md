:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/resource/sql-resource).
:::

# SQLResource

Una Resource per l'esecuzione di query basate su **configurazioni SQL salvate** o **SQL dinamico**, con dati provenienti da interfacce come `flowSql:run` / `flowSql:runById`. È adatta per report, statistiche, elenchi SQL personalizzati e altri scenari. A differenza di [MultiRecordResource](./multi-record-resource.md), SQLResource non dipende dalle collezioni; esegue direttamente le query SQL e supporta la paginazione, il binding dei parametri, le variabili di template (`{{ctx.xxx}}`) e il controllo del tipo di risultato.

**Ereditarietà**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Modalità di creazione**: `ctx.makeResource('SQLResource')` o `ctx.initResource('SQLResource')`. Per l'esecuzione basata su una configurazione salvata, utilizzi `setFilterByTk(uid)` (l'UID del template SQL); per il debug, utilizzi `setDebug(true)` + `setSQL(sql)` per eseguire direttamente l'SQL. In RunJS, `ctx.api` viene iniettato dall'ambiente di esecuzione.

---

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **Report / Statistiche** | Aggregazioni complesse, query tra più tabelle e metriche statistiche personalizzate. |
| **Elenchi personalizzati JSBlock** | Implementazione di filtri, ordinamenti o associazioni speciali tramite SQL con rendering personalizzato. |
| **Blocchi diagramma** | Gestione delle fonti dati dei grafici tramite template SQL salvati, con supporto alla paginazione. |
| **Scelta tra SQLResource e ctx.sql** | Utilizzi SQLResource quando sono necessari paginazione, eventi o dati reattivi; utilizzi `ctx.sql.run()` / `ctx.sql.runById()` per semplici query una tantum. |

---

## Formato dei dati

- `getData()` restituisce formati diversi in base a `setSQLType()`:
  - `selectRows` (predefinito): **Array**, risultati di più righe.
  - `selectRow`: **Oggetto singolo**.
  - `selectVar`: **Valore scalare** (es. COUNT, SUM).
- `getMeta()` restituisce metadati come la paginazione: `page`, `pageSize`, `count`, `totalPage`, ecc.

---

## Configurazione SQL e modalità di esecuzione

| Metodo | Descrizione |
|------|------|
| `setFilterByTk(uid)` | Imposta l'UID del template SQL da eseguire (corrisponde a `runById`; deve essere prima salvato nell'interfaccia di amministrazione). |
| `setSQL(sql)` | Imposta l'SQL grezzo (utilizzato per `runBySQL` solo quando la modalità debug `setDebug(true)` è attiva). |
| `setSQLType(type)` | Tipo di risultato: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Se impostato su `true`, `refresh` chiama `runBySQL()`; altrimenti, chiama `runById()`. |
| `run()` | Chiama `runBySQL()` o `runById()` in base allo stato di debug. |
| `runBySQL()` | Esegue utilizzando l'SQL definito in `setSQL` (richiede `setDebug(true)`). |
| `runById()` | Esegue il template SQL salvato utilizzando l'UID corrente. |

---

## Parametri e Contesto

| Metodo | Descrizione |
|------|------|
| `setBind(bind)` | Associa le variabili. Utilizzi un oggetto per i segnaposto `:name` o un array per i segnaposto `?`. |
| `setLiquidContext(ctx)` | Contesto del template (Liquid), utilizzato per analizzare `{{ctx.xxx}}`. |
| `setFilter(filter)` | Condizioni di filtro aggiuntive (passate nei dati della richiesta). |
| `setDataSourceKey(key)` | Identificatore della fonte dati (utilizzato in ambienti con più fonti dati). |

---

## Paginazione

| Metodo | Descrizione |
|------|------|
| `setPage(page)` / `getPage()` | Pagina corrente (predefinita è 1). |
| `setPageSize(size)` / `getPageSize()` | Elementi per pagina (predefinito è 20). |
| `next()` / `previous()` / `goto(page)` | Naviga tra le pagine e attiva il `refresh`. |

In SQL, può utilizzare `{{ctx.limit}}` e `{{ctx.offset}}` per fare riferimento ai parametri di paginazione. SQLResource inietta automaticamente `limit` e `offset` nel contesto.

---

## Recupero dati ed eventi

| Metodo | Descrizione |
|------|------|
| `refresh()` | Esegue l'SQL (`runById` o `runBySQL`), scrive il risultato in `setData(data)`, aggiorna i meta e attiva l'evento `'refresh'`. |
| `runAction(actionName, options)` | Chiama le azioni sottostanti (es. `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Attivato al completamento dell'aggiornamento o all'inizio del caricamento. |

---

## Esempi

### Esecuzione tramite template salvato (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID del template SQL salvato
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, ecc.
```

### Modalità Debug: Esecuzione diretta di SQL (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Paginazione e navigazione

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigazione
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Tipi di risultato

```js
// Righe multiple (predefinito)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Riga singola
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Valore singolo (es. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Utilizzo delle variabili di template

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Ascolto dell'evento refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Note

- **runById richiede prima il salvataggio del template**: L'UID utilizzato in `setFilterByTk(uid)` deve essere l'ID di un template SQL già salvato nell'interfaccia di amministrazione. Può salvarlo tramite `ctx.sql.save({ uid, sql })`.
- **La modalità debug richiede permessi**: `setDebug(true)` utilizza `flowSql:run`, che richiede che il ruolo corrente disponga dei permessi di configurazione SQL. `runById` richiede solo che l'utente sia autenticato.
- **Debouncing del Refresh**: Chiamate multiple a `refresh()` all'interno dello stesso ciclo di eventi eseguiranno solo l'ultima per evitare richieste ridondanti.
- **Binding dei parametri per la prevenzione delle iniezioni**: Utilizzi `setBind()` con i segnaposto `:name` o `?` invece della concatenazione di stringhe per prevenire la SQL injection.

---

## Correlati

- [ctx.sql](../context/sql.md) - Esecuzione e gestione SQL; `ctx.sql.runById` è adatto per semplici query una tantum.
- [ctx.resource](../context/resource.md) - L'istanza della risorsa nel contesto corrente.
- [ctx.initResource()](../context/init-resource.md) - Inizializza e associa a `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Crea una nuova istanza di risorsa senza associazione.
- [APIResource](./api-resource.md) - Risorsa API generale.
- [MultiRecordResource](./multi-record-resource.md) - Progettato per collezioni ed elenchi.