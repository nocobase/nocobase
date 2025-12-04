---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Harici Veri Kaynağı - Oracle

## Giriş

Bu eklenti, harici bir Oracle veritabanını veri kaynağı olarak kullanmanızı sağlar. Oracle'ın 11g ve üzeri sürümlerini desteklemektedir.

## Kurulum

### Oracle İstemcisini Kurma

Oracle sunucu sürümü 12.1'den düşükse, Oracle istemcisini kurmanız gerekmektedir.

![Oracle İstemcisi Kurulumu](https://static-docs.nocobase.com/20241204164359.png)

Linux için örnek:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

İstemci yukarıda belirtilen şekilde kurulmadıysa, istemcinin bulunduğu yolu belirtmeniz gerekecektir (daha fazla bilgi için [node-oracledb belgelerine](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) bakabilirsiniz).

![Oracle İstemci Yolu Yapılandırması](https://static-docs.nocobase.com/20241204165940.png)

### Eklentiyi Kurma

Bakınız.

## Kullanım

Ayrıntılı talimatlar için [Veri Kaynağı / Harici Veritabanı](/data-sources/data-source-manager/external-database) bölümüne bakınız.