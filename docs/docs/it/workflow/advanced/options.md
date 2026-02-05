:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Configurazione Avanzata

## Modalità di Esecuzione

I flussi di lavoro vengono eseguiti in modalità "asincrona" o "sincrona", a seconda del tipo di trigger selezionato durante la creazione. La modalità asincrona significa che, dopo l'attivazione di un evento specifico, il flusso di lavoro entra in una coda e viene eseguito uno per uno dalla pianificazione in background. La modalità sincrona, invece, non entra nella coda di pianificazione dopo essere stata attivata; inizia l'esecuzione direttamente e fornisce un feedback immediato al completamento.

Gli eventi di collezione, gli eventi "dopo l'azione", gli eventi di azione personalizzata, gli eventi programmati e gli eventi di approvazione vengono eseguiti in modo asincrono per impostazione predefinita. Gli eventi "prima dell'azione" vengono eseguiti in modo sincrono per impostazione predefinita. Sia gli eventi di collezione che gli eventi di modulo supportano entrambe le modalità, che possono essere selezionate al momento della creazione di un flusso di lavoro:

![Modalità Sincrona_Crea Flusso di Lavoro Sincrono](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Nota}
A causa della loro natura, i flussi di lavoro in modalità sincrona non possono utilizzare nodi che producono uno stato di "attesa", come "Elaborazione manuale".
:::

## Eliminazione Automatica della Cronologia di Esecuzione

Quando un flusso di lavoro viene attivato frequentemente, è possibile configurare l'eliminazione automatica della cronologia di esecuzione per ridurre il disordine e alleviare la pressione di archiviazione sul database.

È possibile configurare l'eliminazione automatica della cronologia di esecuzione per un flusso di lavoro anche nelle sue finestre di dialogo di creazione e modifica:

![Configurazione Eliminazione Automatica Cronologia di Esecuzione](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

L'eliminazione automatica può essere configurata in base allo stato del risultato dell'esecuzione. Nella maggior parte dei casi, si consiglia di selezionare solo lo stato "Completato" per conservare i record delle esecuzioni fallite, utili per la risoluzione dei problemi futuri.

Si consiglia di non abilitare l'eliminazione automatica della cronologia di esecuzione durante il debug di un flusso di lavoro, in modo da poter utilizzare la cronologia per verificare se la logica di esecuzione del flusso di lavoro è conforme alle aspettative.

:::info{title=Nota}
L'eliminazione della cronologia di un flusso di lavoro non riduce il suo conteggio delle esecuzioni.
:::