:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# So aktivieren Sie die Federated Engine in MySQL

Die MySQL-Datenbank aktiviert das Federated-Modul standardmäßig nicht. Sie müssen die `my.cnf`-Konfiguration anpassen. Wenn Sie die Docker-Version verwenden, können Sie diese Erweiterung über Volumes handhaben:

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

Erstellen Sie eine neue Datei `./storage/mysql-conf/federated.cnf`:

```ini
[mysqld]
federated
```

Starten Sie MySQL neu:

```bash
docker compose up -d mysql
```

Prüfen Sie, ob Federated aktiviert ist:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)