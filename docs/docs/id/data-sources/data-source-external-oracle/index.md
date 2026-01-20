---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Sumber Data Eksternal - Oracle

## Pendahuluan

Plugin ini memungkinkan Anda menggunakan database Oracle eksternal sebagai sumber data. Versi Oracle yang didukung saat ini adalah >= 11g.

## Instalasi

### Instal Klien Oracle

Untuk versi server Oracle di bawah 12.1, Anda perlu menginstal klien Oracle.

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

Jika klien tidak diinstal seperti yang dijelaskan di atas, Anda perlu menentukan jalur ke klien (untuk detail lebih lanjut, lihat dokumentasi [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

### Instal plugin

## Petunjuk Penggunaan

Lihat bagian [Sumber Data / Database Eksternal](/data-sources/data-source-manager/external-database) untuk instruksi penggunaan.