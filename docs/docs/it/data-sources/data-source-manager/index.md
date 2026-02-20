---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Gestione delle Fonti Dati

## Introduzione

NocoBase Le offre un plugin per la gestione delle fonti dati, che Le permette di gestire sia le fonti dati che le relative collezioni. Il plugin di gestione delle fonti dati fornisce solo un'interfaccia di gestione per tutte le fonti dati e non offre la capacità di accedervi direttamente. Deve essere utilizzato in combinazione con vari plugin per fonti dati. Attualmente, le fonti dati supportate includono:

- [Database Principale](/data-sources/data-source-main): Il database principale di NocoBase, che supporta database relazionali come MySQL, PostgreSQL e MariaDB.
- [MySQL Esterno](/data-sources/data-source-external-mysql): Utilizza un database MySQL esterno come fonte dati.
- [MariaDB Esterno](/data-sources/data-source-external-mariadb): Utilizza un database MariaDB esterno come fonte dati.
- [PostgreSQL Esterno](/data-sources/data-source-external-postgres): Utilizza un database PostgreSQL esterno come fonte dati.
- [MSSQL Esterno](/data-sources/data-source-external-mssql): Utilizza un database MSSQL (SQL Server) esterno come fonte dati.
- [Oracle Esterno](/data-sources/data-source-external-oracle): Utilizza un database Oracle esterno come fonte dati.

Inoltre, è possibile estendere il supporto a ulteriori tipi tramite plugin, che possono includere sia database comuni che piattaforme che offrono API (SDK).

## Installazione

È un plugin integrato, non richiede installazione separata.

## Istruzioni per l'Uso

Quando l'applicazione viene inizializzata e installata, viene fornita di default una fonte dati per archiviare i dati di NocoBase, nota come database principale. Per maggiori dettagli, consulti la documentazione del [Database Principale](/data-sources/data-source-main/).

### Fonti Dati Esterne

È possibile utilizzare database esterni come fonti dati. Per maggiori informazioni, consulti la documentazione [Database Esterno / Introduzione](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Supporto per la Sincronizzazione di Tabelle Database Personalizzate

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

È anche possibile accedere a dati provenienti da fonti API HTTP. Per maggiori dettagli, consulti la documentazione [Fonte Dati REST API](/data-sources/data-source-rest-api/).