:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Avanzate

## Introduzione

I Dipendenti AI possono essere associati a pagine o blocchi. Una volta associati, è possibile configurare attività specifiche per il business corrente, permettendo agli utenti di utilizzare rapidamente il Dipendente AI per gestire le attività direttamente dalla pagina o dal blocco.

## Associare un Dipendente AI a una Pagina

Dopo che la pagina è entrata in modalità di modifica UI, nell'angolo in basso a destra, accanto al pulsante di richiamo rapido del Dipendente AI, apparirà un segno '+'. Passando il mouse sul segno '+', verrà visualizzato un elenco di Dipendenti AI. Selezionando un Dipendente AI, questo verrà associato alla pagina corrente.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

Una volta completata l'associazione, ogni volta che si accede alla pagina, nell'angolo in basso a destra verrà visualizzato il Dipendente AI associato alla pagina corrente.

![20251022134903](https://static-docs.nocobase.com/20251022134903.png)

## Associare un Dipendente AI a un Blocco

Dopo che la pagina è entrata in modalità di modifica UI, su un blocco che supporta la configurazione di `Actions`, selezioni il menu `AI employees` sotto `Actions`, e poi scelga un Dipendente AI; questo verrà associato al blocco corrente.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Una volta completata l'associazione, ogni volta che si accede alla pagina, l'area `Actions` del blocco mostrerà il Dipendente AI associato al blocco corrente.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configurare le Attività

Dopo che la pagina è entrata in modalità di modifica UI, passi il mouse sull'icona del Dipendente AI associato alla pagina o al blocco. Apparirà un pulsante di menu. Selezioni `Edit tasks` per accedere alla pagina di configurazione delle attività.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

Una volta nella pagina di configurazione delle attività, può aggiungere più attività per il Dipendente AI corrente.

Ogni scheda rappresenta un'attività indipendente. Clicchi sul segno '+' accanto per aggiungere una nuova attività.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Modulo di configurazione delle attività:

- Nel campo `Title`, inserisca il titolo dell'attività. Descriva brevemente il contenuto dell'attività; questo titolo apparirà nell'elenco delle attività del Dipendente AI.
- Nel campo `Background`, inserisca il contenuto principale dell'attività. Questo contenuto verrà utilizzato come prompt di sistema durante la conversazione con il Dipendente AI.
- Nel campo `Default user message`, inserisca il messaggio utente predefinito da inviare. Verrà automaticamente compilato nel campo di input dell'utente dopo aver selezionato l'attività.
- In `Work context`, selezioni le informazioni di contesto dell'applicazione predefinite da inviare al Dipendente AI. Questa operazione è identica a quella eseguita nella finestra di dialogo.
- Il campo di selezione `Skills` mostra le competenze disponibili per il Dipendente AI corrente. Può deselezionare una competenza per fare in modo che il Dipendente AI la ignori e non la utilizzi durante l'esecuzione di questa attività.
- La casella di controllo `Send default user message automatically` configura se inviare automaticamente il messaggio utente predefinito dopo aver cliccato per eseguire l'attività.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Elenco delle Attività

Dopo aver configurato le attività per un Dipendente AI, queste verranno visualizzate nel popover del profilo del Dipendente AI e nel messaggio di benvenuto prima dell'inizio di una conversazione. Clicchi su un'attività per eseguirla.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)