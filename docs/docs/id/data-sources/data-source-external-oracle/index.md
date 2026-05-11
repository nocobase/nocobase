---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "Data Source Eksternal - Oracle"
description: "Mengintegrasikan database Oracle eksternal (>=11g) sebagai data source, koneksi read-only ke database yang sudah ada, sinkronisasi Collection dan konfigurasi field."
keywords: "Oracle Eksternal,Data Source Oracle,database eksternal,sinkronisasi Collection,NocoBase"
---
# Data Source Eksternal - Oracle

## Pengantar

Menggunakan database Oracle eksternal sebagai data source. Versi yang saat ini didukung: Oracle >= 11g

## Instalasi

### Instal Oracle Client

Untuk versi Oracle server kurang dari 12.1, perlu menginstal Oracle Client

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Contoh untuk Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Jika client tidak diinstal dengan cara di atas, perlu menyediakan path lokasi client (untuk lebih lanjut, lihat dokumentasi [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html))

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

### Instal Plugin

Lihat 

## Petunjuk Penggunaan

Lihat bagian [Data Source / Database Eksternal](/data-sources/data-source-manager/external-database)
