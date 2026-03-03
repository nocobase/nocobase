---
pkg: '@nocobase/plugin-app-supervisor'
---

# Paylaşımlı Bellek Modu

## Giriş

İş alanlarını uygulama bazında ayırmak ama operasyonu karmaşıklaştırmamak için uygundur.

## Kullanım kılavuzu

### Ortam değişkenleri

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Uygulama oluşturma

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### Uygulama başlatma

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### Uygulamaya erişim

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### Uygulama durdurma

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### Uygulama durumu

![](https://static-docs.nocobase.com/202512291122339.png)

### Uygulama silme

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
