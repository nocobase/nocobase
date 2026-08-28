---
title: "Cara mengaktifkan mesin federated di MySQL"
description: "Mengaktifkan mesin penyimpanan federated di MySQL: mengubah konfigurasi my.cnf dan mengatur Docker volumes untuk menghubungkan FDW ke tabel MySQL/MariaDB jarak jauh."
keywords: "MySQL federated,mesin federated,FDW,koneksi tabel jarak jauh,NocoBase"
---

# Cara mengaktifkan mesin federated di MySQL

Basis data MySQL secara default tidak mengaktifkan modul federated. Anda perlu mengubah konfigurasi my.cnf. Jika menggunakan versi Docker, Anda dapat menangani ekstensi melalui volumes:

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

Buat file `./storage/mysql-conf/federated.cnf` baru

```ini
[mysqld]
federated
```

Mulai ulang mysql

```bash
docker compose up -d mysql
```

Periksa apakah federated sudah diaktifkan

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)