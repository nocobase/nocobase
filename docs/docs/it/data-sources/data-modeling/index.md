:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

La modellazione dei dati è un passaggio fondamentale nella progettazione dei database, che implica un processo di analisi approfondita e astrazione di vari tipi di dati del mondo reale e delle loro interrelazioni. In questo processo, cerchiamo di rivelare le connessioni intrinseche tra i dati e di formalizzarle in modelli di dati, ponendo le basi per la struttura del database del sistema informativo. NocoBase è una piattaforma basata su modelli di dati, con le seguenti caratteristiche:

## Supporta l'accesso a dati da diverse fonti

Le fonti dati di NocoBase possono essere vari tipi di database comuni, piattaforme API (SDK) e file.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase fornisce un [plugin di gestione delle fonti dati](/data-sources/data-source-manager) per gestire le diverse fonti dati e le loro collezioni. Il plugin di gestione delle fonti dati offre solo un'interfaccia per la gestione di tutte le fonti dati e non fornisce la capacità di accedere direttamente alle fonti dati. Deve essere utilizzato in combinazione con vari plugin per le fonti dati. Le fonti dati attualmente supportate includono:

- [Database principale](/data-sources/data-source-main): Il database principale di NocoBase, supporta database relazionali come MySQL, PostgreSQL e MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Utilizza il database KingbaseES come fonte dati, può essere usato sia come database principale che come database esterno.
- [MySQL esterno](/data-sources/data-source-external-mysql): Utilizza un database MySQL esterno come fonte dati.
- [MariaDB esterno](/data-sources/data-source-external-mariadb): Utilizza un database MariaDB esterno come fonte dati.
- [PostgreSQL esterno](/data-sources/data-source-external-postgres): Utilizza un database PostgreSQL esterno come fonte dati.
- [MSSQL esterno](/data-sources/data-source-external-mssql): Utilizza un database MSSQL (SQL Server) esterno come fonte dati.
- [Oracle esterno](/data-sources/data-source-external-oracle): Utilizza un database Oracle esterno come fonte dati.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Fornisce una varietà di strumenti di modellazione dei dati

**Interfaccia di gestione delle collezioni semplificata**: Utilizzata per creare vari modelli (collezioni) o connettersi a modelli (collezioni) esistenti.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interfaccia visuale tipo diagramma ER**: Utilizzata per estrarre entità e le loro relazioni dai requisiti utente e aziendali. Offre un modo intuitivo e facile da capire per descrivere i modelli di dati. Attraverso i diagrammi ER, è possibile comprendere più chiaramente le principali entità dati nel sistema e le loro relazioni.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Supporta vari tipi di collezioni

| Collezione | Descrizione |
| - | - |
| [Collezione generale](/data-sources/data-source-main/general-collection) | Include campi di sistema comuni predefiniti |
| [Collezione calendario](/data-sources/calendar/calendar-collection) | Utilizzata per creare collezioni di eventi legate al calendario |
| Collezione commenti | Utilizzata per archiviare commenti o feedback sui dati |
| [Collezione ad albero](/data-sources/collection-tree) | Collezione con struttura ad albero, attualmente supporta solo il modello a lista di adiacenza |
| [Collezione file](/data-sources/file-manager/file-collection) | Utilizzata per la gestione dell'archiviazione dei file |
| [Collezione SQL](/data-sources/collection-sql) | Non è una vera e propria tabella di database, ma visualizza rapidamente le query SQL in modo strutturato |
| [Connessione a vista database](/data-sources/collection-view) | Si connette a viste di database esistenti |
| Collezione espressioni | Utilizzata per scenari di espressioni dinamiche nei flussi di lavoro |
| [Connessione a dati esterni](/data-sources/collection-fdw) | Implementa la connessione a collezioni di dati remoti basata sulla tecnologia FDW del database |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Per maggiori dettagli, consulti la sezione "[Collezione / Panoramica](/data-sources/data-modeling/collection)".

## Offre una ricca varietà di tipi di campo

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Per maggiori dettagli, consulti la sezione "[Campi della collezione / Panoramica](/data-sources/data-modeling/collection-fields)".