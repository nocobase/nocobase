# How to Enable the Federated Engine in MySQL

The MySQL database does not enable the federated module by default. You need to modify the my.cnf configuration. If you are using the Docker version, you can handle the extension situation through volumes:

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

Create a new `./storage/mysql-conf/federated.cnf` file

```ini
[mysqld]
federated
```

Restart MySQL

```bash
docker compose up -d mysql
```

Check if federated is activated

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)
