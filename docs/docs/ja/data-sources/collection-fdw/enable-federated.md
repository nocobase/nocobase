---
title: "MySQL で federated エンジンを有効にする方法"
description: "MySQL で federated ストレージエンジンを有効にする方法：my.cnf の変更や Docker の volumes 設定を行い、リモート MySQL/MariaDB テーブルへの FDW 接続に使用します。"
keywords: "MySQL federated,federated エンジン,FDW,リモートテーブル接続,NocoBase"
---

# MySQL で federated エンジンを有効にする方法

MySQL データベースでは、デフォルトで federated モジュールが有効になっていないため、my.cnf の設定を変更する必要があります。Docker 版の場合は、volumes を使用して拡張機能を設定できます。

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

新しい `./storage/mysql-conf/federated.cnf` ファイルを作成します

```ini
[mysqld]
federated
```

mysql を再起動します

```bash
docker compose up -d mysql
```

federated が有効になっているか確認します

```sql
show engines
```

![代替テキスト](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)