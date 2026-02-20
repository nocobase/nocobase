---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Collezione SQL

## Introduzione

La collezione SQL offre un metodo potente per recuperare dati tramite query SQL. Estrando i campi dati tramite query SQL e configurando i metadati associati, gli utenti possono utilizzare questi campi come se stessero lavorando con una tabella standard. Questa funzionalità è particolarmente utile per scenari che includono query di join complesse, analisi statistiche e altro ancora.

## Manuale Utente

### Creazione di una Nuova Collezione SQL

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Inserisca la sua query SQL nell'apposito campo e clicchi su Esegui (Execute). Il sistema analizzerà la query per determinare le tabelle e i campi coinvolti, estraendo automaticamente i metadati dei campi pertinenti dalle tabelle di origine.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Se l'analisi del sistema delle tabelle e dei campi di origine non è corretta, può selezionare manualmente le tabelle e i campi appropriati per assicurarsi che vengano utilizzati i metadati corretti. Inizi selezionando la tabella di origine, quindi scelga i campi corrispondenti nella sezione "origine campo" sottostante.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. Per i campi che non hanno un'origine diretta, il sistema inferirà il tipo di campo basandosi sul tipo di dato. Se questa inferenza non è corretta, può selezionare manualmente il tipo di campo appropriato.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Mentre configura ogni campo, può visualizzare un'anteprima della sua visualizzazione nell'area di anteprima, permettendole di vedere l'impatto immediato delle sue impostazioni.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Dopo aver completato la configurazione e aver confermato che tutto è corretto, clicchi sul pulsante Conferma (Confirm) sotto il campo di input SQL per finalizzare l'invio.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Modifica

1. Se ha bisogno di modificare la query SQL, clicchi sul pulsante Modifica (Edit) per alterare direttamente l'istruzione SQL e riconfigurare i campi secondo necessità.

2. Per regolare i metadati dei campi, utilizzi l'opzione Configura Campi (Configure fields), che le permette di aggiornare le impostazioni dei campi proprio come farebbe per una tabella normale.

### Sincronizzazione

Se la query SQL rimane invariata ma la struttura della tabella del database sottostante è stata modificata, può sincronizzare e riconfigurare i campi selezionando Configura Campi (Configure fields) - Sincronizza dal Database (Sync from database).

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Collezione SQL vs. Viste di Database Collegate

| Tipo di Modello | Ideale Per | Metodo di Implementazione | Supporto Operazioni CRUD |
| :--- | :--- | :--- | :--- |
| SQL | Modelli semplici, casi d'uso leggeri<br />Interazione limitata con il database<br />Evitare la manutenzione delle viste<br />Preferenza per operazioni guidate dall'interfaccia utente | Sottoconsultazione SQL | Non Supportato |
| Connessione a vista di database | Modelli complessi<br />Richiede interazione con il database<br />Necessità di modifica dei dati<br />Richiede un supporto database più robusto e stabile | Vista di database | Parzialmente Supportato |

:::warning
Quando utilizza una collezione SQL, si assicuri di selezionare tabelle gestibili all'interno di NocoBase. L'utilizzo di tabelle dallo stesso database che non sono connesse a NocoBase potrebbe portare a un'analisi imprecisa delle query SQL. Se questo è un problema, consideri di creare e collegare una vista.
:::