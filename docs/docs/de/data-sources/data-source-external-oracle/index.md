---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Externe Datenquelle - Oracle

## Einführung

Mit diesem Plugin können Sie eine externe Oracle-Datenbank als Datenquelle verwenden. Es werden Oracle-Versionen ab 11g unterstützt.

## Installation

### Oracle Client installieren

Für Oracle-Server-Versionen vor 12.1 müssen Sie den Oracle Client installieren.

![Installation des Oracle Clients](https://static-docs.nocobase.com/20241204164359.png)

Beispiel für Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Wenn der Client nicht wie oben beschrieben installiert wurde, müssen Sie den Pfad zum Client angeben (Weitere Details finden Sie in der [node-oracledb Dokumentation](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Konfiguration des Oracle Client-Pfads](https://static-docs.nocobase.com/20241204165940.png)

### Plugin installieren

## Verwendung

Weitere Informationen finden Sie im Kapitel [Datenquellen / Externe Datenbank](/data-sources/data-source-manager/external-database).