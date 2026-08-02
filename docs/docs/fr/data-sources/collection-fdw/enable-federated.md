---
title: "Comment activer le moteur federated de MySQL"
description: "Activer le moteur de stockage federated de MySQL : modifier my.cnf et configurer les volumes Docker pour les connexions FDW aux tables MySQL/MariaDB distantes."
keywords: "MySQL federated,moteur federated,FDW,connexion à des tables distantes,NocoBase"
---

# Comment activer le moteur federated de MySQL

Le module federated n’est pas activé par défaut dans la base de données MySQL. Il est nécessaire de modifier la configuration my.cnf. Pour la version Docker, vous pouvez utiliser les volumes afin de gérer les extensions :

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

Créer le fichier `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Redémarrer MySQL

```bash
docker compose up -d mysql
```

Vérifier si federated est activé

```sql
show engines
```

![Texte alternatif](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)