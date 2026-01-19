:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Як увімкнути рушій Federated у MySQL

База даних MySQL за замовчуванням не має увімкненого модуля Federated. Вам потрібно змінити конфігурацію `my.cnf`. Якщо ви використовуєте версію Docker, ви можете розширити її функціональність за допомогою томів (volumes):

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

Створіть новий файл `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Перезапустіть MySQL

```bash
docker compose up -d mysql
```

Перевірте, чи активовано Federated

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)