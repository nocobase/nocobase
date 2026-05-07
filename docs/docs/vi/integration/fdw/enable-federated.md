---
title: "Bật engine federated trong MySQL"
description: "Bật engine federated trong MySQL: chỉnh sửa my.cnf, cấu hình Docker volumes, federated.cnf, khởi động lại để xác minh, dùng cho FDW kết nối MySQL/MariaDB từ xa."
keywords: "MySQL federated,Engine federated,my.cnf,Docker MySQL,Điều kiện tiên quyết FDW,NocoBase"
---

# Cách bật engine federated trong MySQL

Cơ sở dữ liệu MySQL theo mặc định không bật module federated, cần chỉnh sửa cấu hình my.cnf. Nếu bạn dùng phiên bản docker, có thể xử lý mở rộng thông qua volumes:

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
