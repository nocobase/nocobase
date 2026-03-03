:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/resource).
:::

# ctx.resource

L'istanza **FlowResource** nel contesto corrente, utilizzata per accedere e operare sui dati. Nella maggior parte dei blocchi (moduli, tabelle, dettagli, ecc.) e negli scenari pop-up, l'ambiente di runtime associa preventivamente `ctx.resource`. In scenari come JSBlock, dove non è presente alcuna risorsa per impostazione predefinita, è necessario chiamare prima [ctx.initResource()](./init-resource.md) per inizializzarla prima di utilizzarla tramite `ctx.resource`.

## Scenari applicabili

`ctx.resource` può essere utilizzato in qualsiasi scenario RunJS che richieda l'accesso a dati strutturati (elenchi, record singoli, API personalizzate, SQL). I blocchi Modulo, Tabella, Dettagli e i pop-up sono solitamente già associati. Per JSBlock, JSField, JSItem, JSColumn, ecc., se è richiesto il caricamento dei dati, è possibile chiamare prima `ctx.initResource(type)` e poi accedere a `ctx.resource`.

## Definizione del tipo

```ts
resource: FlowResource | undefined;
```

- Nei contesti con associazione preventiva, `ctx.resource` è l'istanza della risorsa corrispondente;
- In scenari come JSBlock, dove non è presente alcuna risorsa per impostazione predefinita, il valore è `undefined` finché non viene chiamato `ctx.initResource(type)`.

## Metodi comuni

I metodi esposti dai diversi tipi di risorse (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) variano leggermente. Di seguito sono elencati i metodi universali o comunemente utilizzati:

| Metodo | Descrizione |
|------|------|
| `getData()` | Ottiene i dati correnti (elenco o record singolo) |
| `setData(value)` | Imposta i dati locali |
| `refresh()` | Avvia una richiesta con i parametri correnti per aggiornare i dati |
| `setResourceName(name)` | Imposta il nome della risorsa (es. `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Imposta il filtro per chiave primaria (per `get` di record singoli, ecc.) |
| `runAction(actionName, options)` | Chiama qualsiasi azione della risorsa (es. `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Sottoscrive/annulla la sottoscrizione agli eventi (es. `refresh`, `saved`) |

**Specifici per MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, ecc.

## Esempi

### Dati dell'elenco (richiede prima initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Scenario Tabella (già associato)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Eliminato'));
```

### Record singolo

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Chiamata a un'azione personalizzata

```js
await ctx.resource.runAction('create', { data: { name: 'Mario Rossi' } });
```

## Relazione con ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Se `ctx.resource` non esiste, ne crea uno e lo associa; se esiste già, restituisce l'istanza esistente. Garantisce che `ctx.resource` sia disponibile.
- **ctx.makeResource(type)**: Crea una nuova istanza di risorsa e la restituisce, ma **non** la scrive in `ctx.resource`. È adatto per scenari che richiedono più risorse indipendenti o un uso temporaneo.
- **ctx.resource**: Accede alla risorsa già associata al contesto corrente. La maggior parte dei blocchi/pop-up è già associata; in caso contrario, è `undefined` e richiede `ctx.initResource`.

## Note

- Si consiglia di eseguire un controllo dei valori nulli prima dell'uso: `ctx.resource?.refresh()`, specialmente in scenari come JSBlock dove l'associazione preventiva potrebbe non esistere.
- Dopo l'inizializzazione, è necessario chiamare `setResourceName(name)` per specificare la collezione prima di caricare i dati tramite `refresh()`.
- Per l'API completa di ogni tipo di risorsa, consultare i link sottostanti.

## Correlati

- [ctx.initResource()](./init-resource.md) - Inizializza e associa una risorsa al contesto corrente
- [ctx.makeResource()](./make-resource.md) - Crea una nuova istanza di risorsa senza associarla a `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Record multipli/Elenchi
- [SingleRecordResource](../resource/single-record-resource.md) - Record singolo
- [APIResource](../resource/api-resource.md) - Risorsa API generica
- [SQLResource](../resource/sql-resource.md) - Risorsa di query SQL