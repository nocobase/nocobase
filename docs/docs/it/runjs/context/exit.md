:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/exit).
:::

# ctx.exit()

Termina l'esecuzione del flusso di eventi corrente; i passaggi successivi non verranno eseguiti. Viene comunemente utilizzato quando le condizioni aziendali non sono soddisfatte, l'utente annulla l'operazione o si verifica un errore irreversibile.

## Casi d'uso

`ctx.exit()` viene generalmente utilizzato nei seguenti contesti in cui è possibile eseguire codice JS:

| Scenario | Descrizione |
|------|------|
| **Flusso di eventi** | Nei flussi di eventi attivati dall'invio di moduli, clic sui pulsanti, ecc., interrompe i passaggi successivi quando le condizioni non sono soddisfatte. |
| **Regole di collegamento** | Nei collegamenti tra campi, collegamenti di filtri, ecc., termina il flusso di eventi corrente in caso di fallimento della validazione o quando l'esecuzione deve essere saltata. |
| **Eventi di azione** | Nelle azioni personalizzate (ad es. conferma di eliminazione, validazione pre-salvataggio), esce quando l'utente annulla o la validazione fallisce. |

> Differenza rispetto a `ctx.exitAll()`: `ctx.exit()` termina solo il flusso di eventi corrente; gli altri flussi di eventi sotto lo stesso evento non vengono influenzati. `ctx.exitAll()` termina il flusso di eventi corrente e tutti i flussi di eventi successivi sotto lo stesso evento che non sono ancora stati eseguiti.

## Definizione del tipo

```ts
exit(): never;
```

La chiamata a `ctx.exit()` lancia un'eccezione interna `FlowExitException`, che viene catturata dal motore del flusso di eventi per interrompere l'esecuzione del flusso corrente. Una volta chiamata, le restanti istruzioni nel codice JS corrente non verranno eseguite.

## Confronto con ctx.exitAll()

| Metodo | Ambito di applicazione |
|------|----------|
| `ctx.exit()` | Termina solo il flusso di eventi corrente; i flussi di eventi successivi non sono influenzati. |
| `ctx.exitAll()` | Termina il flusso di eventi corrente e interrompe i flussi di eventi successivi sotto lo stesso evento impostati per l'**esecuzione sequenziale**. |

## Esempi

### Uscita in caso di annullamento da parte dell'utente

```ts
// In un modal di conferma, termina il flusso di eventi se l'utente clicca su annulla
if (!confirmed) {
  ctx.message.info('Operazione annullata');
  ctx.exit();
}
```

### Uscita in caso di fallimento della validazione dei parametri

```ts
// Avvisa e termina quando la validazione fallisce
if (!params.value || params.value.length < 3) {
  ctx.message.error('Parametri non validi, la lunghezza deve essere almeno 3');
  ctx.exit();
}
```

### Uscita quando le condizioni aziendali non sono soddisfatte

```ts
// Termina se le condizioni non sono soddisfatte; i passaggi successivi non verranno eseguiti
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'È possibile inviare solo bozze' });
  ctx.exit();
}
```

### Scelta tra ctx.exit() e ctx.exitAll()

```ts
// Solo il flusso di eventi corrente deve uscire → Usare ctx.exit()
if (!params.valid) {
  ctx.message.error('Parametri non validi');
  ctx.exit();  // Gli altri flussi di eventi non sono influenzati
}

// È necessario terminare tutti i flussi di eventi successivi sotto l'evento corrente → Usare ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Permessi insufficienti' });
  ctx.exitAll();  // Sia il flusso di eventi corrente che i flussi di eventi successivi sotto lo stesso evento vengono terminati
}
```

### Uscita in base alla scelta dell'utente dopo la conferma del modal

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Conferma eliminazione',
  content: 'Questa azione non può essere annullata. Continuare?',
});
if (!ok) {
  ctx.message.info('Annullato');
  ctx.exit();
}
```

## Note

- Dopo aver chiamato `ctx.exit()`, il codice successivo nel JS corrente non verrà eseguito; si consiglia di spiegare il motivo all'utente tramite `ctx.message`, `ctx.notification` o un modal prima della chiamata.
- In genere non è necessario catturare `FlowExitException` nel codice aziendale; lasci che se ne occupi il motore del flusso di eventi.
- Se è necessario terminare tutti i flussi di eventi successivi sotto l'evento corrente, utilizzi `ctx.exitAll()`.

## Correlati

- [ctx.exitAll()](./exit-all.md): Termina il flusso di eventi corrente e i flussi di eventi successivi sotto lo stesso evento.
- [ctx.message](./message.md): Messaggi di avviso.
- [ctx.modal](./modal.md): Modal di conferma.