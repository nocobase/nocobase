---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Externe Gegevensbron - Oracle

## Introductie

Deze plugin stelt u in staat om een externe Oracle-database als gegevensbron te gebruiken. We ondersteunen Oracle-versies vanaf 11g.

## Installatie

### Oracle Client installeren

Voor Oracle serverversies ouder dan 12.1 is het noodzakelijk om de Oracle client te installeren.

![Oracle Client Installatie](https://static-docs.nocobase.com/20241204164359.png)

Voorbeeld voor Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Als de client niet op de hierboven beschreven manier is geïnstalleerd, moet u het pad naar de client opgeven (voor meer details, raadpleeg de [node-oracledb documentatie](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Oracle Client Pad Configuratie](https://static-docs.nocobase.com/20241204165940.png)

### Plugin installeren

Raadpleeg de algemene documentatie voor plugin-installatie.

## Gebruik

Voor gedetailleerde instructies, raadpleeg de sectie [Gegevensbronnen / Externe database](/data-sources/data-source-manager/external-database).