:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Comment activer le moteur federated dans MySQL

La base de données MySQL n'active pas le module federated par défaut. Vous devez modifier la configuration `my.cnf`. Si vous utilisez la version Docker, vous pouvez gérer cette extension via des volumes :

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

Créez un nouveau fichier `./storage/mysql-conf/federated.cnf` :

```ini
[mysqld]
federated
```

Redémarrez MySQL :

```bash
docker compose up -d mysql
```

Vérifiez si le moteur federated est activé :

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)