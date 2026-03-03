---
pkg: '@nocobase/plugin-app-supervisor'
---

# Delat minnesläge

## Introduktion

Använd läget när du vill dela upp verksamhet utan tung driftarkitektur.

## Användarguide

### Miljövariabler

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Skapa applikation

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### Starta applikation

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### Öppna applikation

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### Stoppa applikation

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### Applikationsstatus

![](https://static-docs.nocobase.com/202512291122339.png)

### Ta bort applikation

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
