---
title: "Como habilitar o mecanismo federated no MySQL"
description: "Como habilitar o mecanismo de armazenamento federated no MySQL: modificar o my.cnf e configurar volumes do Docker para conectar tabelas remotas do MySQL/MariaDB via FDW."
keywords: "MySQL federated,mecanismo federated,FDW,conexão com tabelas remotas,NocoBase"
---

# Como habilitar o mecanismo federated no MySQL

O banco de dados MySQL não habilita o módulo federated por padrão. É necessário modificar a configuração do my.cnf. Se estiver usando a versão Docker, você pode usar volumes para configurar a extensão:

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

Crie um arquivo `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Reinicie o MySQL

```bash
docker compose up -d mysql
```

Verifique se o federated já está ativado

```sql
show engines
```

![Texto alternativo](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)