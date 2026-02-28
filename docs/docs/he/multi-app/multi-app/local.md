---
pkg: '@nocobase/plugin-app-supervisor'
---

# מצב זיכרון משותף

## מבוא

מתאים לפיצול עסקי בלי להוסיף מורכבות תפעולית גבוהה.

## מדריך שימוש

### משתני סביבה

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### יצירת יישום

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### הפעלת יישום

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### גישה ליישום

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### עצירת יישום

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### מצב היישום

![](https://static-docs.nocobase.com/202512291122339.png)

### מחיקת יישום

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
