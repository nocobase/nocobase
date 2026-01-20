:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הרחבת מקורות נתונים מסונכרנים

## סקירה כללית

NocoBase מאפשרת למשתמשים להרחיב את סוגי מקורות הנתונים לסנכרון נתוני משתמשים, בהתאם לצורך.

## צד השרת

### ממשק מקור הנתונים

התוסף המובנה לסנכרון נתוני משתמשים מספק רישום וניהול עבור סוגי מקורות נתונים. כדי להרחיב סוג של מקור נתונים, עליכם לרשת את המחלקה המופשטת `SyncSource` המסופקת על ידי התוסף, וליישם את הממשקים הסטנדרטיים הרלוונטיים.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

המחלקה `SyncSource` כוללת מאפיין `options` המשמש לאחזור הגדרות מותאמות אישית עבור מקור הנתונים.

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

### תיאור שדות `UserData`

| שדה          | תיאור                                         |
| ------------ | --------------------------------------------- |
| `dataType`   | סוג הנתונים, האפשרויות הן `user` ו-`department` |
| `uniqueKey`  | שדה מזהה ייחודי                               |
| `records`    | רשומות נתונים                                 |
| `sourceName` | שם מקור הנתונים                              |

אם `dataType` הוא `user`, שדה ה-`records` מכיל את השדות הבאים:

| שדה           | תיאור                 |
| ------------- | --------------------- |
| `id`          | מזהה משתמש            |
| `nickname`    | כינוי משתמש           |
| `avatar`      | תמונת פרופיל משתמש    |
| `email`       | דוא"ל                 |
| `phone`       | מספר טלפון            |
| `departments` | מערך מזהי מחלקות     |

אם `dataType` הוא `department`, שדה ה-`records` מכיל את השדות הבאים:

| שדה        | תיאור                 |
| ---------- | --------------------- |
| `id`       | מזהה מחלקה            |
| `name`     | שם מחלקה              |
| `parentId` | מזהה מחלקת אב         |

### דוגמה ליישום ממשק מקור הנתונים

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

### רישום סוג מקור נתונים

מקור הנתונים המורחב חייב להירשם במודול ניהול הנתונים.

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

## צד הלקוח

ממשק המשתמש בצד הלקוח רושם סוגי מקורות נתונים באמצעות שיטת `registerType` המסופקת על ידי ממשק הלקוח של תוסף סנכרון נתוני המשתמשים:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // טופס הגדרות ניהול
      },
    });
  }
}
```

### טופס הגדרות ניהול

![](https://static-docs.nocobase.com/202412041429835.png)

החלק העליון מספק הגדרות כלליות למקור הנתונים, בעוד שהחלק התחתון מאפשר רישום של טופסי הגדרה מותאמים אישית.