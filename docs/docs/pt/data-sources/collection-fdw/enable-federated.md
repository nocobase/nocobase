:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Como habilitar o motor federated no MySQL

O banco de dados MySQL não habilita o módulo federated por padrão. Você precisa modificar a configuração do `my.cnf`. Se você estiver usando a versão Docker, pode lidar com a extensão através de volumes:

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

Verifique se o federated está ativado

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)