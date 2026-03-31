:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Cómo habilitar el motor federated en MySQL

La base de datos MySQL no tiene el módulo federated habilitado por defecto. Necesita modificar la configuración de `my.cnf`. Si está utilizando la versión de Docker, puede gestionar esta extensión a través de volúmenes:

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

Verifique si federated está activado

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)