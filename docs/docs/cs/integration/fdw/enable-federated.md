:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/integration/fdw/enable-federated).
:::

# Jak v MySQL povolit engine federated

Databáze MySQL nemá ve výchozím nastavení povolen modul federated. Je nutné upravit konfiguraci `my.cnf`. Pokud používáte verzi pro Docker, můžete rozšíření konfigurace vyřešit pomocí svazků (volumes):

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

Zkontrolujte, zda je engine federated aktivován:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)