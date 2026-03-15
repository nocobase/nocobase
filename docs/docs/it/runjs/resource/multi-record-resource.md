:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Una Resource orientata alle collezioni (tabelle dati): le richieste restituiscono un array e supportano la paginazione, il filtraggio, l'ordinamento e le operazioni CRUD. È adatta per scenari con "record multipli" come tabelle e liste. A differenza di [APIResource](./api-resource.md), MultiRecordResource specifica il nome della risorsa tramite `setResourceName()`, costruisce automaticamente URL come `users:list` e `users:create`, e include funzionalità integrate per la paginazione, il filtraggio e la selezione delle righe.

**Ereditarietà**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Creazione**: `ctx.makeResource('MultiRecordResource')` o `ctx.initResource('MultiRecordResource')`. Prima dell'uso, è necessario chiamare `setResourceName('nome_collezione')` (ad esempio, `'users'`); in RunJS, `ctx.api` viene iniettato dall'ambiente di esecuzione.

---

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **Blocchi tabella** | I blocchi tabella e lista utilizzano MultiRecordResource per impostazione predefinita, supportando paginazione, filtraggio e ordinamento. |
| **Liste JSBlock** | Caricare dati da collezioni come utenti o ordini in un JSBlock ed eseguire un rendering personalizzato. |
| **Operazioni massive** | Utilizzare `getSelectedRows()` per ottenere le righe selezionate e `destroySelectedRows()` per l'eliminazione massiva. |
| **Risorse associate** | Caricare collezioni associate utilizzando formati come `users.tags`, il che richiede l'uso di `setSourceId(parentRecordId)`. |

---

## Formato dei dati

- `getData()` restituisce un **array di record**, ovvero il campo `data` della risposta API della lista.
- `getMeta()` restituisce i metadati della paginazione e altro: `page`, `pageSize`, `count`, `totalPage`, ecc.

---

## Nome della risorsa e fonte dati

| Metodo | Descrizione |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Il nome della risorsa, ad es. `'users'`, `'users.tags'` (risorsa associata). |
| `setSourceId(id)` / `getSourceId()` | L'ID del record genitore per le risorse associate (ad es. per `users.tags`, passare la chiave primaria dell'utente). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identificatore della fonte dati (utilizzato in scenari con più fonti dati). |

---

## Parametri di richiesta (Filtro / Campi / Ordinamento)

| Metodo | Descrizione |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filtro per chiave primaria (per `get` di un singolo record, ecc.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Condizioni di filtro, supporta operatori come `$eq`, `$ne`, `$in`, ecc. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Gruppi di filtri (per combinare più condizioni). |
| `setFields(fields)` / `getFields()` | Campi richiesti (whitelist). |
| `setSort(sort)` / `getSort()` | Ordinamento, ad es. `['-createdAt']` per l'ordine decrescente in base alla data di creazione. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Caricamento delle associazioni (ad es. `['user', 'tags']`). |

---

## Paginazione

| Metodo | Descrizione |
|------|------|
| `setPage(page)` / `getPage()` | Pagina corrente (a partire da 1). |
| `setPageSize(size)` / `getPageSize()` | Numero di elementi per pagina, il valore predefinito è 20. |
| `getTotalPage()` | Numero totale di pagine. |
| `getCount()` | Numero totale di record (dai metadati lato server). |
| `next()` / `previous()` / `goto(page)` | Cambia pagina e attiva il `refresh`. |

---

## Righe selezionate (Scenari tabella)

| Metodo | Descrizione |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Dati delle righe attualmente selezionate, utilizzati per l'eliminazione massiva e altre operazioni. |

---

## Operazioni CRUD e di lista

| Metodo | Descrizione |
|------|------|
| `refresh()` | Richiede la lista con i parametri correnti, aggiorna `getData()` e i metadati di paginazione, e attiva l'evento `'refresh'`. |
| `get(filterByTk)` | Richiede un singolo record e lo restituisce (non scrive in `getData`). |
| `create(data, options?)` | Crea un record. L'opzione `{ refresh: false }` impedisce il refresh automatico. Attiva `'saved'`. |
| `update(filterByTk, data, options?)` | Aggiorna un record tramite la sua chiave primaria. |
| `destroy(target)` | Elimina i record; `target` può essere una chiave primaria, un oggetto riga o un array di chiavi primarie/oggetti riga (eliminazione massiva). |
| `destroySelectedRows()` | Elimina le righe attualmente selezionate (genera un errore se non ne è selezionata nessuna). |
| `setItem(index, item)` | Sostituisce localmente una riga specifica di dati (non avvia una richiesta). |
| `runAction(actionName, options)` | Chiama qualsiasi azione della risorsa (ad es. azioni personalizzate). |

---

## Configurazione ed eventi

| Metodo | Descrizione |
|------|------|
| `setRefreshAction(name)` | L'azione chiamata durante il refresh, il valore predefinito è `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Configurazione della richiesta per create/update. |
| `on('refresh', fn)` / `on('saved', fn)` | Attivato dopo il completamento del refresh o dopo il salvataggio. |

---

## Esempi

### Lista base

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtraggio e ordinamento

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Caricamento associazioni

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Creazione e paginazione

```js
await ctx.resource.create({ name: 'Mario Rossi', email: 'mario.rossi@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Eliminazione massiva dei record selezionati

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Selezionare prima i dati');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Eliminato'));
```

### Ascolto dell'evento refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Risorsa associata (sottotabella)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Note

- **setResourceName è obbligatorio**: È necessario chiamare `setResourceName('nome_collezione')` prima dell'uso, altrimenti l'URL della richiesta non potrà essere costruito.
- **Risorse associate**: Quando il nome della risorsa è nel formato `parent.child` (ad es. `users.tags`), è necessario chiamare prima `setSourceId(chiave_primaria_genitore)`.
- **Debouncing del refresh**: Più chiamate a `refresh()` all'interno dello stesso ciclo di eventi eseguiranno solo l'ultima per evitare richieste ridondanti.
- **getData restituisce un array**: I dati restituiti dall'API della lista sono un array di record e `getData()` restituisce direttamente questo array.

---

## Correlati

- [ctx.resource](../context/resource.md) - L'istanza della risorsa nel contesto corrente
- [ctx.initResource()](../context/init-resource.md) - Inizializza e associa a ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Crea una nuova istanza di risorsa senza associazione
- [APIResource](./api-resource.md) - Risorsa API generica richiesta tramite URL
- [SingleRecordResource](./single-record-resource.md) - Orientata a un singolo record