---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Database Principale

## Introduzione

Il database principale di NocoBase può essere utilizzato sia per archiviare i dati aziendali che per i metadati dell'applicazione, inclusi i dati delle tabelle di sistema e delle tabelle personalizzate. Il database principale supporta database relazionali come MySQL, PostgreSQL, ecc. Durante l'installazione dell'applicazione NocoBase, il database principale deve essere installato contemporaneamente e non può essere eliminato.

## Installazione

Questo è un `plugin` integrato, non richiede un'installazione separata.

## Gestione delle Collezioni

La `fonte dati` principale offre funzionalità complete per la gestione delle `collezioni`, permettendole di creare nuove tabelle tramite NocoBase e di sincronizzare le strutture di tabelle esistenti dal database.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Sincronizzazione di Tabelle Esistenti dal Database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Una caratteristica importante della `fonte dati` principale è la possibilità di sincronizzare le tabelle già esistenti nel database con NocoBase per la gestione. Questo significa:

-   **Protezione degli Investimenti Esistenti**: Se nel Suo database esistono già numerose tabelle aziendali, non è necessario ricrearle; può sincronizzarle e utilizzarle direttamente.
-   **Integrazione Flessibile**: Le tabelle create tramite altri strumenti (come script SQL, strumenti di gestione di database, ecc.) possono essere gestite direttamente da NocoBase.
-   **Migrazione Progressiva**: Supporta la migrazione graduale dei sistemi esistenti a NocoBase, anziché una rifattorizzazione completa.

Tramite la funzione "Carica dal Database", Lei può:
1.  Visualizzare tutte le tabelle nel database
2.  Selezionare le tabelle che desidera sincronizzare
3.  Identificare automaticamente le strutture delle tabelle e i tipi di campo
4.  Importarle in NocoBase per la gestione con un solo clic.

### Supporto per Diversi Tipi di Collezioni

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase supporta la creazione e la gestione di vari tipi di `collezioni`:
-   **Collezione Generale**: include campi di sistema di uso comune.
-   **Collezione Ereditata**: permette di creare una tabella padre da cui possono essere derivate tabelle figlie. Le tabelle figlie ereditano la struttura della tabella padre e possono definire le proprie colonne.
-   **Collezione ad Albero**: tabella con struttura ad albero, attualmente supporta solo il design a lista di adiacenza.
-   **Collezione Calendario**: per la creazione di tabelle di eventi legate al calendario.
-   **Collezione File**: per la gestione dell'archiviazione dei file.
-   **Collezione Espressione**: per scenari di espressioni dinamiche nei `flussi di lavoro`.
-   **Collezione SQL**: non è una vera e propria tabella di database, ma presenta rapidamente le query SQL in modo strutturato.
-   **Collezione Vista Database**: si connette a viste di database esistenti.
-   **Collezione FDW**: consente al sistema di database di accedere e interrogare direttamente i dati in `fonti dati` esterne, basata sulla tecnologia FDW.

### Supporto per la Gestione Classificata delle Collezioni

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Tipi di Campo Ricchi e Vari

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversione Flessibile dei Tipi di Campo

NocoBase supporta la conversione flessibile dei tipi di campo basata sullo stesso tipo di database.

**Esempio: Opzioni di Conversione per Campi di Tipo Stringa**

Quando un campo del database è di tipo Stringa, può essere convertito in NocoBase in una delle seguenti forme:

-   **Base**: Testo su riga singola, Testo lungo, Numero di telefono, Email, URL, Password, Colore, Icona
-   **Scelta**: Menu a discesa (selezione singola), Gruppo di opzioni (radio button)
-   **Media Ricchi**: Markdown, Markdown (Vditor), Testo formattato, Allegato (URL)
-   **Data e Ora**: Data e ora (con fuso orario), Data e ora (senza fuso orario)
-   **Avanzate**: Sequenza, Selettore `collezione`, Crittografia

Questo meccanismo di conversione flessibile significa che:
-   **Nessuna Modifica alla Struttura del Database Richiesta**: Il tipo di archiviazione sottostante del campo rimane invariato; cambia solo la sua rappresentazione in NocoBase.
-   **Adattamento ai Cambiamenti Aziendali**: Con l'evoluzione delle esigenze aziendali, è possibile regolare rapidamente la visualizzazione e le modalità di interazione dei campi.
-   **Sicurezza dei Dati**: Il processo di conversione non influisce sull'integrità dei dati esistenti.

### Sincronizzazione Flessibile a Livello di Campo

NocoBase non solo sincronizza intere tabelle, ma supporta anche una gestione granulare della sincronizzazione a livello di campo:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Caratteristiche della Sincronizzazione dei Campi:

1.  **Sincronizzazione in Tempo Reale**: Quando la struttura della tabella del database cambia, i campi appena aggiunti possono essere sincronizzati in qualsiasi momento.
2.  **Sincronizzazione Selettiva**: È possibile sincronizzare selettivamente solo i campi necessari, anziché tutti i campi.
3.  **Riconoscimento Automatico del Tipo**: Identifica automaticamente i tipi di campo del database e li mappa ai tipi di campo di NocoBase.
4.  **Mantenimento dell'Integrità dei Dati**: Il processo di sincronizzazione non influisce sui dati esistenti.

#### Casi d'Uso:

-   **Evoluzione dello Schema del Database**: Quando le esigenze aziendali cambiano e devono essere aggiunti nuovi campi al database, questi possono essere rapidamente sincronizzati con NocoBase.
-   **Collaborazione in Team**: Quando altri membri del team o DBA aggiungono campi al database, questi possono essere sincronizzati tempestivamente.
-   **Modalità di Gestione Ibrida**: Alcuni campi sono gestiti tramite NocoBase, altri tramite metodi tradizionali, consentendo combinazioni flessibili.

Questo meccanismo di sincronizzazione flessibile consente a NocoBase di integrarsi perfettamente nelle architetture tecniche esistenti, senza richiedere modifiche alle pratiche di gestione del database esistenti, pur godendo della comodità dello sviluppo low-code offerta da NocoBase.

Per maggiori dettagli, consulti la sezione 「[Campi delle Collezioni / Panoramica](/data-sources/data-modeling/collection-fields)」.