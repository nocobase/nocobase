:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/integration/fdw/enable-federated).
:::

# Cách kích hoạt engine federated trong MySQL

Cơ sở dữ liệu MySQL mặc định không kích hoạt module federated. Bạn cần sửa đổi cấu hình my.cnf. Nếu đang sử dụng phiên bản Docker, bạn có thể xử lý việc mở rộng cấu hình thông qua volumes:

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

Tạo mới tệp `./storage/mysql-conf/federated.cnf`

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