:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# ऑडिटमैनेजर

## अवलोकन

`AuditManager` NocoBase में संसाधन ऑडिट प्रबंधन मॉड्यूल है, जिसका उपयोग उन संसाधन इंटरफेस को रजिस्टर करने के लिए किया जाता है जिनकी ऑडिटिंग की आवश्यकता है।

### मूल उपयोग

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## क्लास विधियाँ

### `setLogger()`

ऑडिट लॉग के लिए आउटपुट विधि सेट करता है।

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### सिग्नेचर

- `setLogger(logger: AuditLogger)`

#### टाइप

```ts
export interface AuditLog {
  uuid: string;
  dataSource: string;
  resource: string;
  action: string;
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
  userId: string;
  roleName: string;
  ip: string;
  ua: string;
  status: number;
  metadata?: Record<string, any>;
}

export interface AuditLogger {
  log(auditLog: AuditLog): Promise<void>;
}
```

### `registerAction()`

ऑडिट किए जाने वाली एक संसाधन क्रिया को रजिस्टर करता है।

#### सिग्नेचर

- `registerAction(action: Action)`

#### टाइप

```ts
export interface UserInfo {
  userId?: string;
  roleName?: string;
}

export interface SourceAndTarget {
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
}

type Action =
  | string
  | {
      name: string;
      getMetaData?: (ctx: Context) => Promise<Record<string, any>>;
      getUserInfo?: (ctx: Context) => Promise<UserInfo>;
      getSourceAndTarget?: (ctx: Context) => Promise<SourceAndTarget>;
    };
```

#### विवरण

कई तरह से लिखा जा सकता है:

1.  सभी संसाधनों पर लागू होता है

    ```ts
    registerActions(['create']);
    ```

2.  किसी विशिष्ट संसाधन की सभी क्रियाओं पर लागू होता है `resource:*`

    ```ts
    registerActions(['app:*']);
    ```

3.  किसी विशिष्ट संसाधन की किसी विशिष्ट क्रिया पर लागू होता है `resource:action`

    ```ts
    registerAction(['pm:update']);
    ```

4.  क्रिया के लिए कस्टम `getMetaData`, `getUserInfo`, और `getSourceAndTarget` विधियों को पास करने का समर्थन करता है।

    ```ts
    registerActions([
      'create',
      { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
    ]);
    ```

जब पंजीकृत इंटरफेस ओवरलैप होते हैं, तो अधिक विशिष्ट पंजीकरण विधि को उच्च प्राथमिकता मिलती है। उदाहरण के लिए:

1.  `registerActions('create')`

2.  `registerAction({ name: 'user:*', getMetaData })`

3.  `registerAction({ name: 'user:create', getMetaData })`

`user:create` इंटरफ़ेस के लिए, `3` प्रभावी होगा।

### `registerActions()`

ऑडिट किए जाने वाली कई संसाधन क्रियाओं को रजिस्टर करता है।

#### सिग्नेचर

- `registerActions(actions: Action[])`