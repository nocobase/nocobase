# Как включить движок federated в MySQL

По умолчанию модуль federated в базе данных MySQL не включен. Вам нужно изменить конфигурацию my.cnf. Если вы используете Docker-версию, можно управлять подключением расширения через volumes:

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

Проверьте, что federated активирован

```sql
show engines
```

![Снимок экрана](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)