:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Come abilitare il motore federated in MySQL

Il database MySQL non abilita il modulo federated per impostazione predefinita. È necessario modificare la configurazione di `my.cnf`. Se sta utilizzando la versione Docker, può gestire l'estensione tramite i volumi:

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

Crei un nuovo file `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Riavvii MySQL

```bash
docker compose up -d mysql
```

Verifichi se federated è stato attivato

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)