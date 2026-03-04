:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/integration/fdw/enable-federated).
:::

# Cara Mengaktifkan Engine Federated di MySQL

Basis data MySQL tidak mengaktifkan modul federated secara default. Anda perlu mengubah konfigurasi my.cnf. Jika Anda menggunakan versi Docker, Anda dapat menangani ekstensi ini melalui volumes:

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

Buat berkas baru `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Mulai ulang MySQL

```bash
docker compose up -d mysql
```

Periksa apakah federated telah diaktifkan

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)