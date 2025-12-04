:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הרחבת יעדי סנכרון

## סקירה כללית

NocoBase תומכת באופן מובנה בסנכרון נתוני משתמשים לטבלאות ה**משתמשים** וה**מחלקות**. היא גם מאפשרת להרחיב את יעדי סנכרון הנתונים כדי לכתוב נתונים לטבלאות אחרות או לבצע עיבוד מותאם אישית לפי הצורך.

:::warning{title=ניסיוני}
תיעוד מלא יתווסף בהמשך.
:::

## ממשק לטיפול במשאבי יעד

```ts
export abstract class UserDataResource {
  name: string;
  accepts: SyncAccept[];
  db: Database;
  logger: SystemLogger;

  constructor(db: Database, logger: SystemLogger) {
    this.db = db;
    this.logger = logger;
  }

  abstract update(
    record: OriginRecord,
    resourcePks: PrimaryKey[],
    matchKey?: string,
  ): Promise<RecordResourceChanged[]>;
  abstract create(
    record: OriginRecord,
    matchKey: string,
  ): Promise<RecordResourceChanged[]>;

  get syncRecordRepo() {
    return this.db.getRepository('userDataSyncRecords');
  }

  get syncRecordResourceRepo() {
    return this.db.getRepository('userDataSyncRecordsResources');
  }
}
```

## רישום משאבי יעד

`registerResource(resource: UserDataResource, options?: ToposortOptions)`

```ts
import { Plugin } from '@nocobase/server';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';

class CustomUserResourcePluginServer extends Plugin {
  async load() {
    const userDataSyncPlugin = this.app.pm.get(PluginUserDataSyncServer);
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(new CustomDataSyncResource(this.db, this.app.logger)
    }
  }
}
```