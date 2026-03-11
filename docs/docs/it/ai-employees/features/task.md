:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/ai-employees/features/task).
:::

# Attività rapide

Per consentire ai dipendenti AI di iniziare a lavorare in modo più efficiente, è possibile associare i dipendenti AI ai blocchi di scenario e preimpostare diverse attività comuni.

In questo modo, gli utenti possono avviare l'elaborazione delle attività con un solo clic, senza dover ogni volta **selezionare il blocco** e **inserire il comando**.

## Associazione di un dipendente AI a un blocco

Dopo essere entrati nella modalità di modifica dell'interfaccia utente (UI), per i blocchi che supportano le `Actions` (Azioni), selezioni la voce `AI employees` nel menu `Actions` e scelga un dipendente AI. Tale dipendente AI sarà quindi associato al blocco corrente.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Una volta completata l'associazione, ogni volta che si accede alla pagina, l'area delle azioni del blocco mostrerà il dipendente AI associato al blocco stesso.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configurazione delle attività

Dopo essere entrati nella modalità di modifica della UI, passi il mouse sopra l'icona del dipendente AI associato al blocco. Apparirà un pulsante di menu; selezioni `Edit tasks` (Modifica attività) per accedere alla pagina di impostazione delle attività.

Nella pagina di impostazione delle attività, può aggiungere più attività per il dipendente AI corrente.

Ogni scheda rappresenta un'attività indipendente; clicchi sul segno "+" accanto ad essa per aggiungere una nuova attività.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Modulo di impostazione dell'attività:

- Inserisca il titolo dell'attività nel campo `Title`. Il titolo apparirà nell'elenco delle attività del dipendente AI.
- Inserisca il contenuto principale dell'attività nel campo `Background`. Questo contenuto verrà utilizzato come prompt di sistema durante la conversazione con il dipendente AI.
- Inserisca il messaggio predefinito dell'utente nel campo `Default user message`. Questo verrà inserito automaticamente nella casella di input dopo aver selezionato l'attività.
- In `Work context`, scelga le informazioni sul contesto dell'applicazione da inviare come impostazione predefinita al dipendente AI. Questa operazione funziona allo stesso modo del pannello di chat.
- Il selettore `Skills` mostra le competenze disponibili per il dipendente AI corrente. È possibile disabilitare una competenza affinché non venga utilizzata per questa specifica attività.
- La casella di controllo `Send default user message automatically` configura se inviare automaticamente il messaggio predefinito dell'utente dopo aver cliccato per eseguire l'attività.


## Elenco delle attività

Una volta configurate le attività, queste appariranno nella finestra a comparsa del profilo del dipendente AI e nel messaggio di saluto prima dell'inizio della conversazione. Clicchi su un'attività per eseguirla.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)