:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Cara Mengaktifkan Federated Engine di MySQL

Secara default, database MySQL tidak mengaktifkan modul federated. Anda perlu memodifikasi konfigurasi `my.cnf`. Jika Anda menggunakan versi Docker, Anda dapat menangani ekstensi ini melalui `volumes`:

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

Buat file baru `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Mulai ulang MySQL

```bash
docker compose up -d mysql
```

Periksa apakah federated sudah aktif

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)