:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Cách bật Federated Engine trong MySQL

Cơ sở dữ liệu MySQL không bật mô-đun federated theo mặc định. Bạn cần sửa đổi cấu hình `my.cnf`. Nếu bạn đang sử dụng phiên bản Docker, bạn có thể xử lý việc mở rộng thông qua `volumes`:

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

Tạo một tệp mới `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

Khởi động lại MySQL

```bash
docker compose up -d mysql
```

Kiểm tra xem federated đã được kích hoạt chưa

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)