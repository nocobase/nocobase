:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/exit-all).
:::

# ctx.exitAll()

Termina il flusso di eventi corrente e tutti i flussi di eventi successivi attivati nello stesso dispacciamento di eventi. Viene comunemente utilizzato quando è necessario interrompere immediatamente tutti i flussi di eventi associati all'evento corrente a causa di un errore globale o di una mancata convalida dei permessi.

## Scenari d'uso

`ctx.exitAll()` viene generalmente utilizzato nei contesti in cui è possibile eseguire JS e dove è necessario **interrompere simultaneamente il flusso di eventi corrente e i flussi di eventi successivi attivati da tale evento**:

| Scenario | Descrizione |
|------|------|
| **Flusso di eventi** | La convalida del flusso di eventi principale fallisce (ad esempio, permessi insufficienti), richiedendo l'interruzione del flusso principale e di qualsiasi flusso successivo nello stesso evento non ancora eseguito. |
| **Regole di collegamento** | Quando la convalida del collegamento fallisce, il collegamento corrente e i collegamenti successivi attivati dallo stesso evento devono essere terminati. |
| **Eventi di operazione** | La convalida pre-operazione fallisce (ad esempio, controllo dei permessi prima dell'eliminazione), richiedendo il blocco dell'operazione principale e dei passaggi successivi. |

> Differenza rispetto a `ctx.exit()`: `ctx.exit()` termina solo il flusso di eventi corrente; `ctx.exitAll()` termina il flusso di eventi corrente e tutti i flussi di eventi successivi **non ancora eseguiti** nello stesso dispacciamento di eventi.

## Definizione del tipo

```ts
exitAll(): never;
```

La chiamata a `ctx.exitAll()` lancia un'eccezione interna `FlowExitAllException`, che viene catturata dal motore dei flussi (FlowEngine) per arrestare l'istanza del flusso di eventi corrente e i flussi di eventi successivi sotto lo stesso evento. Una volta chiamata, le restanti istruzioni nel codice JS corrente non verranno eseguite.

## Confronto con ctx.exit()

| Metodo | Ambito di applicazione |
|------|----------|
| `ctx.exit()` | Termina solo il flusso di eventi corrente; i flussi di eventi successivi non sono influenzati. |
| `ctx.exitAll()` | Termina il flusso di eventi corrente e interrompe i flussi di eventi successivi eseguiti **sequenzialmente** sotto lo stesso evento. |

## Modalità di esecuzione

- **Esecuzione sequenziale (sequential)**: I flussi di eventi sotto lo stesso evento vengono eseguiti in ordine. Dopo che un qualsiasi flusso di eventi chiama `ctx.exitAll()`, i flussi di eventi successivi non verranno eseguiti.
- **Esecuzione parallela (parallel)**: I flussi di eventi sotto lo stesso evento vengono eseguiti in parallelo. La chiamata a `ctx.exitAll()` in un flusso di eventi non interromperà gli altri flussi di eventi concorrenti (poiché sono indipendenti).

## Esempi

### Terminare tutti i flussi di eventi in caso di fallimento della convalida dei permessi

```ts
// Interrompe il flusso di eventi principale e i flussi successivi se i permessi sono insufficienti
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Nessun permesso per l\'operazione' });
  ctx.exitAll();
}
```

### Terminare quando la preconvalida globale fallisce

```ts
// Esempio: Se prima dell'eliminazione si scopre che i dati associati non sono eliminabili,
// impedisce il flusso di eventi principale e le azioni successive
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Impossibile eliminare: esistono dati associati');
  ctx.exitAll();
}
```

### Scelta tra ctx.exit() e ctx.exitAll()

```ts
// Solo il flusso di eventi corrente deve terminare -> Usa ctx.exit()
if (!params.valid) {
  ctx.message.error('Parametri non validi');
  ctx.exit();  // I flussi di eventi successivi non sono influenzati
}

// È necessario terminare tutti i flussi di eventi successivi sotto l'evento corrente -> Usa ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Permessi insufficienti' });
  ctx.exitAll();  // Sia il flusso di eventi principale che i flussi successivi nello stesso evento vengono terminati
}
```

### Messaggio prima dell'interruzione

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Si prega di correggere prima gli errori nel modulo');
  ctx.exitAll();
}
```

## Note

- Dopo aver chiamato `ctx.exitAll()`, il codice successivo nel JS corrente non verrà eseguito. Si consiglia di spiegare la ragione all'utente tramite `ctx.message`, `ctx.notification` o una finestra modale prima della chiamata.
- Il codice aziendale solitamente non ha bisogno di catturare `FlowExitAllException`; lasci che sia il motore dei flussi a gestirlo.
- Se è necessario interrompere solo il flusso di eventi corrente senza influenzare quelli successivi, utilizzi `ctx.exit()`.
- In modalità parallela, `ctx.exitAll()` termina solo il flusso di eventi corrente e non interrompe gli altri flussi di eventi simultanei.

## Correlati

- [ctx.exit()](./exit.md): Termina solo il flusso di eventi corrente
- [ctx.message](./message.md): Messaggi di avviso
- [ctx.modal](./modal.md): Finestra modale di conferma