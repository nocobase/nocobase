:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/form).
:::

# ctx.form

L'istanza Ant Design Form all'interno del blocco corrente, utilizzata per leggere/scrivere i campi del modulo, attivare la validazione e l'invio. È equivalente a `ctx.blockModel?.form` e può essere utilizzata direttamente nei blocchi relativi ai moduli (Form, EditForm, sotto-moduli, ecc.).

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSField** | Leggere/scrivere altri campi del modulo per implementare collegamenti, o eseguire calcoli e validazioni basati sui valori di altri campi. |
| **JSItem** | Leggere/scrivere campi della stessa riga o altri campi all'interno di elementi di una sotto-tabella per ottenere collegamenti interni alla tabella. |
| **JSColumn** | Leggere i valori della riga corrente o dei campi associati in una colonna della tabella per il rendering. |
| **Operazioni modulo / Flusso di lavoro** | Validazione pre-invio, aggiornamento massivo dei campi, ripristino dei moduli, ecc. |

> Nota: `ctx.form` è disponibile solo nei contesti RunJS relativi ai blocchi modulo (Form, EditForm, sotto-moduli, ecc.). Potrebbe non esistere in scenari non legati ai moduli (come JSBlock indipendenti o blocchi Tabella). Si consiglia di eseguire un controllo di valore nullo prima dell'uso: `ctx.form?.getFieldsValue()`.

## Definizione del tipo

```ts
form: FormInstance<any>;
```

`FormInstance` è il tipo di istanza di Ant Design Form. I metodi comuni sono i seguenti.

## Metodi comuni

### Leggere i valori del modulo

```ts
// Legge i valori dei campi attualmente registrati (per impostazione predefinita solo i campi renderizzati)
const values = ctx.form.getFieldsValue();

// Legge i valori di tutti i campi (inclusi i campi registrati ma non renderizzati, ad esempio quelli nascosti o all'interno di sezioni compresse)
const allValues = ctx.form.getFieldsValue(true);

// Legge un singolo campo
const email = ctx.form.getFieldValue('email');

// Legge campi annidati (ad esempio in una sotto-tabella)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Scrivere i valori del modulo

```ts
// Aggiornamento massivo (comunemente usato per i collegamenti)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Aggiorna un singolo campo
ctx.form.setFieldValue('remark', 'Nota aggiornata');
```

### Validazione e invio

```ts
// Attiva la validazione del modulo
await ctx.form.validateFields();

// Attiva l'invio del modulo
ctx.form.submit();
```

### Ripristino

```ts
// Ripristina tutti i campi
ctx.form.resetFields();

// Ripristina solo campi specifici
ctx.form.resetFields(['status', 'remark']);
```

## Relazione con i contesti correlati

### ctx.getValue / ctx.setValue

| Scenario | Utilizzo consigliato |
|------|----------|
| **Leggere/scrivere il campo corrente** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Leggere/scrivere altri campi** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

All'interno del campo JS corrente, dia la priorità all'uso di `getValue`/`setValue` per leggere/scrivere il campo stesso; utilizzi `ctx.form` quando deve accedere ad altri campi.

### ctx.blockModel

| Requisito | Utilizzo consigliato |
|------|----------|
| **Leggere/scrivere campi del modulo** | `ctx.form` (Equivalente a `ctx.blockModel?.form`, più conveniente) |
| **Accedere al blocco genitore** | `ctx.blockModel` (Contiene `collezione`, `risorsa`, ecc.) |

### ctx.getVar('ctx.formValues')

I valori del modulo devono essere ottenuti tramite `await ctx.getVar('ctx.formValues')` e non sono esposti direttamente come `ctx.formValues`. In un contesto di modulo, è preferibile utilizzare `ctx.form.getFieldsValue()` per leggere i valori più recenti in tempo reale.

## Note

- `getFieldsValue()` restituisce solo i campi renderizzati per impostazione predefinita. Per includere i campi non renderizzati (ad esempio in sezioni compresse o nascosti da regole condizionali), passi `true`: `getFieldsValue(true)`.
- I percorsi per i campi annidati come le sotto-tabelle sono array, ad esempio `['orders', 0, 'amount']`. Può usare `ctx.namePath` per ottenere il percorso del campo corrente e costruire percorsi per altre colonne nella stessa riga.
- `validateFields()` genera un oggetto errore contenente `errorFields` e altre informazioni. Se la validazione fallisce prima dell'invio, può usare `ctx.exit()` per terminare i passaggi successivi.
- In scenari asincroni come flussi di lavoro o regole di collegamento, `ctx.form` potrebbe non essere ancora pronto. Si consiglia di utilizzare l'optional chaining o controlli di valore nullo.

## Esempi

### Collegamento tra campi: visualizzare contenuti diversi in base al tipo

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Calcolare il campo corrente in base ad altri campi

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Leggere/scrivere altre colonne nella stessa riga all'interno di una sotto-tabella

```ts
// ctx.namePath è il percorso del campo corrente nel modulo, ad esempio ['orders', 0, 'amount']
// Legge 'status' nella stessa riga: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validazione pre-invio

```ts
try {
  await ctx.form.validateFields();
  // Validazione superata, procedere con la logica di invio
} catch (e) {
  ctx.message.error('Per favore, controlli i campi del modulo');
  ctx.exit();
}
```

### Invio dopo conferma

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Conferma invio',
  content: 'Non sarà possibile modificare i dati dopo l\'invio. Continuare?',
  okText: 'Conferma',
  cancelText: 'Annulla',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Termina se l'utente annulla
}
```

## Correlati

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Leggere e scrivere il valore del campo corrente.
- [ctx.blockModel](./block-model.md): Modello del blocco genitore; `ctx.form` è equivalente a `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Finestre di dialogo di conferma, spesso usate con `ctx.form.validateFields()` e `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Termina il processo in caso di fallimento della validazione o annullamento da parte dell'utente.
- `ctx.namePath`: Il percorso (array) del campo corrente nel modulo, utilizzato per costruire i nomi per `getFieldValue` / `setFieldValue` nei campi annidati.