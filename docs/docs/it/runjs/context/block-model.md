:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/block-model).
:::

# ctx.blockModel

Il modello del blocco padre (istanza di `BlockModel`) in cui si trova l'attuale campo JS / blocco JS. In scenari come `JSField`, `JSItem` e `JSColumn`, `ctx.blockModel` punta al blocco modulo o al blocco tabella che ospita l'attuale logica JS. In un `JSBlock` indipendente, potrebbe essere `null` o coincidere con `ctx.model`.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSField** | Accedere a `form`, `collezione` e `risorsa` del blocco modulo padre all'interno di un campo del modulo per implementare concatenazioni o validazioni. |
| **JSItem** | Accedere alle informazioni sulla risorsa e sulla collezione del blocco tabella/modulo padre all'interno di un elemento di una sotto-tabella. |
| **JSColumn** | Accedere alla `risorsa` (es. `getSelectedRows`) e alla `collezione` del blocco tabella padre all'interno di una colonna della tabella. |
| **Azioni modulo / Flussi di lavoro** | Accedere a `form` per la validazione pre-invio, `resource` per l'aggiornamento, ecc. |

> Nota: `ctx.blockModel` è disponibile solo nei contesti RunJS in cui esiste un blocco padre. Nei `JSBlock` indipendenti (senza un modulo/tabella padre), potrebbe essere `null`. Si consiglia di effettuare un controllo di valore nullo prima dell'uso.

## Definizione del tipo

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Il tipo specifico dipende dal tipo di blocco padre: i blocchi modulo sono solitamente `FormBlockModel` o `EditFormModel`, mentre i blocchi tabella sono solitamente `TableBlockModel`.

## Proprietà comuni

| Proprietà | Tipo | Descrizione |
|------|------|------|
| `uid` | `string` | Identificativo unico del modello del blocco. |
| `collection` | `Collection` | La collezione associata al blocco corrente. |
| `resource` | `Resource` | L'istanza della risorsa utilizzata dal blocco (`SingleRecordResource` / `MultiRecordResource`, ecc.). |
| `form` | `FormInstance` | Blocco Modulo: istanza di Ant Design Form, supporta `getFieldsValue`, `validateFields`, `setFieldsValue`, ecc. |
| `emitter` | `EventEmitter` | Emettitore di eventi, utilizzato per ascoltare `formValuesChange`, `onFieldReset`, ecc. |

## Relazione con ctx.model e ctx.form

| Esigenza | Utilizzo raccomandato |
|------|----------|
| **Blocco padre del JS corrente** | `ctx.blockModel` |
| **Leggere/Scrivere campi del modulo** | `ctx.form` (equivalente a `ctx.blockModel?.form`, più comodo nei blocchi modulo) |
| **Modello del contesto di esecuzione corrente** | `ctx.model` (Modello di campo in `JSField`, modello di blocco in `JSBlock`) |

In un `JSField`, `ctx.model` è il modello del campo, e `ctx.blockModel` è il blocco modulo o tabella che ospita quel campo; `ctx.form` è tipicamente `ctx.blockModel.form`.

## Esempi

### Tabella: Ottenere le righe selezionate ed elaborarle

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Selezionare prima i dati');
  return;
}
```

### Scenario Modulo: Validazione e Aggiornamento

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Ascoltare le modifiche del modulo

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implementare concatenazioni o re-rendering basati sui valori più recenti del modulo
});
```

### Attivare il re-rendering del blocco

```ts
ctx.blockModel?.rerender?.();
```

## Note

- In un **JSBlock indipendente** (senza un blocco modulo o tabella padre), `ctx.blockModel` potrebbe essere `null`. Si consiglia di utilizzare l'optional chaining per accedere alle sue proprietà: `ctx.blockModel?.resource?.refresh?.()`.
- In **JSField / JSItem / JSColumn**, `ctx.blockModel` si riferisce al blocco modulo o tabella che ospita il campo corrente. In un **JSBlock**, può essere se stesso o un blocco di livello superiore, a seconda della gerarchia effettiva.
- `resource` esiste solo nei blocchi dati; `form` esiste solo nei blocchi modulo. I blocchi tabella solitamente non hanno un `form`.

## Correlati

- [ctx.model](./model.md): Il modello del contesto di esecuzione corrente.
- [ctx.form](./form.md): Istanza del modulo, comunemente usata nei blocchi modulo.
- [ctx.resource](./resource.md): Istanza della risorsa (equivalente a `ctx.blockModel?.resource`, da usare direttamente se disponibile).
- [ctx.getModel()](./get-model.md): Ottenere altri modelli di blocco tramite UID.