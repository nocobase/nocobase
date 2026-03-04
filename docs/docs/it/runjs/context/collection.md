:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/collection).
:::

# ctx.collection

L'istanza della collezione (Collection) associata al contesto di esecuzione RunJS corrente, utilizzata per accedere ai metadati della collezione, alle definizioni dei campi, alle chiavi primarie e ad altre configurazioni. Solitamente proviene da `ctx.blockModel.collection` o `ctx.collectionField?.collection`.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock** | La collezione associata al blocco; può accedere a `name`, `getFields`, `filterTargetKey`, ecc. |
| **JSField / JSItem / JSColumn** | La collezione a cui appartiene il campo corrente (o la collezione del blocco genitore), utilizzata per recuperare elenchi di campi, chiavi primarie, ecc. |
| **Colonna della tabella / Blocco dettagli** | Utilizzata per il rendering basato sulla struttura della collezione o per passare `filterByTk` durante l'apertura di popup. |

> Nota: `ctx.collection` è disponibile negli scenari in cui un blocco dati, un blocco modulo o un blocco tabella è associato a una collezione. In un JSBlock indipendente non associato a una collezione, potrebbe essere `null`. Si consiglia di eseguire un controllo dei valori nulli prima dell'uso.

## Definizione del tipo

```ts
collection: Collection | null | undefined;
```

## Proprietà comuni

| Proprietà | Tipo | Descrizione |
|------|------|------|
| `name` | `string` | Nome della collezione (es. `users`, `orders`) |
| `title` | `string` | Titolo della collezione (include l'internazionalizzazione) |
| `filterTargetKey` | `string \| string[]` | Nome del campo della chiave primaria, utilizzato per `filterByTk` e `getFilterByTK` |
| `dataSourceKey` | `string` | Chiave della fonte dati (es. `main`) |
| `dataSource` | `DataSource` | L'istanza della fonte dati a cui appartiene |
| `template` | `string` | Modello della collezione (es. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Elenco dei campi che possono essere visualizzati come titoli |
| `titleCollectionField` | `CollectionField` | L'istanza del campo titolo |

## Metodi comuni

| Metodo | Descrizione |
|------|------|
| `getFields(): CollectionField[]` | Ottiene tutti i campi (inclusi quelli ereditati) |
| `getField(name: string): CollectionField \| undefined` | Ottiene un singolo campo in base al nome del campo |
| `getFieldByPath(path: string): CollectionField \| undefined` | Ottiene un campo tramite il percorso (supporta le associazioni, es. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Ottiene i campi di associazione; `types` può essere `['one']`, `['many']`, ecc. |
| `getFilterByTK(record): any` | Estrae il valore della chiave primaria da un record, utilizzato per il `filterByTk` dell'API |

## Relazione con ctx.collectionField e ctx.blockModel

| Esigenza | Utilizzo consigliato |
|------|----------|
| **Collezione associata al contesto corrente** | `ctx.collection` (equivalente a `ctx.blockModel?.collection` o `ctx.collectionField?.collection`) |
| **Definizione della collezione del campo corrente** | `ctx.collectionField?.collection` (la collezione a cui appartiene il campo) |
| **Collezione di destinazione dell'associazione** | `ctx.collectionField?.targetCollection` (la collezione di destinazione di un campo di associazione) |

In scenari come le sotto-tabelle, `ctx.collection` potrebbe essere la collezione di destinazione dell'associazione; nei moduli o nelle tabelle standard, solitamente è la collezione associata al blocco.

## Esempi

### Ottenere la chiave primaria e aprire un popup

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Iterare attraverso i campi per la validazione o il concatenamento

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} è obbligatorio`);
    return;
  }
}
```

### Ottenere i campi di associazione

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Utilizzato per costruire sotto-tabelle, risorse associate, ecc.
```

## Note

- `filterTargetKey` è il nome del campo della chiave primaria della collezione. Alcune collezioni potrebbero utilizzare un `string[]` per chiavi primarie composte. Se non configurato, `'id'` viene comunemente usato come valore predefinito.
- In scenari come **sotto-tabelle o campi di associazione**, `ctx.collection` può puntare alla collezione di destinazione dell'associazione, il che differisce da `ctx.blockModel.collection`.
- `getFields()` unisce i campi delle collezioni ereditate; i campi locali sovrascrivono i campi ereditati con lo stesso nome.

## Correlati

- [ctx.collectionField](./collection-field.md): La definizione del campo della collezione per il campo corrente
- [ctx.blockModel](./block-model.md): Il blocco genitore che ospita il JS corrente, contenente `collection`
- [ctx.model](./model.md): Il modello corrente, che può contenere `collection`