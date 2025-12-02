:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

Un trigger è il punto di ingresso per un flusso di lavoro. Quando un evento che soddisfa le condizioni del trigger si verifica durante l'esecuzione dell'applicazione, il flusso di lavoro viene attivato ed eseguito. Il tipo di trigger definisce anche il tipo di flusso di lavoro; viene selezionato al momento della creazione e non può essere modificato in seguito. I tipi di trigger attualmente supportati sono i seguenti:

- [Eventi della collezione](./collection) (Integrato)
- [Pianificazione](./schedule) (Integrato)
- [Prima dell'azione](./pre-action) (Fornito dal plugin @nocobase/plugin-workflow-request-interceptor)
- [Dopo l'azione](./post-action) (Fornito dal plugin @nocobase/plugin-workflow-action-trigger)
- [Azione personalizzata](./custom-action) (Fornito dal plugin @nocobase/plugin-workflow-custom-action-trigger)
- [Approvazione](./approval) (Fornito dal plugin @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (Fornito dal plugin @nocobase/plugin-workflow-webhook)

La tempistica di attivazione di ciascun evento è illustrata nella figura seguente:

![Eventi del flusso di lavoro](https://static-docs.nocobase.com/20251029221709.png)

Ad esempio, un flusso di lavoro configurato può essere attivato quando un utente invia un modulo, quando i dati in una collezione cambiano a seguito di un'azione utente o di una chiamata di programma, oppure quando un'attività pianificata raggiunge il suo orario di esecuzione.

I trigger legati ai dati (come azioni, eventi della collezione) solitamente veicolano dati di contesto del trigger. Questi dati fungono da variabili e possono essere utilizzati dai nodi nel flusso di lavoro come parametri di elaborazione per realizzare l'automazione del trattamento dei dati. Ad esempio, quando un utente invia un modulo, se il pulsante di invio è collegato a un flusso di lavoro, quest'ultimo verrà attivato ed eseguito. I dati inviati verranno iniettati nell'ambiente di contesto del piano di esecuzione affinché i nodi successivi possano utilizzarli come variabili.

Dopo aver creato un flusso di lavoro, nella pagina di visualizzazione del flusso di lavoro, il trigger viene visualizzato come un nodo di ingresso all'inizio del processo. Cliccando su questa scheda si aprirà il pannello di configurazione. A seconda del tipo di trigger, è possibile configurarne le condizioni pertinenti.

![Trigger_Nodo di ingresso](https://static-docs.nocobase.com/20251029222231.png)