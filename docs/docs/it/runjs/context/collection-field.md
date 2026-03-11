:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/collection-field).
:::

# ctx.collectionField

L'istanza `CollectionField` associata al contesto di esecuzione RunJS corrente, utilizzata per accedere ai metadati del campo, ai tipi, alle regole di validazione e alle informazioni sulle associazioni. Esiste solo quando il campo è vincolato a una definizione di collezione; i campi personalizzati o virtuali potrebbero essere `null`.

## Scenari d'uso

| Scenario | Descrizione |
|------|------|
| **JSField** | Esegue collegamenti o validazioni nei campi del modulo in base a `interface`, `enum`, `targetCollection`, ecc. |
| **JSItem** | Accede ai metadati del campo corrispondente alla colonna corrente negli elementi della sotto-tabella. |
| **JSColumn** | Seleziona i metodi di rendering in base a `collectionField.interface` o accede a `targetCollection` nelle colonne della tabella. |

> Nota: `ctx.collectionField` è disponibile solo quando il campo è vincolato a una definizione di collezione (Collection); solitamente è `undefined` in scenari come blocchi indipendenti JSBlock o eventi di azione senza vincolo di campo. Si consiglia di verificare la presenza di valori nulli prima dell'uso.

## Definizione del tipo

```ts
collectionField: CollectionField | null | undefined;
```

## Proprietà comuni

| Proprietà | Tipo | Descrizione |
|------|------|------|
| `name` | `string` | Nome del campo (es. `status`, `userId`) |
| `title` | `string` | Titolo del campo (inclusa l'internazionalizzazione) |
| `type` | `string` | Tipo di dato del campo (`string`, `integer`, `belongsTo`, ecc.) |
| `interface` | `string` | Tipo di interfaccia del campo (`input`, `select`, `m2o`, `o2m`, `m2m`, ecc.) |
| `collection` | `Collection` | La collezione a cui appartiene il campo |
| `targetCollection` | `Collection` | La collezione di destinazione del campo di associazione (solo per i tipi di associazione) |
| `target` | `string` | Nome della collezione di destinazione (per i campi di associazione) |
| `enum` | `array` | Opzioni di enumerazione (select, radio, ecc.) |
| `defaultValue` | `any` | Valore predefinito |
| `collectionName` | `string` | Nome della collezione a cui appartiene |
| `foreignKey` | `string` | Nome del campo chiave esterna (belongsTo, ecc.) |
| `sourceKey` | `string` | Chiave sorgente dell'associazione (hasMany, ecc.) |
| `targetKey` | `string` | Chiave di destinazione dell'associazione |
| `fullpath` | `string` | Percorso completo (es. `main.users.status`), utilizzato per API o riferimenti a variabili |
| `resourceName` | `string` | Nome della risorsa (es. `users.status`) |
| `readonly` | `boolean` | Indica se è in sola lettura |
| `titleable` | `boolean` | Indica se può essere visualizzato come titolo |
| `validation` | `object` | Configurazione delle regole di validazione |
| `uiSchema` | `object` | Configurazione UI |
| `targetCollectionTitleField` | `CollectionField` | Il campo titolo della collezione di destinazione (per i campi di associazione) |

## Metodi comuni

| Metodo | Descrizione |
|------|------|
| `isAssociationField(): boolean` | Indica se è un campo di associazione (belongsTo, hasMany, hasOne, belongsToMany, ecc.) |
| `isRelationshipField(): boolean` | Indica se è un campo di relazione (inclusi o2o, m2o, o2m, m2m, ecc.) |
| `getComponentProps(): object` | Ottiene le props predefinite del componente del campo |
| `getFields(): CollectionField[]` | Ottiene l'elenco dei campi della collezione di destinazione (solo per i campi di associazione) |
| `getFilterOperators(): object[]` | Ottiene gli operatori di filtro supportati da questo campo (es. `$eq`, `$ne`, ecc.) |

## Esempi

### Rendering condizionale basato sul tipo di campo

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Campo di associazione: visualizza i record associati
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Determinare se è un campo di associazione e accedere alla collezione di destinazione

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Elaborazione in base alla struttura della collezione di destinazione
}
```

### Ottenere le opzioni di enumerazione

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Rendering condizionale basato sulla modalità sola lettura/visualizzazione

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Ottenere il campo titolo della collezione di destinazione

```ts
// Quando si visualizza un campo di associazione, utilizzare targetCollectionTitleField per ottenere il nome del campo titolo
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relazione con ctx.collection

| Esigenza | Utilizzo consigliato |
|------|----------|
| **Collezione del campo corrente** | `ctx.collectionField?.collection` o `ctx.collection` |
| **Metadati del campo (nome, tipo, interfaccia, enum, ecc.)** | `ctx.collectionField` |
| **Collezione di destinazione** | `ctx.collectionField?.targetCollection` |

`ctx.collection` solitamente rappresenta la collezione vincolata al blocco corrente; `ctx.collectionField` rappresenta la definizione del campo corrente nella collezione. In scenari come sotto-tabelle o campi di associazione, i due potrebbero differire.

## Note

- In scenari come **JSBlock** o **JSAction (senza vincolo di campo)**, `ctx.collectionField` è solitamente `undefined`. Si consiglia di utilizzare la concatenazione opzionale (optional chaining) prima dell'accesso.
- Se un campo JS personalizzato non è vincolato a un campo di una collezione, `ctx.collectionField` potrebbe essere `null`.
- `targetCollection` esiste solo per i campi di tipo associazione (es. m2o, o2m, m2m); `enum` esiste solo per i campi con opzioni come select o radioGroup.

## Correlati

- [ctx.collection](./collection.md): Collezione associata al contesto corrente
- [ctx.model](./model.md): Modello in cui si trova il contesto di esecuzione corrente
- [ctx.blockModel](./block-model.md): Blocco genitore che ospita il JS corrente
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Lettura e scrittura del valore del campo corrente