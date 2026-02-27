---
pkg: '@nocobase/plugin-app-supervisor'
---

# Režim sdílené paměti

## Úvod

Použijte tento režim, když chcete oddělit domény bez složité infrastruktury.

## Uživatelská příručka

### Proměnné prostředí

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Vytvoření aplikace

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### Spuštění aplikace

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### Přístup k aplikaci

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### Zastavení aplikace

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### Stav aplikace

![](https://static-docs.nocobase.com/202512291122339.png)

### Odstranění aplikace

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
