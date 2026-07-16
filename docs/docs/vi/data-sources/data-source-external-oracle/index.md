---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "External Data Source - Oracle"
description: "Tích hợp database Oracle (>=11g) bên ngoài làm Data Source, kết nối read-only đến database có sẵn, đồng bộ Collection và cấu hình Field."
keywords: "External Oracle,Oracle Data Source,External database,Đồng bộ Collection,NocoBase"
---
# External Data Source - Oracle

## Giới thiệu

Sử dụng database Oracle bên ngoài làm Data Source. Phiên bản hiện được hỗ trợ Oracle >= 11g

## Cài đặt

### Cài đặt Oracle Client

Phiên bản Oracle server nhỏ hơn 12.1, cần cài đặt Oracle Client

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Ví dụ Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Nếu Client không được cài đặt theo cách trên, cần cung cấp đường dẫn của Client (xem thêm tại tài liệu [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html))

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

### Cài đặt Plugin

Tham khảo 

## Hướng dẫn sử dụng

Xem chương [Data Source / External Database](/data-sources/data-source-manager/external-database)
