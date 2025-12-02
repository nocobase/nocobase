:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Confronto tra database principale e database esterni

Le differenze tra il database principale e i database esterni in NocoBase si manifestano principalmente in quattro aspetti: supporto per i tipi di database, supporto per i tipi di collezione, supporto per i tipi di campo e capacità di backup e migrazione.

## 1. Supporto per i tipi di database

Per maggiori dettagli, consulti: [Gestione delle fonti dati](https://docs.nocobase.com/data-sources/data-source-manager)

### Tipi di database

| Tipo di database | Supporto database principale | Supporto database esterno |
|------------------|-----------------------------|--------------------------|
| PostgreSQL       | ✅                          | ✅                       |
| MySQL            | ✅                          | ✅                       |
| MariaDB          | ✅                          | ✅                       |
| KingbaseES       | ✅                          | ✅                       |
| MSSQL            | ❌                          | ✅                       |
| Oracle           | ❌                          | ✅                       |

### Gestione delle collezioni

| Gestione delle collezioni | Supporto database principale | Supporto database esterno |
|---------------------------|-----------------------------|--------------------------|
| Gestione di base          | ✅                          | ✅                       |
| Gestione visuale          | ✅                          | ❌                       |

## 2. Supporto per i tipi di collezione

Per maggiori dettagli, consulti: [Collezioni](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Tipo di collezione         | Database principale | Database esterno | Descrizione                                                              |
|----------------------------|---------------------|------------------|--------------------------------------------------------------------------|
| Generica                   | ✅                  | ✅               | Collezione di base                                                       |
| Vista                      | ✅                  | ✅               | Vista della fonte dati                                                   |
| Ereditarietà               | ✅                  | ❌               | Supporta l'ereditarietà del modello di dati, solo per il database principale |
| File                       | ✅                  | ❌               | Supporta il caricamento di file, solo per il database principale         |
| Commenti                   | ✅                  | ❌               | Sistema di commenti integrato, solo per il database principale           |
| Calendario                 | ✅                  | ❌               | Collezione per le viste calendario                                       |
| Espressione                | ✅                  | ❌               | Supporta calcoli con formule                                             |
| Albero                     | ✅                  | ❌               | Per la modellazione di dati con struttura ad albero                      |
| SQL                        | ✅                  | ❌               | Collezione definita tramite SQL                                          |
| Connessione esterna        | ✅                  | ❌               | Collezione di connessione per fonti dati esterne, funzionalità limitata |

## 3. Supporto per i tipi di campo

Per maggiori dettagli, consulti: [Campi delle collezioni](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Tipi di base

| Tipo di campo         | Database principale | Database esterno |
|-----------------------|---------------------|------------------|
| Testo su riga singola | ✅                  | ✅               |
| Testo lungo           | ✅                  | ✅               |
| Numero di telefono    | ✅                  | ✅               |
| Email                 | ✅                  | ✅               |
| URL                   | ✅                  | ✅               |
| Numero intero         | ✅                  | ✅               |
| Numero                | ✅                  | ✅               |
| Percentuale           | ✅                  | ✅               |
| Password              | ✅                  | ✅               |
| Colore                | ✅                  | ✅               |
| Icona                 | ✅                  | ✅               |

### Tipi di selezione

| Tipo di campo             | Database principale | Database esterno |
|---------------------------|---------------------|------------------|
| Casella di controllo      | ✅                  | ✅               |
| Selezione singola         | ✅                  | ✅               |
| Selezione multipla        | ✅                  | ✅               |
| Gruppo di opzioni         | ✅                  | ✅               |
| Gruppo di caselle di controllo | ✅                  | ✅               |
| Regione cinese            | ✅                  | ❌               |

### Tipi multimediali

| Tipo di campo       | Database principale | Database esterno |
|---------------------|---------------------|------------------|
| Media               | ✅                  | ✅               |
| Markdown            | ✅                  | ✅               |
| Markdown (Vditor)   | ✅                  | ✅               |
| Testo formattato    | ✅                  | ✅               |
| Allegato (Associazione) | ✅                  | ❌               |
| Allegato (URL)      | ✅                  | ✅               |

### Tipi di data e ora

| Tipo di campo                 | Database principale | Database esterno |
|-------------------------------|---------------------|------------------|
| Data e ora (con fuso orario)  | ✅                  | ✅               |
| Data e ora (senza fuso orario) | ✅                  | ✅               |
| Timestamp Unix                | ✅                  | ✅               |
| Data (senza ora)              | ✅                  | ✅               |
| Ora                           | ✅                  | ✅               |

### Tipi geometrici

| Tipo di campo | Database principale | Database esterno |
|---------------|---------------------|------------------|
| Punto         | ✅                  | ✅               |
| Linea         | ✅                  | ✅               |
| Cerchio       | ✅                  | ✅               |
| Poligono      | ✅                  | ✅               |

### Tipi avanzati

| Tipo di campo           | Database principale | Database esterno |
|-------------------------|---------------------|------------------|
| UUID                    | ✅                  | ✅               |
| Nano ID                 | ✅                  | ✅               |
| Ordinamento             | ✅                  | ✅               |
| Formula                 | ✅                  | ✅               |
| Sequenza automatica     | ✅                  | ✅               |
| JSON                    | ✅                  | ✅               |
| Selettore di collezione | ✅                  | ❌               |
| Crittografia            | ✅                  | ✅               |

### Campi informazioni di sistema

| Tipo di campo         | Database principale | Database esterno |
|-----------------------|---------------------|------------------|
| Data di creazione     | ✅                  | ✅               |
| Data ultima modifica  | ✅                  | ✅               |
| Creato da             | ✅                  | ❌               |
| Ultima modifica di    | ✅                  | ❌               |
| OID tabella           | ✅                  | ❌               |

### Tipi di associazione

| Tipo di campo         | Database principale | Database esterno |
|-----------------------|---------------------|------------------|
| Uno a uno             | ✅                  | ✅               |
| Uno a molti           | ✅                  | ✅               |
| Molti a uno           | ✅                  | ✅               |
| Molti a molti         | ✅                  | ✅               |
| Molti a molti (array) | ✅                  | ✅               |

:::info
I campi allegato dipendono dalle collezioni di file, che sono supportate solo dai database principali. Pertanto, i database esterni attualmente non supportano i campi allegato.
:::

## 4. Confronto del supporto per backup e migrazione

| Funzionalità          | Database principale | Database esterno     |
|-----------------------|---------------------|----------------------|
| Backup e ripristino   | ✅                  | ❌ (Gestito dall'utente) |
| Gestione della migrazione | ✅                  | ❌ (Gestito dall'utente) |

:::info
NocoBase offre funzionalità di backup, ripristino e migrazione della struttura per i database principali. Per i database esterni, queste operazioni devono essere eseguite autonomamente dagli utenti in base al proprio ambiente database. NocoBase non fornisce un supporto integrato.
:::

## Riepilogo del confronto

| Elemento di confronto        | Database principale                               | Database esterno                                     |
|------------------------------|---------------------------------------------------|------------------------------------------------------|
| Tipi di database             | PostgreSQL, MySQL, MariaDB, KingbaseES            | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Supporto tipi di collezione  | Tutti i tipi di collezione                        | Solo collezioni generiche e di vista                 |
| Supporto tipi di campo       | Tutti i tipi di campo                             | Tutti i tipi di campo, eccetto i campi allegato      |
| Backup e migrazione          | Supporto integrato                                | Gestito dall'utente                                  |

## Consigli

-   **Se sta utilizzando NocoBase per costruire un nuovo sistema aziendale**, Le consigliamo di usare il **database principale**, in quanto Le permetterà di sfruttare tutte le funzionalità di NocoBase.
-   **Se invece sta utilizzando NocoBase per connettersi ai database di altri sistemi per operazioni CRUD di base**, allora utilizzi i **database esterni**.