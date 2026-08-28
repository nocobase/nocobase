---
title: "So aktivieren Sie die FEDERATED-Engine in MySQL"
description: "Aktivieren der FEDERATED-Speicher-Engine in MySQL: my.cnf anpassen und Docker-Volumes konfigurieren, um über FDW eine Verbindung zu entfernten MySQL-/MariaDB-Tabellen herzustellen."
keywords: "MySQL federated,FEDERATED-Engine,FDW,Verbindung zu entfernten Tabellen,NocoBase"
---

# So aktivieren Sie die FEDERATED-Engine in MySQL

Das FEDERATED-Modul ist in MySQL standardmäßig nicht aktiviert. Sie müssen die Konfiguration in my.cnf anpassen. Bei Verwendung der Docker-Version können Sie Erweiterungen über Volumes einbinden:

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

Neue `./storage/mysql-conf/federated.cnf`-Datei erstellen

```ini
[mysqld]
federated
```

MySQL neu starten

```bash
docker compose up -d mysql
```

Prüfen, ob FEDERATED bereits aktiviert ist

```sql
show engines
```

![Alternativtext](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)