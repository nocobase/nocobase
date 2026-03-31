---
title: "MySQL 启用 federated 引擎"
description: "MySQL federated 引擎启用：修改 my.cnf、Docker volumes 配置、federated.cnf、重启验证，用于 FDW 连接远程 MySQL/MariaDB。"
keywords: "MySQL federated,federated 引擎,my.cnf,Docker MySQL,FDW 前置条件,NocoBase"
---

# MySQL 如何启用 federated 引擎

MySQL 数据库默认没有开启 federated 模块，需要修改 my.cnf 配置，如果是 docker 版本，可以通过 volumes 来处理扩展的情况：

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

新建 `./storage/mysql-conf/federated.cnf` 文件

```ini
[mysqld]
federated
```

重启 mysql

```bash
docker compose up -d mysql
```

查看 federated 是否已经激活

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)
