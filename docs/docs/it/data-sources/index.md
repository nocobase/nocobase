:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

La modellazione dei dati è un passaggio chiave nella progettazione dei database, che implica un processo di analisi approfondita e astrazione di vari tipi di dati e delle loro interrelazioni nel mondo reale. In questo processo, cerchiamo di rivelare le connessioni intrinseche tra i dati e di formalizzarle in modelli di dati, ponendo le basi per la struttura del database del sistema informativo. NocoBase è una piattaforma basata su modelli di dati, che offre le seguenti caratteristiche:

## Supporta l'accesso a dati da varie fonti

NocoBase supporta **fonti dati** di varie origini, inclusi database comuni, piattaforme API/SDK e file.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase offre un [plugin di gestione delle fonti dati](/data-sources/data-source-manager) per la gestione delle diverse **fonti dati** e delle relative **collezioni**. Il **plugin** di gestione delle **fonti dati** fornisce solo un'interfaccia di gestione per tutte le **fonti dati** e non offre la capacità di accedervi direttamente. Deve essere utilizzato in combinazione con vari **plugin** per le **fonti dati**. Le **fonti dati** attualmente supportate includono:

- [Database Principale](/data-sources/data-source-main): Il database principale di NocoBase, che supporta database relazionali come MySQL, PostgreSQL e MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Utilizza il database KingbaseES come **fonte dati**, che può essere usato sia come database principale che come database esterno.
- [MySQL Esterno](/data-sources/data-source-external-mysql): Utilizza un database MySQL esterno come **fonte dati**.
- [MariaDB Esterno](/data-sources/data-source-external-mariadb): Utilizza un database MariaDB esterno come **fonte dati**.
- [PostgreSQL Esterno](/data-sources/data-source-external-postgres): Utilizza un database PostgreSQL esterno come **fonte dati**.
- [MSSQL Esterno](/data-sources/data-source-external-mssql): Utilizza un database MSSQL (SQL Server) esterno come **fonte dati**.
- [Oracle Esterno](/data-sources/data-source-external-oracle): Utilizza un database Oracle esterno come **fonte dati**.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Offre una varietà di strumenti di modellazione dei dati

**Interfaccia di gestione delle collezioni semplice**: Utilizzata per creare varie **collezioni** (modelli) o per connettersi a **collezioni** esistenti.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Interfaccia visiva in stile ER**: Utilizzata per estrarre entità e le loro relazioni dai requisiti utente e di business. Offre un modo intuitivo e facile da capire per descrivere i modelli di dati. Attraverso i diagrammi ER, è possibile comprendere più chiaramente le principali entità dati nel sistema e le loro relazioni.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Supporta vari tipi di collezioni

| Collezione | Descrizione |
| - | - |
| [Collezione Generale](/data-sources/data-source-main/general-collection) | Include campi di sistema comuni |
| [Collezione Calendario](/data-sources/calendar/calendar-collection) | Utilizzata per creare **collezioni** di eventi legate al calendario |
| Collezione Commenti | Utilizzata per archiviare commenti o feedback sui dati |
| [Collezione ad Albero](/data-sources/collection-tree) | **Collezione** con struttura ad albero, attualmente supporta solo il modello a lista di adiacenza |
| [Collezione File](/data-sources/file-manager/file-collection) | Utilizzata per la gestione dell'archiviazione dei file |
| [Collezione SQL](/data-sources/collection-sql) | Non è una vera e propria **collezione** di database, ma visualizza le query SQL in modo strutturato |
| [Connetti a Vista Database](/data-sources/collection-view) | Si connette a viste di database esistenti |
| Collezione Espressioni | Utilizzata per scenari di espressioni dinamiche nei **flussi di lavoro** |
| [Connetti a Dati Esterni](/data-sources/collection-fdw) | Consente al sistema di database di accedere e interrogare direttamente i dati in **fonti dati** esterne basate sulla tecnologia FDW |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Per maggiori dettagli, consulti la sezione 「[Collezione / Panoramica](/data-sources/data-modeling/collection)」.

## Offre una ricca varietà di tipi di campo

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Per maggiori dettagli, consulti la sezione 「[Campi Collezione / Panoramica](/data-sources/data-modeling/collection-fields)」.