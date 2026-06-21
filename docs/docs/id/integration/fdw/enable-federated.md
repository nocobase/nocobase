---
title: "Aktifkan Engine federated MySQL"
description: "Aktifkan engine federated MySQL: modifikasi my.cnf, konfigurasi volume Docker, federated.cnf, restart dan validasi, untuk koneksi FDW ke MySQL/MariaDB jarak jauh."
keywords: "MySQL federated,engine federated,my.cnf,Docker MySQL,prasyarat FDW,NocoBase"
---

# Cara Mengaktifkan Engine federated MySQL

Database MySQL secara default tidak mengaktifkan modul federated; Anda perlu memodifikasi konfigurasi my.cnf. Jika Anda menggunakan versi docker, Anda dapat menangani perpanjangan melalui volumes:

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

Buat file `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Restart mysql

```bash
docker compose up -d mysql
```

Periksa apakah federated sudah aktif

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)
