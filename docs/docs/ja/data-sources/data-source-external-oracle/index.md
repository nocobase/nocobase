---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 外部データソース - Oracle

## はじめに

外部のOracleデータベースをデータソースとして利用できます。現在サポートされているバージョンはOracle 11g以上です。

## インストール

### Oracle クライアントのインストール

Oracleサーバーのバージョンが12.1未満の場合、Oracleクライアントのインストールが必要です。

![Oracle クライアントのインストール画面](https://static-docs.nocobase.com/20241204164359.png)

Linuxでの例：

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

上記の方法でクライアントをインストールしなかった場合は、クライアントのパスを指定する必要があります。(詳細は [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) のドキュメントをご参照ください。)

![Oracle クライアントのパス設定画面](https://static-docs.nocobase.com/20241204165940.png)

## 利用方法

詳細は [データソース / 外部データベース](/data-sources/data-source-manager/external-database) のセクションをご参照ください。