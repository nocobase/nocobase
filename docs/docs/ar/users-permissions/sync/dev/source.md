# توسيع مصادر البيانات المتزامنة (Extending Synchronized Data Sources)

## نظرة عامة

يتيح NocoBase للمستخدمين إمكانية توسيع أنواع مصادر البيانات الخاصة بمزامنة بيانات المستخدمين حسب الحاجة.

---

## جانب الخادم (Server Side)

### واجهة مصدر البيانات

يوفر مكوّن مزامنة بيانات المستخدمين المدمج إمكانية تسجيل وإدارة أنواع مصادر البيانات. لتوسيع نوع مصدر بيانات، يجب وراثة الصنف المجرد `SyncSource` المقدم من الإضافة وتنفيذ الواجهات القياسية المطلوبة.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

يحتوي الصنف `SyncSource` على خاصية `options` للحصول على الإعدادات المخصصة لمصدر البيانات.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const { appid, secret } = this.options;
    // ...
    return [];
  }
}
```

---

### وصف حقول `UserData`

| الحقل        | الوصف                                              |
| ------------ | -------------------------------------------------- |
| `dataType`   | نوع البيانات، القيم الممكنة: `user` و `department` |
| `uniqueKey`  | حقل المعرف الفريد                                  |
| `records`    | السجلات                                            |
| `sourceName` | اسم مصدر البيانات                                  |

---

إذا كانت قيمة `dataType` هي `user` فإن حقل `records` يحتوي على:

| الحقل         | الوصف                 |
| ------------- | --------------------- |
| `id`          | معرف المستخدم         |
| `nickname`    | اسم المستخدم          |
| `avatar`      | صورة المستخدم         |
| `email`       | البريد الإلكتروني     |
| `phone`       | رقم الهاتف            |
| `departments` | مصفوفة معرفات الأقسام |

---

إذا كانت قيمة `dataType` هي `department` فإن حقل `records` يحتوي على:

| الحقل      | الوصف           |
| ---------- | --------------- |
| `id`       | معرف القسم      |
| `name`     | اسم القسم       |
| `parentId` | معرف القسم الأب |

---

### مثال على تنفيذ مصدر البيانات

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );

    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();

    // ...

    return [
      {
        dataType: 'department',
        uniqueKey: 'id',
        records: departments,
        sourceName: this.instance.name,
      },
      {
        dataType: 'user',
        uniqueKey: 'id',
        records: users,
        sourceName: this.instance.name,
      },
    ];
  }
}
```

---

### تسجيل نوع مصدر البيانات

يجب تسجيل مصدر البيانات الموسّع داخل وحدة إدارة البيانات.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;

    if (syncPlugin) {
      syncPlugin.sourceManager.registerType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'مصدر مخصص',
      });
    }
  }
}
```

---

## جانب العميل (Client Side)

يقوم واجه المستخدم بتسجيل أنواع مصادر البيانات باستخدام دالة `registerType` الخاصة بمكوّن مزامنة بيانات المستخدمين في العميل:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);

    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // نموذج إعدادات الإدارة
      },
    });
  }
}
```

---

### نموذج إعدادات الإدارة

![](https://static-docs.nocobase.com/202412041429835.png)

يوفر الجزء العلوي إعدادات عامة لمصدر البيانات، بينما يتيح الجزء السفلي تسجيل نماذج إعدادات مخصصة.
