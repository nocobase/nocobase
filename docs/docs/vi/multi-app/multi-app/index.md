---
pkg: '@nocobase/plugin-app-supervisor'
---

# Quản lý đa ứng dụng

## Tổng quan

NocoBase cho phép quản lý nhiều ứng dụng cô lập từ một điểm vào duy nhất thông qua AppSupervisor.


Ở giai đoạn đầu, một ứng dụng thường đủ dùng. Khi mở rộng, chi phí vận hành và nhu cầu cách ly tăng lên.


Ở chế độ này, nhiều ứng dụng chạy trong một instance NocoBase; có thể tách DB nhưng chia sẻ process và memory.

![](https://static-docs.nocobase.com/202512231055907.png)


Khi quy mô lớn, nên dùng mô hình hybrid: Supervisor và nhiều môi trường Worker.

![](https://static-docs.nocobase.com/202512231215186.png)
