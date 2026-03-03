---
pkg: '@nocobase/plugin-app-supervisor'
---

# साझा मेमोरी मोड

## परिचय

जब कम ऑपरेशनल जटिलता के साथ ऐप-स्तरीय विभाजन चाहिए, तब यह मोड चुनें।

## उपयोग गाइड

### पर्यावरण चर

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### एप्लिकेशन बनाना

In **System Settings**, open **App supervisor**.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

### एप्लिकेशन शुरू करना

Click **Start**.

![](https://static-docs.nocobase.com/202512291121065.png)

### एप्लिकेशन एक्सेस

Default path:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

### एप्लिकेशन रोकना

Click **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### एप्लिकेशन स्थिति

![](https://static-docs.nocobase.com/202512291122339.png)

### एप्लिकेशन हटाना

Click **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- Plugin config is isolated per app.
- Database can be isolated per app.
- Main app backup does not include data from other apps.
- App version follows main app version in shared-memory mode.
