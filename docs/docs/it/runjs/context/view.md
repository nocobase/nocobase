:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/view).
:::

# ctx.view

Il controller della vista attualmente attiva (finestra di dialogo, drawer, popover, area incorporata, ecc.), utilizzato per accedere alle informazioni e alle operazioni a livello di vista. Fornito da `FlowViewContext`, è disponibile solo all'interno del contenuto della vista aperto tramite `ctx.viewer` o `ctx.openView`.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **Contenuto di Dialog/Drawer** | Utilizzi `ctx.view.close()` all'interno del `content` per chiudere la vista corrente, oppure utilizzi `Header` e `Footer` per renderizzare titoli e piè di pagina. |
| **Dopo l'invio del modulo** | Chiami `ctx.view.close(result)` dopo un invio andato a buon fine per chiudere la vista e restituire il risultato. |
| **JSBlock / Azione** | Determini il tipo di vista corrente tramite `ctx.view.type`, o legga i parametri di apertura da `ctx.view.inputArgs`. |
| **Selezione di associazioni, sotto-tabelle** | Legga `collectionName`, `filterByTk`, `parentId`, ecc., da `inputArgs` per il caricamento dei dati. |

> Nota: `ctx.view` è disponibile solo negli ambienti RunJS con un contesto di vista (ad esempio, all'interno del `content` di `ctx.viewer.dialog()`, nei moduli pop-up o all'interno dei selettori di associazione). Nelle pagine standard o nei contesti backend, è `undefined`. Si consiglia di utilizzare l'optional chaining (`ctx.view?.close?.()`).

## Definizione del tipo

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Disponibile nelle viste di configurazione del flusso di lavoro
};
```

## Proprietà e metodi comuni

| Proprietà/Metodo | Tipo | Descrizione |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Tipo di vista corrente |
| `inputArgs` | `Record<string, any>` | Parametri passati all'apertura della vista (vedere sotto) |
| `Header` | `React.FC \| null` | Componente Header, utilizzato per renderizzare titoli e aree di azione |
| `Footer` | `React.FC \| null` | Componente Footer, utilizzato per renderizzare pulsanti, ecc. |
| `close(result?, force?)` | `void` | Chiude la vista corrente; `result` può essere restituito al chiamante |
| `update(newConfig)` | `void` | Aggiorna la configurazione della vista (es. larghezza, titolo) |
| `navigation` | `ViewNavigation \| undefined` | Navigazione della vista all'interno della pagina, inclusi il cambio di Tab, ecc. |

> Attualmente, solo `dialog` e `drawer` supportano `Header` e `Footer`.

## Campi comuni in inputArgs

I campi in `inputArgs` variano a seconda dello scenario di apertura. I campi comuni includono:

| Campo | Descrizione |
|------|------|
| `viewUid` | UID della vista |
| `collectionName` | Nome della collezione |
| `filterByTk` | Filtro per chiave primaria (per i dettagli di un singolo record) |
| `parentId` | ID genitore (per scenari di associazione) |
| `sourceId` | ID del record sorgente |
| `parentItem` | Dati dell'elemento genitore |
| `scene` | Scena (es. `create`, `edit`, `select`) |
| `onChange` | Callback dopo la selezione o la modifica |
| `tabUid` | UID del Tab corrente (all'interno di una pagina) |

Acceda a questi campi tramite `ctx.getVar('ctx.view.inputArgs.xxx')` o `ctx.view.inputArgs.xxx`.

## Esempi

### Chiusura della vista corrente

```ts
// Chiude la finestra di dialogo dopo un invio andato a buon fine
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Chiude e restituisce i risultati
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Utilizzo di Header / Footer nel contenuto

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Modifica" extra={<Button size="small">Aiuto</Button>} />
      <div>Contenuto del modulo...</div>
      <Footer>
        <Button onClick={() => close()}>Annulla</Button>
        <Button type="primary" onClick={handleSubmit}>Invia</Button>
      </Footer>
    </div>
  );
}
```

### Diramazione in base al tipo di vista o a inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Nasconde l'intestazione nelle viste incorporate
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Scenario del selettore utenti
}
```

## Relazione con ctx.viewer e ctx.openView

| Scopo | Utilizzo consigliato |
|------|----------|
| **Aprire una nuova vista** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` o `ctx.openView()` |
| **Operare sulla vista corrente** | `ctx.view.close()`, `ctx.view.update()` |
| **Ottenere i parametri di apertura** | `ctx.view.inputArgs` |

`ctx.viewer` è responsabile dell'"apertura" di una vista, mentre `ctx.view` rappresenta l'istanza della vista "corrente"; `ctx.openView` viene utilizzato per aprire viste del flusso di lavoro preconfigurate.

## Note

- `ctx.view` è disponibile solo all'interno di una vista; è `undefined` nelle pagine standard.
- Utilizzi l'optional chaining: `ctx.view?.close?.()` per evitare errori quando non esiste un contesto di vista.
- Il `result` di `close(result)` viene passato alla Promise restituita da `ctx.viewer.open()`.

## Correlati

- [ctx.openView()](./open-view.md): Aprire una vista del flusso di lavoro preconfigurata
- [ctx.modal](./modal.md): Popup leggeri (informazioni, conferma, ecc.)

> `ctx.viewer` fornisce metodi come `dialog()`, `drawer()`, `popover()` e `embed()` per aprire le viste. Il `content` aperto da questi metodi può accedere a `ctx.view`.