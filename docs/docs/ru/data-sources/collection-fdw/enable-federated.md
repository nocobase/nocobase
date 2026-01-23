:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Как включить движок Federated в MySQL

База данных MySQL по умолчанию не включает модуль Federated. Вам потребуется изменить конфигурацию `my.cnf`. Если вы используете версию Docker, вы можете настроить это расширение с помощью томов (volumes):

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

Создайте новый файл `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Перезапустите MySQL

```bash
docker compose up -d mysql
```

Проверьте, активирован ли Federated.

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)