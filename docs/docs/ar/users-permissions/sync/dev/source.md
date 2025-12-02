:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# توسيع مصادر البيانات المتزامنة

## نظرة عامة

تتيح NocoBase للمستخدمين توسيع أنواع مصادر البيانات لمزامنة بيانات المستخدم حسب الحاجة.

## جانب الخادم

### واجهة مصدر البيانات

توفر إضافة مزامنة بيانات المستخدم المدمجة تسجيل وإدارة أنواع مصادر البيانات. لتوسيع نوع مصدر البيانات، يجب عليك وراثة الفئة المجردة `SyncSource` التي توفرها الإضافة وتطبيق الواجهات القياسية ذات الصلة.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

تتضمن الفئة `SyncSource` خاصية `options` لاسترداد التكوينات المخصصة لمصدر البيانات.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    //...
    const { appid, secret } = this.options;
    //...
    return [];
  }
}
```

### وصف حقول `UserData`

| الحقل         | الوصف                                       |
| ------------- | ------------------------------------------- |
| `dataType`    | نوع البيانات، الخيارات هي `user` و `department` |
| `uniqueKey`   | حقل المعرف الفريد                           |
| `records`     | سجلات البيانات                              |
| `sourceName`  | اسم المصدر                                  |

إذا كان `dataType` هو `user`، فإن حقل `records` يحتوي على الحقول التالية:

| الحقل          | الوصف                   |
| ------------- | ----------------------- |
| `id`          | معرف المستخدم           |
| `nickname`    | اسم المستخدم المستعار   |
| `avatar`      | صورة المستخدم الرمزية   |
| `email`       | البريد الإلكتروني       |
| `phone`       | رقم الهاتف              |
| `departments` | مصفوفة معرفات الأقسام   |

إذا كان `dataType` هو `department`، فإن حقل `records` يحتوي على الحقول التالية:

| الحقل      | الوصف                |
| ---------- | -------------------- |
| `id`       | معرف القسم           |
| `name`     | اسم القسم            |
| `parentId` | معرف القسم الأب      |

### مثال على تطبيق واجهة مصدر البيانات

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

### تسجيل نوع مصدر البيانات

يجب تسجيل مصدر البيانات الموسع في وحدة إدارة البيانات.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.reigsterType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## جانب العميل

يسجل واجهة المستخدم للعميل أنواع مصادر البيانات باستخدام طريقة `registerType` التي توفرها واجهة عميل إضافة مزامنة بيانات المستخدم:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // نموذج إدارة الواجهة الخلفية
      },
    });
  }
}
```

### نموذج إدارة الواجهة الخلفية

![](https://static-docs.nocobase.com/202412041429835.png)

يوفر القسم العلوي تكوين مصدر البيانات العام، بينما يسمح القسم السفلي بتسجيل نماذج التكوين المخصصة.