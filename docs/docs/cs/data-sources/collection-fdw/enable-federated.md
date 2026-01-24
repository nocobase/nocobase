:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Jak povolit federated engine v MySQL

Databáze MySQL ve výchozím nastavení nemá povolen modul federated. Je potřeba upravit konfiguraci `my.cnf`. Pokud používáte verzi v Dockeru, můžete rozšíření řešit pomocí `volumes`:

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

Vytvořte nový soubor `./storage/mysql-conf/federated.cnf`:

```ini
[mysqld]
federated
```

Restartujte MySQL:

```bash
docker compose up -d mysql
```

Zkontrolujte, zda je federated aktivován:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)