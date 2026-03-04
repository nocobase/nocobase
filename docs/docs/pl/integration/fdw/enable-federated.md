:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/integration/fdw/enable-federated).
:::

# Jak włączyć silnik federated w MySQL

Baza danych MySQL domyślnie nie ma włączonego modułu federated. Wymaga to modyfikacji konfiguracji `my.cnf`. Jeśli korzystają Państwo z wersji Docker, można obsłużyć rozszerzenie poprzez wolumeny (volumes):

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

Proszę utworzyć nowy plik `./storage/mysql-conf/federated.cnf`:

```ini
[mysqld]
federated
```

Proszę zrestartować MySQL:

```bash
docker compose up -d mysql
```

Proszę sprawdzić, czy moduł federated został aktywowany:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)