:::tip{title="Уведомление об ИИ-переводе"}
Этот документ был переведён с помощью ИИ. Для получения точной информации обратитесь к [английской версии](/integration/fdw/enable-federated).
:::

# Как включить движок Federated в MySQL

В базе данных MySQL модуль federated по умолчанию отключен. Для его активации необходимо изменить конфигурацию `my.cnf`. Если вы используете Docker-версию, вы можете настроить расширение через `volumes`:

```yml
mysql:
  image: mysql:8.1.0
  volumes:
    - ./storage/mysql-conf:/etc/mysql/conf.d
  environment:
    MYSQL_DATABASE: nocobase
    MYSQL_USER: nocobase
    MYSQL_PASSWORD: nocobase
    MYSQL_ROOT_PASSWORD: nocobase
  restart: always
  networks:
    - nocobase
```

Создайте новый файл `./storage/mysql-conf/federated.cnf`:

```ini
[mysqld]
federated
```

Перезапустите MySQL:

```bash
docker compose up -d mysql
```

Проверьте, активирован ли движок federated:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)