:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Hur man aktiverar Federated-motorn i MySQL

MySQL-databasen har inte federated-modulen aktiverad som standard. Ni behöver ändra my.cnf-konfigurationen. Om ni använder Docker-versionen kan ni hantera utökningen via volymer:

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

Skapa en ny fil `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Starta om MySQL

```bash
docker compose up -d mysql
```

Kontrollera om federated är aktiverat

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)