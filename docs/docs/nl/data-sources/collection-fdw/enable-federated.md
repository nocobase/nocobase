:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Hoe u de Federated Engine in MySQL inschakelt

De MySQL-database schakelt de federated module standaard niet in. U moet hiervoor de `my.cnf`-configuratie aanpassen. Als u de Docker-versie gebruikt, kunt u dit regelen via volumes:

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

Maak een nieuw bestand aan: `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Herstart MySQL

```bash
docker compose up -d mysql
```

Controleer of federated geactiveerd is

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)