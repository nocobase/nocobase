---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Fuente de datos externa - Oracle

## Introducción

Este plugin le permite usar una base de datos Oracle externa como una **fuente de datos**. Actualmente, es compatible con versiones de Oracle >= 11g.

## Instalación

### Instalar el cliente de Oracle

Si utiliza versiones de servidor de Oracle anteriores a la 12.1, necesitará instalar el cliente de Oracle.

![Instalación del cliente de Oracle](https://static-docs.nocobase.com/20241204164359.png)

Ejemplo para Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Si el cliente no se instala de la forma descrita anteriormente, deberá especificar la ruta donde se encuentra. Para más detalles, consulte la documentación de [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html).

![Configuración de la ruta del cliente de Oracle](https://static-docs.nocobase.com/20241204165940.png)

### Instalar el plugin

Consulte la documentación general de instalación de plugins.

## Uso

Para obtener instrucciones detalladas, consulte la sección [Fuente de datos / Base de datos externa](/data-sources/data-source-manager/external-database).