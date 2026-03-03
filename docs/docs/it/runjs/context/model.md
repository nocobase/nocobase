:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/model).
:::

# ctx.model

L'istanza `FlowModel` in cui si trova l'attuale contesto di esecuzione di RunJS. Funge da punto di ingresso predefinito per scenari come JSBlock, JSField e JSAction. Il tipo specifico varia in base al contesto: potrebbe trattarsi di una sottoclasse come `BlockModel`, `ActionModel` o `JSEditableFieldModel`.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock** | `ctx.model` è l'attuale modello del blocco. È possibile accedere a `resource`, `collection`, `setProps`, ecc. |
| **JSField / JSItem / JSColumn** | `ctx.model` è il modello del campo. È possibile accedere a `setProps`, `dispatchEvent`, ecc. |
| **Eventi di azione / ActionModel** | `ctx.model` è il modello dell'azione. È possibile leggere/scrivere i parametri dei passaggi, inviare eventi, ecc. |

> Suggerimento: Se è necessario accedere al **blocco genitore che ospita l'attuale JS** (ad esempio, un blocco Modulo o Tabella), utilizzi `ctx.blockModel`; per accedere ad **altri modelli**, utilizzi `ctx.getModel(uid)`.

## Definizione del tipo

```ts
model: FlowModel;
```

`FlowModel` è la classe base. In fase di esecuzione, è un'istanza di varie sottoclassi (come `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, ecc.). Le proprietà e i metodi disponibili dipendono dal tipo specifico.

## Proprietà comuni

| Proprietà | Tipo | Descrizione |
|------|------|------|
| `uid` | `string` | Identificatore univoco del modello. Può essere utilizzato per `ctx.getModel(uid)` o per il binding dell'UID dei popup. |
| `collection` | `Collection` | La collezione associata al modello attuale (presente quando il blocco/campo è collegato ai dati). |
| `resource` | `Resource` | Istanza della risorsa associata, utilizzata per l'aggiornamento, l'ottenimento delle righe selezionate, ecc. |
| `props` | `object` | Configurazione dell'interfaccia utente (UI) o del comportamento del modello. Può essere aggiornata tramite `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Insieme di sottomodelli (ad esempio, campi all'interno di un modulo, colonne all'interno di una tabella). |
| `parent` | `FlowModel` | Modello genitore (se presente). |

## Metodi comuni

| Metodo | Descrizione |
|------|------|
| `setProps(partialProps: any): void` | Aggiorna la configurazione del modello e attiva il rendering (es. `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Invia un evento al modello, attivando i flussi di lavoro configurati su quel modello che sono in ascolto di tale evento. Il `payload` opzionale viene passato all'handler del flusso di lavoro; `options.debounce` consente di attivare il debounce. |
| `getStepParams?.(flowKey, stepKey)` | Legge i parametri dei passaggi del flusso di configurazione (utilizzato nei pannelli delle impostazioni, azioni personalizzate, ecc.). |
| `setStepParams?.(flowKey, stepKey, params)` | Scrive i parametri dei passaggi del flusso di configurazione. |

## Relazione con ctx.blockModel e ctx.getModel

| Esigenza | Utilizzo raccomandato |
|------|----------|
| **Modello del contesto di esecuzione corrente** | `ctx.model` |
| **Blocco genitore dell'attuale JS** | `ctx.blockModel`. Spesso usato per accedere a `resource`, `form` o `collection`. |
| **Ottenere qualsiasi modello tramite UID** | `ctx.getModel(uid)` o `ctx.getModel(uid, true)` (ricerca tra gli stack di visualizzazione). |

In un JSField, `ctx.model` è il modello del campo, mentre `ctx.blockModel` è il blocco Modulo o Tabella che contiene tale campo.

## Esempi

### Aggiornamento dello stato del blocco/azione

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Invio di eventi del modello

```ts
// Invia un evento per attivare un flusso di lavoro configurato su questo modello che ascolta questo nome evento
await ctx.model.dispatchEvent('remove');

// Quando viene fornito un payload, questo viene passato a ctx.inputArgs dell'handler del flusso di lavoro
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Utilizzo dell'UID per il binding dei popup o l'accesso tra modelli

```ts
const myUid = ctx.model.uid;
// Nella configurazione del popup, è possibile passare openerUid: myUid per l'associazione
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Correlati

- [ctx.blockModel](./block-model.md): Il modello del blocco genitore in cui si trova l'attuale JS.
- [ctx.getModel()](./get-model.md): Ottenere altri modelli tramite UID.