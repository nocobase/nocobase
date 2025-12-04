---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Nguồn Dữ liệu Ngoài - Oracle

## Giới thiệu

Plugin này cho phép bạn sử dụng cơ sở dữ liệu Oracle bên ngoài làm nguồn dữ liệu. Hiện tại, plugin hỗ trợ các phiên bản Oracle từ 11g trở lên.

## Cài đặt

### Cài đặt Oracle Client

Đối với các phiên bản máy chủ Oracle dưới 12.1, bạn cần cài đặt Oracle client.

![Cài đặt Oracle Client](https://static-docs.nocobase.com/20241204164359.png)

Ví dụ trên Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Nếu client không được cài đặt theo cách trên, bạn cần cung cấp đường dẫn đến client (để biết thêm chi tiết, hãy tham khảo tài liệu [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![Cấu hình đường dẫn Oracle Client](https://static-docs.nocobase.com/20241204165940.png)

### Cài đặt plugin

Tham khảo

## Hướng dẫn sử dụng

Để biết hướng dẫn chi tiết, hãy tham khảo mục [Nguồn dữ liệu / Cơ sở dữ liệu ngoài](/data-sources/data-source-manager/external-database).