---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Connettere Tabelle Dati Esterne (FDW)

## Introduzione

Questo è un `plugin` che permette di connettere tabelle dati remote, basandosi sull'implementazione del `foreign data wrapper` del database. Attualmente, supporta i database MySQL e PostgreSQL.

:::info{title="Connettere Fonti Dati vs Connettere Tabelle Dati Esterne"}
- **Connettere `fonti dati`** si riferisce allo stabilire una connessione con un database specifico o un servizio API, permettendole di utilizzare appieno le funzionalità del database o i servizi offerti dall'API;
- **Connettere tabelle dati esterne** significa acquisire dati dall'esterno e mapparli per l'utilizzo locale. Nel contesto dei database, questa tecnologia è chiamata FDW (`Foreign Data Wrapper`) e si concentra sull'utilizzo di tabelle remote come se fossero tabelle locali, connettendole una per una. Essendo un accesso remoto, ci saranno diverse limitazioni e vincoli durante l'utilizzo.

I due approcci possono anche essere usati in combinazione: il primo serve a stabilire una connessione con la `fonte dati`, mentre il secondo è utile per l'accesso tra diverse `fonti dati`. Ad esempio, potrebbe essere connessa una `fonte dati` PostgreSQL che contiene una tabella esterna creata tramite FDW.
:::

### MySQL

MySQL utilizza il motore `federated`, che deve essere attivato, e supporta la connessione a database MySQL remoti e compatibili con il suo protocollo, come MariaDB. Per maggiori dettagli, consulti la documentazione [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

In PostgreSQL, è possibile utilizzare diversi tipi di estensioni `fdw` per supportare vari tipi di dati remoti. Le estensioni attualmente supportate includono:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Per connettere un database PostgreSQL remoto da PostgreSQL.
- [mysql_fdw (in sviluppo)](https://github.com/EnterpriseDB/mysql_fdw): Per connettere un database MySQL remoto da PostgreSQL.
- Per altri tipi di estensioni `fdw`, può consultare [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). L'integrazione con NocoBase richiede l'implementazione delle interfacce di adattamento corrispondenti nel codice.

## Installazione

Prerequisiti

- Se il database principale di NocoBase è MySQL, è necessario attivare `federated`. Consulti [Come abilitare il motore federated in MySQL](./enable-federated.md).

Successivamente, installi e attivi il `plugin` tramite il gestore `plugin`.

![Installi e attivi il plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manuale Utente

Nel menu a discesa "Gestione `collezioni` > Crea `collezione`", selezioni "Connetti dati esterni".

![Connetti dati esterni](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Nel menu a discesa "Servizio Database", selezioni un servizio database esistente oppure "Crea Servizio Database".

![Servizio Database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Creare un servizio database

![Crea Servizio Database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Dopo aver selezionato il servizio database, nel menu a discesa "Tabella remota", selezioni la tabella dati che desidera connettere.

![Selezioni la tabella dati da connettere](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurare le informazioni sui campi

![Configuri le informazioni sui campi](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Se la tabella remota presenta modifiche strutturali, può anche "Sincronizzare dalla tabella remota".

![Sincronizzi dalla tabella remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronizzazione della tabella remota

![Sincronizzazione della tabella remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Infine, visualizzazione nell'interfaccia

![Visualizzazione nell'interfaccia](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)