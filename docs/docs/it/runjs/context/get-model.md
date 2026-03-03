:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/get-model).
:::

# ctx.getModel()

Recupera un'istanza del modello (come `BlockModel`, `PageModel`, `ActionModel`, ecc.) dal motore corrente o dallo stack delle viste in base all' `uid` del modello. Viene utilizzato in RunJS per accedere ad altri modelli tra blocchi, pagine o finestre a comparsa (popup).

Se ha bisogno solo del modello o del blocco in cui si trova l'attuale contesto di esecuzione, dia la priorità all'uso di `ctx.model` o `ctx.blockModel` invece di `ctx.getModel`.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSAction** | Ottenere modelli di altri blocchi basandosi su un `uid` noto per leggere o scrivere i loro `resource`, `form`, `setProps`, ecc. |
| **RunJS nei Popup** | Quando è necessario accedere a un modello nella pagina che ha aperto il popup, passare `searchInPreviousEngines: true`. |
| **Azioni Personalizzate** | Individuare moduli o sottomodelli nel pannello di configurazione tramite `uid` attraverso gli stack di viste per leggerne la configurazione o lo stato. |

## Definizione del tipo

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parametri

| Parametro | Tipo | Descrizione |
|------|------|------|
| `uid` | `string` | L'identificatore univoco dell'istanza del modello di destinazione, specificato durante la configurazione o la creazione (ad esempio, `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Opzionale, predefinito a `false`. Quando è `true`, cerca dal motore corrente fino alla radice nello "stack delle viste", consentendo l'accesso ai modelli nei motori di livello superiore (ad esempio, la pagina che ha aperto un popup). |

## Valore di ritorno

- Restituisce l'istanza della sottoclasse `FlowModel` corrispondente (ad esempio, `BlockModel`, `FormBlockModel`, `ActionModel`) se trovata.
- Restituisce `undefined` se non trovata.

## Ambito di ricerca

- **Predefinito (`searchInPreviousEngines: false`)**: Cerca solo all'interno del **motore corrente** tramite `uid`. Nei popup o nelle viste multilivello, ogni vista ha un motore indipendente; per impostazione predefinita, cerca solo i modelli all'interno della vista corrente.
- **`searchInPreviousEngines: true`**: Cerca verso l'alto lungo la catena `previousEngine` a partire dal motore corrente, restituendo la prima corrispondenza. È utile per accedere a un modello nella pagina che ha aperto il popup corrente.

## Esempi

### Ottenere un altro blocco e aggiornarlo

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Accedere a un modello sulla pagina da un popup

```ts
// Accede a un blocco nella pagina che ha aperto il popup corrente
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Lettura/scrittura tra modelli e attivazione del rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Controllo di sicurezza

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Il modello di destinazione non esiste');
  return;
}
```

## Correlati

- [ctx.model](./model.md): Il modello in cui si trova l'attuale contesto di esecuzione.
- [ctx.blockModel](./block-model.md): Il modello del blocco genitore in cui si trova l'attuale JS; solitamente accessibile senza necessità di `getModel`.