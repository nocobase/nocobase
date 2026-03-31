---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Source de données externe - Oracle

## Introduction

Ce plugin vous permet d'utiliser une base de données Oracle externe comme source de données. Les versions d'Oracle prises en charge sont `>= 11g`.

## Installation

### Installer le client Oracle

Pour les versions de serveur Oracle antérieures à 12.1, vous devez installer le client Oracle.

![Installation du client Oracle](https://static-docs.nocobase.com/20241204164359.png)

Exemple pour Linux :

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Si le client n'est pas installé comme décrit ci-dessus, vous devrez spécifier le chemin d'accès au client (pour plus de détails, consultez la [documentation node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Configuration du chemin du client Oracle](https://static-docs.nocobase.com/20241204165940.png)

### Installer le plugin

## Utilisation

Pour des instructions détaillées, consultez la section [Source de données / Base de données externe](/data-sources/data-source-manager/external-database).