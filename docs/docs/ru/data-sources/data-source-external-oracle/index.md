---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::


# Внешний источник данных - Oracle

## Введение

Этот плагин позволяет использовать внешнюю базу данных Oracle в качестве источника данных. Поддерживаются версии Oracle >= 11g.

## Установка

### Установка клиента Oracle

Для версий сервера Oracle ниже 12.1 необходимо установить клиент Oracle.

![Установка клиента Oracle](https://static-docs.nocobase.com/20241204164359.png)

Пример для Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Если клиент установлен не так, как описано выше, вам потребуется указать путь к нему (подробнее см. в [документации node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Настройка пути к клиенту Oracle](https://static-docs.nocobase.com/20241204165940.png)

### Установка плагина

См. также.

## Использование

Подробные инструкции см. в разделе [Источник данных / Внешняя база данных](/data-sources/data-source-manager/external-database).