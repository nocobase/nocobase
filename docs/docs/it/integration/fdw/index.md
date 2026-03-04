:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/integration/fdw/index).
:::

# Connettere tabelle dati esterne (FDW)

## Introduzione

Questa funzionalità consente di connettersi a tabelle dati remote basate sul Foreign Data Wrapper (FDW) del database. Attualmente supporta i database MySQL e PostgreSQL.

:::info{title="Connessione fonte dati vs Connessione tabelle dati esterne"}
- **Connettere fonti dati** si riferisce allo stabilire una connessione con uno specifico database o servizio API, consentendo di utilizzare appieno le funzionalità del database o i servizi forniti dall'API;
- **Connettere tabelle dati esterne** si riferisce all'acquisizione di dati dall'esterno e alla loro mappatura per l'uso locale. Nel database, questa tecnologia è chiamata FDW (Foreign Data Wrapper); si tratta di una tecnologia di database che si concentra sull'utilizzo di tabelle remote come se fossero tabelle locali e può connettere solo una tabella alla volta. Trattandosi di un accesso remoto, l'utilizzo comporta vari vincoli e limitazioni.

Le due modalità possono essere utilizzate anche in combinazione. La prima serve a stabilire una connessione con la fonte dati, mentre la seconda viene utilizzata per l'accesso tra diverse fonti dati. Ad esempio, se è connessa una determinata fonte dati PostgreSQL, una tabella all'interno di questa fonte dati potrebbe essere una tabella esterna creata sulla base di FDW.
:::

### MySQL

MySQL utilizza il motore `federated`, che deve essere attivato, e supporta la connessione a database MySQL remoti e database compatibili con il protocollo, come MariaDB. Per ulteriori dettagli, consultare la documentazione del [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

In PostgreSQL, è possibile utilizzare diversi tipi di estensioni `fdw` per supportare vari tipi di dati remoti. Le estensioni attualmente supportate includono:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Connessione a un database PostgreSQL remoto in PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Connessione a un database MySQL remoto in PostgreSQL.
- Per altri tipi di estensioni fdw, fare riferimento a [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). È necessario implementare la corrispondente interfaccia di adattamento nel codice per l'integrazione in NocoBase.

## Prerequisiti

- Se il database principale di NocoBase è MySQL, è necessario attivare `federated`. Consultare [Come abilitare il motore federated in MySQL](./enable-federated)

Quindi, installare e attivare il plugin tramite il gestore dei plugin.

![Installare e attivare il plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Manuale d'uso

Nel menu a discesa "Gestione collezioni > Crea collezione", selezioni "Connetti a dati esterni".

![Connetti dati esterni](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Nel menu a discesa "Server database", selezioni un servizio di database esistente oppure "Crea server database".

![Servizio database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Creare un server database.

![Crea servizio database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Dopo aver selezionato il server database, nel menu a discesa "Tabella remota", selezioni la tabella dati che desidera connettere.

![Selezionare la tabella dati da connettere](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Configurare le informazioni sui campi.

![Configurare le informazioni sui campi](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Se la tabella remota subisce modifiche strutturali, è anche possibile selezionare "Sincronizza dalla tabella remota".

![Sincronizza dalla tabella remota](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Sincronizzazione della tabella remota.

![Sincronizzazione tabella remota](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Infine, visualizzazione nell'interfaccia.

![Visualizzazione nell'interfaccia](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)