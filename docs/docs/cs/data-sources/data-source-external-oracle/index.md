---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Externí zdroj dat - Oracle

## Úvod

Tento plugin Vám umožňuje používat externí databázi Oracle jako zdroj dat. Podporuje verze Oracle >= 11g.

## Instalace

### Instalace klienta Oracle

Pro verze serveru Oracle starší než 12.1 je nutné nainstalovat klienta Oracle.

![Instalace klienta Oracle](https://static-docs.nocobase.com/20241204164359.png)

Příklad pro Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Pokud klient není nainstalován výše popsaným způsobem, budete muset zadat cestu ke klientovi (více podrobností naleznete v [dokumentaci node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Konfigurace cesty klienta Oracle](https://static-docs.nocobase.com/20241204165940.png)

### Instalace pluginu

Viz

## Použití

Podrobné pokyny naleznete v kapitole [Zdroj dat / Externí databáze](/data-sources/data-source-manager/external-database).