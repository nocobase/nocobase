---
title: "Как включить движок federated в MySQL"
description: "Включение хранилища federated в MySQL: изменение my.cnf и настройка Docker volumes для подключения FDW к удалённым таблицам MySQL/MariaDB."
keywords: "MySQL federated,движок federated,FDW,подключение к удалённым таблицам,NocoBase"
---

# Как включить движок federated в MySQL

По умолчанию модуль federated в базе данных MySQL не включён. Необходимо изменить конфигурацию my.cnf. Если используется версия в Docker, расширение можно настроить с помощью volumes:

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

Создайте файл `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Перезапустите mysql

```bash
docker compose up -d mysql
```

Проверьте, активирован ли federated

```sql
show engines
```

![Альтернативный текст](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)