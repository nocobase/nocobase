---
title: "Cách bật engine federated trên MySQL"
description: "Bật storage engine federated trên MySQL: chỉnh sửa my.cnf và cấu hình Docker volumes để kết nối FDW với các bảng MySQL/MariaDB từ xa."
keywords: "MySQL federated,engine federated,FDW,kết nối bảng từ xa,NocoBase"
---

# Cách bật engine federated trên MySQL

Cơ sở dữ liệu MySQL mặc định chưa bật module federated. Bạn cần chỉnh sửa cấu hình my.cnf; nếu sử dụng phiên bản Docker, có thể xử lý phần mở rộng thông qua volumes:

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

Khởi động lại MySQL

```bash
docker compose up -d mysql
```

Kiểm tra xem federated đã được kích hoạt hay chưa

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)