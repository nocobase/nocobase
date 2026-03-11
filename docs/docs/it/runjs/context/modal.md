:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/modal).
:::

# ctx.modal

Un'API rapida basata su Ant Design Modal, utilizzata per aprire attivamente finestre modali (suggerimenti informativi, popup di conferma, ecc.) in RunJS. È implementata da `ctx.viewer` / dal sistema di visualizzazione.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSField** | Visualizzare i risultati delle operazioni, messaggi di errore o conferme secondarie dopo l'interazione dell'utente. |
| **Flusso di lavoro / Eventi azione** | Popup di conferma prima dell'invio; interrompe i passaggi successivi tramite `ctx.exit()` se l'utente annulla. |
| **Regole di concatenazione** | Messaggi popup per l'utente quando la validazione fallisce. |

> Nota: `ctx.modal` è disponibile negli ambienti RunJS con un contesto di visualizzazione (come i JSBlock all'interno di una pagina, i flussi di lavoro, ecc.); potrebbe non essere presente nel backend o in contesti senza interfaccia utente (UI). Si consiglia di utilizzare l'optional chaining (`ctx.modal?.confirm?.()`) durante la chiamata.

## Definizione del tipo

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Restituisce true se l'utente clicca su OK, false se annulla
};
```

`ModalConfig` è coerente con la configurazione dei metodi statici di `Modal` di Ant Design.

## Metodi comuni

| Metodo | Valore di ritorno | Descrizione |
|------|--------|------|
| `info(config)` | `Promise<void>` | Finestra modale di suggerimento informativo |
| `success(config)` | `Promise<void>` | Finestra modale di successo |
| `error(config)` | `Promise<void>` | Finestra modale di errore |
| `warning(config)` | `Promise<void>` | Finestra modale di avviso |
| `confirm(config)` | `Promise<boolean>` | Finestra modale di conferma; restituisce `true` se l'utente clicca su OK e `false` se annulla |

## Parametri di configurazione

In linea con `Modal` di Ant Design, i campi comuni includono:

| Parametro | Tipo | Descrizione |
|------|------|------|
| `title` | `ReactNode` | Titolo |
| `content` | `ReactNode` | Contenuto |
| `okText` | `string` | Testo del pulsante OK |
| `cancelText` | `string` | Testo del pulsante Annulla (solo per `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Eseguito al clic su OK |
| `onCancel` | `() => void` | Eseguito al clic su Annulla |

## Relazione con ctx.message e ctx.openView

| Scopo | Utilizzo consigliato |
|------|----------|
| **Suggerimento temporaneo leggero** | `ctx.message`, scompare automaticamente |
| **Finestra modale Info/Successo/Errore/Avviso** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Conferma secondaria (richiede scelta utente)** | `ctx.modal.confirm`, usato con `ctx.exit()` per controllare il flusso |
| **Interazioni complesse come moduli o elenchi** | `ctx.openView` per aprire una vista personalizzata (pagina/drawer/modal) |

## Esempi

### Finestra modale informativa semplice

```ts
ctx.modal.info({
  title: 'Suggerimento',
  content: 'Operazione completata',
});
```

### Finestra modale di conferma e controllo del flusso

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Conferma eliminazione',
  content: 'È sicuro di voler eliminare questo record?',
  okText: 'Conferma',
  cancelText: 'Annulla',
});
if (!confirmed) {
  ctx.exit();  // Interrompe i passaggi successivi se l'utente annulla
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Finestra modale di conferma con onOk

```ts
await ctx.modal.confirm({
  title: 'Conferma invio',
  content: 'Le modifiche non potranno essere modificate dopo l\'invio. Continuare?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Suggerimento di errore

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Successo', content: 'Operazione completata' });
} catch (e) {
  ctx.modal.error({ title: 'Errore', content: e.message });
}
```

## Correlati

- [ctx.message](./message.md): Suggerimento temporaneo leggero, scompare automaticamente
- [ctx.exit()](./exit.md): Comunemente usato come `if (!confirmed) ctx.exit()` per interrompere il flusso quando un utente annulla la conferma
- [ctx.openView()](./open-view.md): Apre una vista personalizzata, adatta per interazioni complesse