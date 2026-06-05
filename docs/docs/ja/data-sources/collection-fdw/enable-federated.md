:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# MySQLでFederatedエンジンを有効にする方法

MySQLデータベースでは、デフォルトでfederatedモジュールが有効になっていません。my.cnfの設定を変更する必要があります。Docker版をご利用の場合は、volumesを使って拡張に対応できます。

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

新しく`./storage/mysql-conf/federated.cnf`ファイルを作成します。

```ini
[mysqld]
federated
```

MySQLを再起動します。

```bash
docker compose up -d mysql
```

federatedが有効になっているか確認します。

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)