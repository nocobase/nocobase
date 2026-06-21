---
title: "Cách kích hoạt engine federated trong MySQL"
description: "Kích hoạt storage engine federated trong MySQL: chỉnh sửa my.cnf, cấu hình volumes của Docker, dùng cho FDW kết nối bảng MySQL/MariaDB từ xa."
keywords: "MySQL federated,engine federated,FDW,kết nối bảng từ xa,NocoBase"
---

# Cách kích hoạt engine federated trong MySQL

Database MySQL mặc định không bật module federated, bạn cần chỉnh sửa cấu hình my.cnf. Nếu là phiên bản docker, có thể xử lý mở rộng thông qua volumes:

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

Tạo tệp `./storage/mysql-conf/federated.cnf` mới

```ini
[mysqld]
federated
```

Khởi động lại mysql

```bash
docker compose up -d mysql
```

Kiểm tra xem federated đã được kích hoạt chưa

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)
