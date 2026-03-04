:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/open-view).
:::

# ctx.openView()

Apre programmaticamente una vista specificata (drawer, finestra di dialogo, pagina incorporata, ecc.). Fornito da `FlowModelContext`, viene utilizzato per aprire viste `ChildPage` o `PopupAction` configurate in scenari come `JSBlock`, celle di tabelle e flussi di lavoro.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **JSBlock** | Aprire una finestra di dialogo di dettaglio/modifica dopo il clic su un pulsante, passando il `filterByTk` della riga corrente. |
| **Cella della tabella** | Renderizzare un pulsante all'interno di una cella che apre una finestra di dialogo con i dettagli della riga al clic. |
| **Flusso di lavoro / JSAction** | Aprire la vista successiva o una finestra di dialogo dopo un'operazione andata a buon fine. |
| **Campo di associazione** | Aprire una finestra di dialogo di selezione/modifica tramite `ctx.runAction('openView', params)`. |

> Nota: `ctx.openView` deve essere disponibile in un ambiente RunJS in cui esiste un contesto `FlowModel`; se il modello corrispondente all' `uid` non esiste, verrà creato automaticamente un `PopupActionModel` e reso persistente.

## Firma

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Descrizione dei parametri

### uid

L'identificatore univoco del modello di vista. Se non esiste, verrà creato e salvato automaticamente. Si consiglia di utilizzare un UID stabile, come `${ctx.model.uid}-detail`, in modo che la configurazione possa essere riutilizzata quando si apre la stessa finestra di dialogo più volte.

### Campi comuni di options

| Campo | Tipo | Descrizione |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Modalità di apertura: drawer (cassetto), dialog (finestra di dialogo) o embed (incorporato). Predefinito: `drawer`. |
| `size` | `small` / `medium` / `large` | Dimensioni della finestra di dialogo o del drawer. Predefinito: `medium`. |
| `title` | `string` | Titolo della vista. |
| `params` | `Record<string, any>` | Parametri arbitrari passati alla vista. |
| `filterByTk` | `any` | Valore della chiave primaria, utilizzato per scenari di dettaglio/modifica di un singolo record. |
| `sourceId` | `string` | ID del record di origine, utilizzato in scenari di associazione. |
| `dataSourceKey` | `string` | Fonte dati. |
| `collectionName` | `string` | Nome della collezione. |
| `associationName` | `string` | Nome del campo di associazione. |
| `navigation` | `boolean` | Se utilizzare la navigazione tramite rotte. Se vengono forniti `defineProperties` o `defineMethods`, questo valore viene forzato a `false`. |
| `preventClose` | `boolean` | Se impedire la chiusura. |
| `defineProperties` | `Record<string, PropertyOptions>` | Iniettare dinamicamente proprietà nel modello all'interno della vista. |
| `defineMethods` | `Record<string, Function>` | Iniettare dinamicamente metodi nel modello all'interno della vista. |

## Esempi

### Utilizzo di base: aprire un drawer

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Dettagli'),
});
```

### Passaggio del contesto della riga corrente

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Dettagli riga'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Apertura tramite runAction

Quando un modello è configurato con un'azione `openView` (come campi di associazione o campi cliccabili), è possibile chiamare:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Iniezione di un contesto personalizzato

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Relazione con ctx.viewer e ctx.view

| Scopo | Utilizzo consigliato |
|------|----------|
| **Aprire una vista di flusso configurata** | `ctx.openView(uid, options)` |
| **Aprire contenuti personalizzati (senza flusso)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Operare sulla vista attualmente aperta** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` apre una `FlowPage` (`ChildPageModel`), che esegue il rendering di una pagina di flusso completa internamente; `ctx.viewer` apre contenuti React arbitrari.

## Note

- Si consiglia di associare l' `uid` a `ctx.model.uid` (ad esempio, `${ctx.model.uid}-xxx`) per evitare conflitti tra più blocchi.
- Quando vengono passati `defineProperties` o `defineMethods`, `navigation` viene forzato a `false` per evitare la perdita del contesto dopo un aggiornamento.
- All'interno della finestra di dialogo, `ctx.view` si riferisce all'istanza della vista corrente e `ctx.view.inputArgs` può essere utilizzato per leggere i parametri passati durante l'apertura.

## Correlati

- [ctx.view](./view.md): L'istanza della vista attualmente aperta.
- [ctx.model](./model.md): Il modello corrente, utilizzato per costruire un popupUid stabile.