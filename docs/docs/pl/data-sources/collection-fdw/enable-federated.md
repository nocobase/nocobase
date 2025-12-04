:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Jak włączyć silnik federated w MySQL

Baza danych MySQL domyślnie nie ma włączonego modułu federated. Muszą Państwo zmodyfikować konfigurację my.cnf. Jeśli korzystają Państwo z wersji Docker, rozszerzenie można obsłużyć za pomocą woluminów:

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

Utworzyć nowy plik `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Ponownie uruchomić MySQL

```bash
docker compose up -d mysql
```

Sprawdzić, czy federated jest aktywowany

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)