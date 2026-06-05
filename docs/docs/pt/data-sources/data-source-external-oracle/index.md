---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Fonte de Dados Externa - Oracle

## Introdução

Este plugin permite que você use um banco de dados Oracle externo como uma fonte de dados. Ele suporta versões do Oracle >= 11g.

## Instalação

### Instalar o Cliente Oracle

Para versões do servidor Oracle anteriores a 12.1, você precisa instalar o cliente Oracle.

![Instalação do Cliente Oracle](https://static-docs.nocobase.com/20241204164359.png)

Exemplo para Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Se o cliente não for instalado conforme descrito acima, você precisará especificar o caminho para o cliente (para mais detalhes, consulte a [documentação do node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Configuração do Caminho do Cliente Oracle](https://static-docs.nocobase.com/20241204165940.png)

### Instalar o Plugin

## Uso

Para instruções detalhadas, consulte a seção [Fonte de Dados / Banco de Dados Externo](/data-sources/data-source-manager/external-database).