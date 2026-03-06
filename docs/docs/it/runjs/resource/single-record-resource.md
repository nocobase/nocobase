:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Risorsa orientata al **singolo record**: i dati sono rappresentati da un singolo oggetto. Supporta il recupero tramite chiave primaria, la creazione/aggiornamento (save) e l'eliminazione. È adatta per scenari come "singoli record" in dettagli, moduli, ecc. A differenza di [MultiRecordResource](./multi-record-resource.md), il metodo `getData()` di `SingleRecordResource` restituisce un singolo oggetto; specificando la chiave primaria tramite `setFilterByTk(id)`, il metodo `save()` chiamerà automaticamente `create` o `update` in base allo stato di `isNewRecord`.

**Ereditarietà**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Modalità di creazione**: `ctx.makeResource('SingleRecordResource')` o `ctx.initResource('SingleRecordResource')`. È necessario chiamare `setResourceName('nome_collezione')` prima dell'uso; per le operazioni tramite chiave primaria, utilizzare `setFilterByTk(id)`. In RunJS, `ctx.api` viene iniettato dall'ambiente di esecuzione.

---

## Scenari applicativi

| Scenario | Descrizione |
|------|------|
| **Blocco dettagli** | Il blocco dettagli utilizza predefinitamente `SingleRecordResource` per caricare un singolo record tramite chiave primaria. |
| **Blocco modulo** | I moduli di creazione/modifica utilizzano `SingleRecordResource`, dove `save()` distingue automaticamente tra `create` e `update`. |
| **Dettagli JSBlock** | Caricamento di un singolo utente, ordine, ecc., all'interno di un JSBlock con visualizzazione personalizzata. |
| **Risorse correlate** | Caricamento di record singoli associati utilizzando il formato `users.profile`, richiedendo l'uso di `setSourceId(ID_record_padre)`. |

---

## Formato dei dati

- `getData()` restituisce un **singolo oggetto record**, che corrisponde al campo `data` della risposta API get.
- `getMeta()` restituisce i metadati (se presenti).

---

## Nome della risorsa e chiave primaria

| Metodo | Descrizione |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nome della risorsa, ad esempio `'users'`, `'users.profile'` (risorsa correlata). |
| `setSourceId(id)` / `getSourceId()` | ID del record padre per le risorse correlate (ad esempio, `users.profile` richiede la chiave primaria di `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identificatore della fonte dati (utilizzato in ambienti multi-fonte dati). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Chiave primaria del record corrente; una volta impostata, `isNewRecord` diventa `false`. |

---

## Stato

| Proprietà/Metodo | Descrizione |
|----------|------|
| `isNewRecord` | Indica se si è in stato "Nuovo" (true se `filterByTk` non è impostato o se il record è appena stato creato). |

---

## Parametri di richiesta (Filtri / Campi)

| Metodo | Descrizione |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtro (disponibile quando non si è in stato "Nuovo"). |
| `setFields(fields)` / `getFields()` | Campi richiesti. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Caricamento delle associazioni (appends). |

---

## CRUD

| Metodo | Descrizione |
|------|------|
| `refresh()` | Esegue una richiesta `get` basata sul `filterByTk` corrente e aggiorna `getData()`; non esegue richieste in stato "Nuovo". |
| `save(data, options?)` | Chiama `create` in stato "Nuovo", altrimenti chiama `update`; l'opzione `{ refresh: false }` impedisce l'aggiornamento automatico. |
| `destroy(options?)` | Elimina il record in base al `filterByTk` corrente e svuota i dati locali. |
| `runAction(actionName, options)` | Esegue una qualsiasi azione (action) della risorsa. |

---

## Configurazione ed eventi

| Metodo | Descrizione |
|------|------|
| `setSaveActionOptions(options)` | Configurazione della richiesta per l'azione `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Attivati al completamento dell'aggiornamento o dopo il salvataggio. |

---

## Esempi

### Recupero e aggiornamento di base

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Aggiornamento
await ctx.resource.save({ name: 'Mario Rossi' });
```

### Creazione di un nuovo record

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Giuseppe Verdi', email: 'g.verdi@example.com' });
```

### Eliminazione di un record

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Dopo destroy, getData() restituisce null
```

### Caricamento delle associazioni e campi

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Risorse correlate (es. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Chiave primaria del record padre
res.setFilterByTk(profileId);    // filterByTk può essere omesso se profile è una relazione hasOne
await res.refresh();
const profile = res.getData();
```

### Salvataggio senza aggiornamento automatico

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// getData() mantiene il vecchio valore poiché il refresh non viene attivato dopo il salvataggio
```

### Ascolto degli eventi refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Utente: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Salvato con successo');
});
await ctx.resource?.refresh?.();
```

---

## Note importanti

- **setResourceName è obbligatorio**: È necessario chiamare `setResourceName('nome_collezione')` prima dell'uso, altrimenti l'URL della richiesta non potrà essere costruito.
- **filterByTk e isNewRecord**: Se `setFilterByTk` non viene chiamato, `isNewRecord` sarà `true` e `refresh()` non avvierà alcuna richiesta; `save()` eseguirà un'azione `create`.
- **Risorse correlate**: Quando il nome della risorsa è nel formato `padre.figlio` (es. `users.profile`), è necessario chiamare prima `setSourceId(chiave_primaria_padre)`.
- **getData restituisce un oggetto**: Il campo `data` restituito dalle API per record singolo è un oggetto record; `getData()` restituisce direttamente questo oggetto. Diventa `null` dopo l'esecuzione di `destroy()`.

---

## Correlati

- [ctx.resource](../context/resource.md) - L'istanza della risorsa nel contesto corrente
- [ctx.initResource()](../context/init-resource.md) - Inizializza e associa a `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Crea una nuova istanza della risorsa senza associarla
- [APIResource](./api-resource.md) - Risorsa API generica richiesta tramite URL
- [MultiRecordResource](./multi-record-resource.md) - Orientata a collezioni/liste, supporta CRUD e paginazione