---
pkg: '@nocobase/plugin-app-supervisor'
---

# Режим спільної пам’яті

## Вступ

Підходить для поділу доменів без ускладнення інфраструктури.

## Посібник користувача

### Змінні середовища

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Створення застосунку

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### Запуск застосунку

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### Доступ до застосунку

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### Зупинка застосунку

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### Стан застосунку

![](https://static-docs.nocobase.com/202512291122339.png)

### Видалення застосунку

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
