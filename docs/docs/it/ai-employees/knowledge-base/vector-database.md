:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Database Vettoriale

## Introduzione

All'interno di una base di conoscenza, il database vettoriale archivia i documenti della base di conoscenza vettorializzati. I documenti vettorializzati fungono da indice per i documenti stessi.

Quando il recupero RAG è abilitato in una conversazione con un agente AI, il messaggio dell'utente viene vettorializzato e i frammenti dei documenti della base di conoscenza vengono recuperati dal database vettoriale per trovare paragrafi e testi originali pertinenti.

Attualmente, il plugin Base di Conoscenza AI supporta nativamente solo PGVector, un plugin per database PostgreSQL.

## Gestione del Database Vettoriale

Acceda alla pagina di configurazione del plugin Agente AI, clicchi sulla scheda `Vector store` e selezioni `Vector database` per accedere alla pagina di gestione del database vettoriale.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Clicchi sul pulsante `Add new` in alto a destra per aggiungere una nuova connessione al database vettoriale `PGVector`:

- Nel campo `Name`, inserisca il nome della connessione;
- Nel campo `Host`, inserisca l'indirizzo IP del database vettoriale;
- Nel campo `Port`, inserisca il numero di porta del database vettoriale;
- Nel campo `Username`, inserisca il nome utente del database vettoriale;
- Nel campo `Password`, inserisca la password del database vettoriale;
- Nel campo `Database`, inserisca il nome del database;
- Nel campo `Table name`, inserisca il nome della tabella, che verrà utilizzato per creare una nuova tabella dove archiviare i dati vettoriali;

Dopo aver inserito tutte le informazioni necessarie, clicchi sul pulsante `Test` per verificare la disponibilità del servizio del database vettoriale, quindi clicchi sul pulsante `Submit` per salvare le informazioni di connessione.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)