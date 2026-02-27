---
pkg: '@nocobase/plugin-app-supervisor'
---

# Chế độ bộ nhớ dùng chung

## Giới thiệu

Phù hợp khi cần tách ứng dụng theo miền nghiệp vụ mà không tăng độ phức tạp hạ tầng.

## Hướng dẫn sử dụng

### Biến môi trường

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Tạo ứng dụng

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### Khởi động ứng dụng

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### Truy cập ứng dụng

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### Dừng ứng dụng

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### Trạng thái ứng dụng

![](https://static-docs.nocobase.com/202512291122339.png)

### Xóa ứng dụng

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
