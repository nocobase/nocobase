---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::

# Зовнішнє джерело даних - Oracle

## Вступ

Цей плагін дозволяє використовувати зовнішню базу даних Oracle як джерело даних. Він підтримує версії Oracle >= 11g.

## Встановлення

### Встановлення клієнта Oracle

Для версій сервера Oracle, старіших за 12.1, вам потрібно встановити клієнт Oracle.

![Встановлення клієнта Oracle](https://static-docs.nocobase.com/20241204164359.png)

Приклад для Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Якщо клієнт встановлено не так, як описано вище, вам потрібно буде вказати шлях до клієнта (докладніше дивіться в [документації node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Налаштування шляху до клієнта Oracle](https://static-docs.nocobase.com/20241204165940.png)

### Встановлення плагіна

Дивіться інструкції

## Використання

Докладні інструкції дивіться в розділі [Джерела даних / Зовнішня база даних](/data-sources/data-source-manager/external-database).