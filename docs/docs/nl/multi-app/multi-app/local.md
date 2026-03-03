---
pkg: '@nocobase/plugin-app-supervisor'
---

# Gedeeld geheugenmodus

## Introductie

Gebruik deze modus voor app-splitsing zonder zware operationele architectuur.

## Gebruikershandleiding

### Omgevingsvariabelen

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Applicatie maken

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### Applicatie starten

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### Applicatie bezoeken

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### Applicatie stoppen

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### Applicatiestatus

![](https://static-docs.nocobase.com/202512291122339.png)

### Applicatie verwijderen

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
