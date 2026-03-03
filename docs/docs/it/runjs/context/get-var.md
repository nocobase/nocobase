:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/get-var).
:::

# ctx.getVar()

Legge **asincronamente** i valori delle variabili dal contesto di runtime corrente. La risoluzione delle variabili è coerente con `{{ctx.xxx}}` in SQL e nei template, e solitamente provengono dall'utente corrente, dal record corrente, dai parametri della vista, dal contesto dei popup, ecc.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSField** | Ottenere informazioni sul record corrente, sull'utente, sulla risorsa, ecc., per il rendering o la logica. |
| **Regole di collegamento / Flussi di lavoro** | Leggere `ctx.record`, `ctx.formValues`, ecc., per la logica condizionale. |
| **Formule / Template** | Utilizza le stesse regole di risoluzione delle variabili di `{{ctx.xxx}}`. |

## Definizione del tipo

```ts
getVar(path: string): Promise<any>;
```

| Parametro | Tipo | Descrizione |
|------|------|------|
| `path` | `string` | Percorso della variabile; **deve iniziare con `ctx.`**. Supporta la notazione a punti e gli indici degli array. |

**Valore di ritorno**: `Promise<any>`. Utilizzare `await` per ottenere il valore risolto; restituisce `undefined` se la variabile non esiste.

> Se viene passato un percorso che non inizia con `ctx.`, verrà generato un errore: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Percorsi comuni delle variabili

| Percorso | Descrizione |
|------|------|
| `ctx.record` | Record corrente (disponibile quando un blocco modulo/dettagli è associato a un record) |
| `ctx.record.id` | Chiave primaria del record corrente |
| `ctx.formValues` | Valori del modulo corrente (comunemente usati nelle regole di collegamento e nei flussi di lavoro; negli scenari dei moduli, preferire `ctx.form.getFieldsValue()` per la lettura in tempo reale) |
| `ctx.user` | Utente attualmente loggato |
| `ctx.user.id` | ID dell'utente corrente |
| `ctx.user.nickname` | Nickname dell'utente corrente |
| `ctx.user.roles.name` | Nomi dei ruoli dell'utente corrente (array) |
| `ctx.popup.record` | Record all'interno di un popup |
| `ctx.popup.record.id` | Chiave primaria del record all'interno di un popup |
| `ctx.urlSearchParams` | Parametri di query dell'URL (analizzati da `?key=value`) |
| `ctx.token` | Token API corrente |
| `ctx.role` | Ruolo corrente |

## ctx.getVarInfos()

Ottiene le **informazioni strutturali** (tipo, titolo, sotto-proprietà, ecc.) delle variabili risolvibili nel contesto corrente, facilitando l'esplorazione dei percorsi disponibili. Il valore restituito è una descrizione statica basata sui `meta` e non include i valori effettivi di runtime.

### Definizione del tipo

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Nel valore di ritorno, ogni chiave è un percorso di variabile e il valore corrisponde alle informazioni strutturali per quel percorso (inclusi `type`, `title`, `properties`, ecc.).

### Parametri

| Parametro | Tipo | Descrizione |
|------|------|------|
| `path` | `string \| string[]` | Percorso di ritaglio; raccoglie solo la struttura delle variabili sotto questo percorso. Supporta `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; un array rappresenta l'unione di più percorsi. |
| `maxDepth` | `number` | Profondità massima di espansione, predefinita a `3`. Quando `path` non è fornito, le proprietà di primo livello hanno `depth=1`. Quando `path` è fornito, il nodo corrispondente al percorso ha `depth=1`. |

### Esempio

```ts
// Ottenere la struttura delle variabili sotto record (espansa fino a 3 livelli)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Ottenere la struttura di popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Ottenere la struttura completa delle variabili di primo livello (maxDepth=3 predefinito)
const vars = await ctx.getVarInfos();
```

## Differenza da ctx.getValue

| Metodo | Scenario | Descrizione |
|------|----------|------|
| `ctx.getValue()` | Campi modificabili come JSField o JSItem | Ottiene in modo sincrono il valore del **campo corrente**; richiede l'associazione a un modulo. |
| `ctx.getVar(path)` | Qualsiasi contesto RunJS | Ottiene in modo asincrono **qualsiasi variabile ctx**; il percorso deve iniziare con `ctx.`. |

In un JSField, utilizzi `getValue`/`setValue` per leggere/scrivere il campo corrente; utilizzi `getVar` per accedere ad altre variabili di contesto (come `record`, `user`, `formValues`).

## Note

- **Il percorso deve iniziare con `ctx.`**: ad esempio, `ctx.record.id`, altrimenti verrà generato un errore.
- **Metodo asincrono**: è necessario utilizzare `await` per ottenere il risultato, ad esempio `const id = await ctx.getVar('ctx.record.id')`.
- **Variabile non esistente**: restituisce `undefined`. È possibile utilizzare `??` dopo il risultato per impostare un valore predefinito: `(await ctx.getVar('ctx.user.nickname')) ?? 'Ospite'`.
- **Valori del modulo**: `ctx.formValues` deve essere recuperato tramite `await ctx.getVar('ctx.formValues')`; non è esposto direttamente come `ctx.formValues`. In un contesto di modulo, preferisca utilizzare `ctx.form.getFieldsValue()` per leggere i valori più recenti in tempo reale.

## Esempi

### Ottenere l'ID del record corrente

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Record corrente: ${recordId}`);
}
```

### Ottenere un record all'interno di un popup

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Record del popup corrente: ${recordId}`);
}
```

### Leggere i sotto-elementi di un campo array

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Restituisce un array di nomi di ruoli, ad es. ['admin', 'member']
```

### Impostare un valore predefinito

```ts
// getVar non ha un parametro defaultValue; utilizzi ?? dopo il risultato
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Ospite';
```

### Leggere i valori dei campi del modulo

```ts
// Sia ctx.formValues che ctx.form sono per scenari di modulo; usi getVar per leggere i campi nidificati
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Leggere i parametri di query dell'URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Corrisponde a ?id=xxx
```

### Esplorare le variabili disponibili

```ts
// Ottenere la struttura delle variabili sotto record (espansa fino a 3 livelli)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars apparirà come { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Correlati

- [ctx.getValue()](./get-value.md) - Ottiene in modo sincrono il valore del campo corrente (solo JSField/JSItem)
- [ctx.form](./form.md) - Istanza del modulo; `ctx.form.getFieldsValue()` può leggere i valori del modulo in tempo reale
- [ctx.model](./model.md) - Il modello in cui risiede il contesto di esecuzione corrente
- [ctx.blockModel](./block-model.md) - Il blocco genitore in cui si trova il JS corrente
- [ctx.resource](./resource.md) - L'istanza della risorsa nel contesto corrente
- `{{ctx.xxx}}` in SQL / Template - Utilizza le stesse regole di risoluzione di `ctx.getVar('ctx.xxx')`