---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Extern datakälla - Oracle

## Introduktion

Med denna plugin kan ni använda en extern Oracle-databas som datakälla. Den stöder Oracle-versioner >= 11g.

## Installation

### Installera Oracle-klienten

För Oracle-serverversioner äldre än 12.1 behöver ni installera Oracle-klienten.

![Installation av Oracle-klienten](https://static-docs.nocobase.com/20241204164359.png)

Exempel för Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Om klienten inte är installerad enligt ovanstående instruktioner, måste ni ange sökvägen till klienten (för mer information, se [node-oracledb-dokumentationen](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Konfiguration av Oracle-klientens sökväg](https://static-docs.nocobase.com/20241204165940.png)

### Installera pluginen

Se

## Användning

För detaljerade instruktioner, se avsnittet [Datakälla / Extern databas](/data-sources/data-source-manager/external-database).