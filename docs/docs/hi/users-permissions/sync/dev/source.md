:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# सिंक्रनाइज़्ड डेटा स्रोत का विस्तार करना

## अवलोकन

NocoBase आपको अपनी ज़रूरत के अनुसार उपयोगकर्ता डेटा सिंक्रनाइज़ेशन के लिए डेटा स्रोत (Data Source) प्रकारों का विस्तार करने की सुविधा देता है।

## सर्वर साइड

### डेटा स्रोत (Data Source) इंटरफ़ेस

बिल्ट-इन उपयोगकर्ता डेटा सिंक्रनाइज़ेशन प्लगइन (Plugin) डेटा स्रोत (Data Source) प्रकारों के पंजीकरण और प्रबंधन की सुविधा देता है। किसी डेटा स्रोत (Data Source) प्रकार का विस्तार करने के लिए, आपको प्लगइन (Plugin) द्वारा प्रदान की गई `SyncSource` एब्सट्रैक्ट क्लास को इनहेरिट करना होगा और संबंधित मानक इंटरफ़ेस को लागू करना होगा।

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` क्लास में एक `options` प्रॉपर्टी होती है, जिसका उपयोग डेटा स्रोत (Data Source) के लिए कस्टम कॉन्फ़िगरेशन प्राप्त करने के लिए किया जाता है।

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

### `UserData` फ़ील्ड का विवरण

| फ़ील्ड        | विवरण                                           |
| ------------ | ----------------------------------------------- |
| `dataType`   | डेटा प्रकार, विकल्प `user` और `department` हैं |
| `uniqueKey`  | अद्वितीय पहचानकर्ता फ़ील्ड                      |
| `records`    | डेटा रिकॉर्ड                                    |
| `sourceName` | डेटा स्रोत (Data Source) का नाम                 |

यदि `dataType` `user` है, तो `records` फ़ील्ड में निम्नलिखित फ़ील्ड शामिल होते हैं:

| फ़ील्ड          | विवरण                   |
| ------------- | ------------------------ |
| `id`          | उपयोगकर्ता ID            |
| `nickname`    | उपयोगकर्ता उपनाम         |
| `avatar`      | उपयोगकर्ता अवतार         |
| `email`       | ईमेल                     |
| `phone`       | फ़ोन नंबर                |
| `departments` | विभाग ID का ऐरे         |

यदि `dataType` `department` है, तो `records` फ़ील्ड में निम्नलिखित फ़ील्ड शामिल होते हैं:

| फ़ील्ड      | विवरण                |
| ---------- | --------------------- |
| `id`       | विभाग ID             |
| `name`     | विभाग का नाम         |
| `parentId` | पैरेंट विभाग ID       |

### डेटा स्रोत (Data Source) इंटरफ़ेस के कार्यान्वयन का उदाहरण

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

### डेटा स्रोत (Data Source) प्रकार का पंजीकरण

विस्तारित डेटा स्रोत (Data Source) को डेटा प्रबंधन मॉड्यूल के साथ पंजीकृत करना होगा।

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

## क्लाइंट साइड

क्लाइंट उपयोगकर्ता इंटरफ़ेस, उपयोगकर्ता डेटा सिंक्रनाइज़ेशन प्लगइन (Plugin) के क्लाइंट इंटरफ़ेस द्वारा प्रदान किए गए `registerType` मेथड का उपयोग करके डेटा स्रोत (Data Source) प्रकारों को पंजीकृत करता है:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // बैकएंड प्रबंधन फ़ॉर्म
      },
    });
  }
}
```

### बैकएंड प्रबंधन फ़ॉर्म

![](https://static-docs.nocobase.com/202412041429835.png)

ऊपरी भाग सामान्य डेटा स्रोत (Data Source) कॉन्फ़िगरेशन प्रदान करता है, जबकि निचला भाग कस्टम कॉन्फ़िगरेशन फ़ॉर्म के पंजीकरण की अनुमति देता है।