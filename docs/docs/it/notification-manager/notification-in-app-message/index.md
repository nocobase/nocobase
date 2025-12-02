---
pkg: '@nocobase/plugin-notification-in-app-message'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Notifica: Messaggio in-app

## Introduzione

Permette agli utenti di ricevere notifiche di messaggi in tempo reale direttamente all'interno dell'applicazione NocoBase.

## Installazione

Questo plugin è integrato, quindi non è richiesta alcuna installazione aggiuntiva.

## Aggiungere un canale di messaggi in-app

Acceda alla Gestione Notifiche, clicchi sul pulsante Aggiungi e selezioni Messaggio in-app.
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Dopo aver inserito il nome e la descrizione del canale, clicchi su Invia.
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

Il nuovo canale apparirà ora nell'elenco.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Esempio di caso d'uso

Per aiutarLa a comprendere meglio come utilizzare i messaggi in-app, ecco un esempio di "Follow-up dei lead di marketing".

Immagini che il Suo team stia conducendo un'importante campagna di marketing volta a monitorare le risposte e le esigenze dei potenziali clienti. Utilizzando i messaggi in-app, Lei può:

**Creare un canale di notifica**: Innanzitutto, nella Gestione Notifiche, configuri un canale di messaggi in-app chiamato "Marketing Clue" per assicurarsi che i membri del team possano identificarne chiaramente lo scopo.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Configurare un flusso di lavoro**: Crea un **flusso di lavoro** che attivi automaticamente una notifica quando viene generato un nuovo lead di marketing. Può aggiungere un nodo di notifica al **flusso di lavoro**, selezionare il canale "Marketing Clue" che ha creato e configurare il contenuto del messaggio secondo necessità. Ad esempio:

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Ricevere notifiche in tempo reale**: Una volta attivato il **flusso di lavoro**, tutto il personale pertinente riceverà notifiche in tempo reale, assicurando che il team possa rispondere e agire rapidamente.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Gestione e tracciamento dei messaggi**: I messaggi in-app sono raggruppati in base al nome del canale. Può filtrare i messaggi in base al loro stato di lettura e non lettura per visualizzare rapidamente le informazioni importanti. Cliccando sul pulsante "Visualizza" verrà reindirizzato alla pagina del link configurato per ulteriori azioni.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)