:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/integration/fdw/enable-federated).
:::

# Cómo habilitar el motor federated en MySQL

La base de datos MySQL no tiene habilitado el módulo federated de forma predeterminada. Es necesario modificar la configuración de `my.cnf`. Si utiliza la versión de Docker, puede gestionar la extensión a través de volúmenes (volumes):

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

Cree un nuevo archivo `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Reinicie MySQL

```bash
docker compose up -d mysql
```

Verifique si federated ha sido activado

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)