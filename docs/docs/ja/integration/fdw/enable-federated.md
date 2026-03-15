:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/integration/fdw/enable-federated)をご参照ください。
:::

# MySQL で federated エンジンを有効にする方法

MySQL データベースでは、デフォルトで federated モジュールが有効になっていません。有効にするには `my.cnf` 設定を変更する必要があります。Docker 版を使用している場合は、`volumes` を利用して設定を拡張できます。

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

`./storage/mysql-conf/federated.cnf` ファイルを新規作成します。

```ini
[mysqld]
federated
```

MySQL を再起動します。

```bash
docker compose up -d mysql
```

federated が有効になっているか確認します。

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)