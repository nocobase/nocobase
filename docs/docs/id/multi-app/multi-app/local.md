---
pkg: '@nocobase/plugin-app-supervisor'
---

# Mode Memori Bersama

## Pendahuluan

Pilih mode ini saat ingin memisah domain bisnis tanpa menambah kompleksitas infrastruktur.

## Panduan Pengguna

### Variabel Lingkungan

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Membuat Aplikasi

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### Menjalankan Aplikasi

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### Mengakses Aplikasi

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### Menghentikan Aplikasi

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### Status Aplikasi

![](https://static-docs.nocobase.com/202512291122339.png)

### Menghapus Aplikasi

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
