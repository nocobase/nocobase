---
pkg: '@nocobase/plugin-app-supervisor'
---

# Manajemen Multi-Aplikasi

## Ringkasan

NocoBase memungkinkan pengelolaan banyak aplikasi terisolasi melalui satu titik masuk menggunakan AppSupervisor.


Pada tahap awal, satu aplikasi biasanya cukup. Saat skala naik, kebutuhan isolasi dan biaya operasional ikut naik.


Mode ini menjalankan banyak aplikasi dalam satu instance NocoBase. DB bisa terpisah, tetapi proses dan memori dibagi.

![](https://static-docs.nocobase.com/202512231055907.png)


Untuk skala besar, gunakan arsitektur hybrid: Supervisor sebagai kontrol pusat dan beberapa Worker sebagai runtime.

![](https://static-docs.nocobase.com/202512231215186.png)
