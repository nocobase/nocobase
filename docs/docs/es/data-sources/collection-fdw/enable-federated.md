---
title: "Cómo habilitar el motor federated en MySQL"
description: "Cómo habilitar el motor de almacenamiento federated en MySQL: modificar my.cnf y configurar los volúmenes de Docker para conectarse mediante FDW a tablas remotas de MySQL/MariaDB."
keywords: "MySQL federated,motor federated,FDW,conexión a tablas remotas,NocoBase"
---

# Cómo habilitar el motor federated en MySQL

El módulo federated no está habilitado de forma predeterminada en MySQL. Es necesario modificar la configuración de my.cnf. Si se utiliza la versión de Docker, se puede gestionar la extensión mediante volumes:

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

Crear el archivo `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Reiniciar MySQL

```bash
docker compose up -d mysql
```

Comprobar si federated ya está activado

```sql
show engines
```

![Texto alternativo](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)