---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Fonte Dati Esterna - Oracle

## Introduzione

Questo plugin Le permette di utilizzare un database Oracle esterno come *fonte dati*. Supporta le versioni di Oracle >= 11g.

## Installazione

### Installazione del client Oracle

Per le versioni del server Oracle precedenti alla 12.1, è necessario installare il client Oracle.

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Esempio per Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Se il client non è stato installato come descritto sopra, dovrà specificare il percorso del client (per maggiori dettagli, consulti la [documentazione di node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

### Installazione del plugin

Veda la sezione relativa all'installazione dei *plugin*.

## Utilizzo

Per istruzioni dettagliate, consulti la sezione [Fonte Dati / Database Esterno](/data-sources/data-source-manager/external-database).