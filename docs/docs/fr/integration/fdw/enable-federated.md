:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/integration/fdw/enable-federated).
:::

# Comment activer le moteur Federated dans MySQL

Le moteur `federated` n'est pas activé par défaut dans la base de données MySQL. Vous devez modifier la configuration `my.cnf`. Si vous utilisez la version Docker, vous pouvez gérer l'extension via les volumes :

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

Créez un nouveau fichier `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Redémarrez MySQL

```bash
docker compose up -d mysql
```

Vérifiez si le moteur `federated` est activé

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)