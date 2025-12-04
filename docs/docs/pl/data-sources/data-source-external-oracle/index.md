---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Zewnętrzne źródło danych - Oracle

## Wprowadzenie

Mogą Państwo używać zewnętrznej bazy danych Oracle jako źródła danych. Obecnie obsługiwane są wersje Oracle >= 11g.

## Instalacja

### Instalacja klienta Oracle

Dla wersji serwera Oracle starszych niż 12.1, konieczna jest instalacja klienta Oracle.

![Instalacja klienta Oracle](https://static-docs.nocobase.com/20241204164359.png)

Przykład dla systemu Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Jeśli klient nie został zainstalowany w sposób opisany powyżej, należy podać ścieżkę do jego lokalizacji (więcej szczegółów znajdą Państwo w dokumentacji [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Konfiguracja ścieżki klienta Oracle](https://static-docs.nocobase.com/20241204165940.png)

## Użycie

Szczegółowe instrukcje znajdą Państwo w sekcji [Źródło danych / Zewnętrzna baza danych](/data-sources/data-source-manager/external-database).