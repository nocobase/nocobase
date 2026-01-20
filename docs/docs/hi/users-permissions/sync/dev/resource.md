:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# सिंक लक्ष्य संसाधनों का विस्तार करना

## अवलोकन

NocoBase डिफ़ॉल्ट रूप से उपयोगकर्ता डेटा को **उपयोगकर्ता** और **विभाग** तालिकाओं में सिंक करने का समर्थन करता है। यह आवश्यकतानुसार डेटा सिंक के लक्ष्य संसाधनों का विस्तार करने की भी अनुमति देता है, ताकि डेटा को अन्य तालिकाओं में लिखा जा सके या अन्य कस्टम प्रोसेसिंग की जा सके।

:::warning{title=प्रायोगिक}
पूर्ण दस्तावेज़ अभी जोड़ा जाना बाकी है।
:::

## लक्ष्य संसाधन हैंडलर इंटरफ़ेस

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

## लक्ष्य संसाधनों को रजिस्टर करना

`registerResource(resource: UserDataResource, options?: ToposortOptions)`

```ts
import { Plugin } from '@nocobase/server';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';

class CustomUserResourcePluginServer extends Plugin {
  async load() {
    const userDataSyncPlugin = this.app.pm.get(PluginUserDataSyncServer);
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(
        new CustomDataSyncResource(this.db, this.app.logger),
      );
    }
  }
}
```