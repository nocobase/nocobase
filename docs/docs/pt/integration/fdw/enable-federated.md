:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/integration/fdw/enable-federated).
:::

# Como habilitar o mecanismo federated no MySQL

O banco de dados MySQL não habilita o módulo federated por padrão. Você precisa modificar a configuração `my.cnf`. Se você estiver usando a versão Docker, pode lidar com a extensão através de volumes:

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

Crie um novo arquivo `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Reinicie o MySQL

```bash
docker compose up -d mysql
```

Verifique se o federated foi ativado

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)