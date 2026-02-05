:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Associare un flusso di lavoro

## Introduzione

Su alcuni pulsanti di azione, è possibile configurare un flusso di lavoro associato per collegare l'operazione a un flusso di lavoro, realizzando l'elaborazione automatica dei dati.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Operazioni e tipi di flusso di lavoro supportati

I pulsanti di azione e i tipi di flusso di lavoro attualmente supportati sono i seguenti:

| Pulsante di azione \ Tipo di flusso di lavoro | Evento pre-azione | Evento post-azione | Evento di approvazione | Evento di azione personalizzata |
| --- | --- | --- | --- | --- |
| Pulsanti "Invia", "Salva" del modulo | ✅ | ✅ | ✅ | ❌ |
| Pulsante "Aggiorna record" nelle righe di dati (Tabella, Elenco, ecc.) | ✅ | ✅ | ✅ | ❌ |
| Pulsante "Elimina" nelle righe di dati (Tabella, Elenco, ecc.) | ✅ | ❌ | ❌ | ❌ |
| Pulsante "Attiva flusso di lavoro" | ❌ | ❌ | ❌ | ✅ |

## Associazione di più flussi di lavoro

Un pulsante di azione può essere associato a più flussi di lavoro. Quando sono associati più flussi di lavoro, il loro ordine di esecuzione segue queste regole:

1.  Per i flussi di lavoro dello stesso tipo di attivazione, i flussi di lavoro sincroni vengono eseguiti per primi, seguiti da quelli asincroni.
2.  I flussi di lavoro dello stesso tipo di attivazione vengono eseguiti nell'ordine configurato.
3.  Tra flussi di lavoro di diversi tipi di attivazione:
    1.  Gli eventi pre-azione vengono sempre eseguiti prima degli eventi post-azione e di approvazione.
    2.  Gli eventi post-azione e di approvazione non hanno un ordine specifico e la logica di business non dovrebbe dipendere dall'ordine di configurazione.

## Maggiori informazioni

Per i diversi tipi di eventi del flusso di lavoro, si prega di fare riferimento alla documentazione dettagliata dei plugin pertinenti:

*   [Evento post-azione]
*   [Evento pre-azione]
*   [Evento di approvazione]
*   [Evento di azione personalizzata]