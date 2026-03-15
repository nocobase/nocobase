:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/integration/fdw/enable-federated) voor nauwkeurige informatie.
:::

# Hoe de federated engine in MySQL in te schakelen

De MySQL-database heeft de federated-module standaard niet ingeschakeld. U moet de `my.cnf`-configuratie aanpassen. Als u de Docker-versie gebruikt, kunt u dit via volumes configureren:

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

Maak een nieuw bestand `./storage/mysql-conf/federated.cnf` aan:

```ini
[mysqld]
federated
```

Start MySQL opnieuw op:

```bash
docker compose up -d mysql
```

Controleer of federated is geactiveerd:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)