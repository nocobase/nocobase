# توسيع مصادر البيانات المتزامنة

## نظرة عامة

يتيح NocoBase للمستخدمين توسيع أنواع مصادر البيانات لمزامنة بيانات المستخدمين حسب الحاجة.

## جانب الخادم

### واجهة مصدر البيانات

توفر إضافة مزامنة بيانات المستخدمين المدمجة تسجيلًا وإدارةً لأنواع مصادر البيانات. لتوسيع نوع مصدر بيانات، قم بالوراثة من الفئة المجردة `SyncSource` التي توفرها الإضافة وتنفيذ الواجهات القياسية ذات الصلة.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

تتضمن فئة `SyncSource` خاصية `options` لاسترداد التهيئات المخصصة لمصدر البيانات.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    const { appid, secret } = this.options;
    return [];
  }
}
```

### وصف حقول `UserData`

| الحقل        | الوصف                                          |
| ------------ | ---------------------------------------------- |
| `dataType`   | نوع البيانات، الخيارات هي `user` و`department` |
| `uniqueKey`  | حقل المعرف الفريد                              |
| `records`    | سجلات البيانات                                 |
| `sourceName` | اسم مصدر البيانات                              |

إذا كان `dataType` هو `user`، يحتوي حقل `records` على الحقول التالية:

| الحقل         | الوصف                    |
| ------------- | ------------------------ |
| `id`          | معرف المستخدم            |
| `nickname`    | اسم المستخدم المستعار    |
| `avatar`      | صورة المستخدم الرمزية    |
| `email`       | البريد الإلكتروني        |
| `phone`       | رقم الهاتف               |
| `departments` | مصفوفة من معرفات الأقسام |

إذا كان `dataType` هو `department`، يحتوي حقل `records` على الحقول التالية:

| الحقل      | الوصف              |
| ---------- | ------------------ |
| `id`       | معرف القسم         |
| `name`     | اسم القسم          |
| `parentId` | معرف القسم الأب    |

### مثال على تنفيذ واجهة مصدر البيانات

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );
    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();
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

### تسجيل نوع مصدر البيانات

يجب تسجيل مصدر البيانات الموسّع مع وحدة إدارة البيانات.

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
        title: 'Custom Source',
      });
    }
  }
}
```

## جانب العميل

تقوم واجهة العميل بتسجيل أنواع مصادر البيانات باستخدام طريقة `registerType` التي توفرها واجهة عميل إضافة مزامنة بيانات المستخدمين:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm,
      },
    });
  }
}
```

### نموذج إدارة الواجهة الخلفية

![](https://static-docs.nocobase.com/202412041429835.png)

يوفر القسم العلوي تهيئة عامة لمصدر البيانات، بينما يتيح القسم السفلي تسجيل نماذج تهيئة مخصصة.
