:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# AuthManager

## अवलोकन

`AuthManager` NocoBase में उपयोगकर्ता प्रमाणीकरण प्रबंधन मॉड्यूल है, जिसका उपयोग विभिन्न प्रकार के उपयोगकर्ता प्रमाणीकरण को रजिस्टर करने के लिए किया जाता है।

### मूल उपयोग

```ts
const authManager = new AuthManager({
  // अनुरोध हेडर से वर्तमान प्रमाणीकरणकर्ता पहचानकर्ता प्राप्त करने के लिए उपयोग किया जाता है
  authKey: 'X-Authenticator',
});

// AuthManager के लिए प्रमाणीकरणकर्ताओं को स्टोर और पुनः प्राप्त करने के तरीके सेट करें
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// एक प्रमाणीकरण प्रकार रजिस्टर करें
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// प्रमाणीकरण मिडलवेयर का उपयोग करें
app.resourceManager.use(authManager.middleware());
```

### अवधारणाएँ

- **`AuthType`**: विभिन्न उपयोगकर्ता प्रमाणीकरण विधियाँ, जैसे पासवर्ड, एसएमएस, ओआईडीसी, एसएएमएल, आदि।
- **`Authenticator`**: प्रमाणीकरण विधि के लिए इकाई, जो वास्तव में एक संग्रह (collection) में संग्रहीत होती है, और किसी विशेष `AuthType` के कॉन्फ़िगरेशन रिकॉर्ड से मेल खाती है। एक प्रमाणीकरण विधि में कई प्रमाणीकरणकर्ता हो सकते हैं, जो विभिन्न कॉन्फ़िगरेशन के अनुरूप होते हैं, और विभिन्न उपयोगकर्ता प्रमाणीकरण विधियाँ प्रदान करते हैं।
- **`Authenticator name`**: एक प्रमाणीकरणकर्ता के लिए अद्वितीय पहचानकर्ता, जिसका उपयोग वर्तमान अनुरोध के लिए प्रमाणीकरण विधि निर्धारित करने के लिए किया जाता है।

## क्लास विधियाँ

### `constructor()`

कंस्ट्रक्टर, एक `AuthManager` इंस्टेंस बनाता है।

#### सिग्नेचर

- `constructor(options: AuthManagerOptions)`

#### प्रकार

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### विवरण

##### AuthManagerOptions

| प्रॉपर्टी  | प्रकार                        | विवरण                                                              | डिफ़ॉल्ट मान       |
| --------- | --------------------------- | ----------------------------------------------------------------- | ----------------- |
| `authKey` | `string`                    | वैकल्पिक, अनुरोध हेडर में वह कुंजी जो वर्तमान प्रमाणीकरणकर्ता पहचानकर्ता को रखती है। | `X-Authenticator` |
| `default` | `string`                    | वैकल्पिक, डिफ़ॉल्ट प्रमाणीकरणकर्ता पहचानकर्ता।                                | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | वैकल्पिक, यदि JWT का उपयोग प्रमाणीकरण के लिए किया जा रहा है तो इसे कॉन्फ़िगर किया जा सकता है। | -                 |

##### JwtOptions

| प्रॉपर्टी    | प्रकार     | विवरण                   | डिफ़ॉल्ट मान       |
| ----------- | -------- | ---------------------- | ----------------- |
| `secret`    | `string` | टोकन सीक्रेट            | `X-Authenticator` |
| `expiresIn` | `string` | वैकल्पिक, टोकन की समाप्ति अवधि। | `7d`              |

### `setStorer()`

प्रमाणीकरणकर्ता डेटा को स्टोर और पुनः प्राप्त करने के तरीके सेट करता है।

#### सिग्नेचर

- `setStorer(storer: Storer)`

#### प्रकार

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### विवरण

##### Authenticator

| प्रॉपर्टी   | प्रकार                  | विवरण                     |
| ---------- | --------------------- | ------------------------ |
| `authType` | `string`              | प्रमाणीकरण प्रकार         |
| `options`  | `Record<string, any>` | प्रमाणीकरणकर्ता-संबंधी कॉन्फ़िगरेशन |

##### Storer

`Storer` प्रमाणीकरणकर्ता स्टोरेज के लिए इंटरफ़ेस है, जिसमें एक विधि शामिल है।

- `get(name: string): Promise<Authenticator>` - इसके पहचानकर्ता द्वारा एक प्रमाणीकरणकर्ता प्राप्त करता है। NocoBase में, वास्तविक वापसी प्रकार [AuthModel](/auth-verification/auth/dev/api#authmodel) है।

### `registerTypes()`

एक प्रमाणीकरण प्रकार रजिस्टर करता है।

#### सिग्नेचर

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### प्रकार

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // प्रमाणीकरण क्लास।
  title?: string; // प्रमाणीकरण प्रकार का प्रदर्शन नाम।
};
```

#### विवरण

| प्रॉपर्टी | प्रकार               | विवरण                                              |
| ------- | ------------------ | -------------------------------------------------- |
| `auth`  | `AuthExtend<Auth>` | प्रमाणीकरण प्रकार का कार्यान्वयन, [Auth](./auth) देखें |
| `title` | `string`           | वैकल्पिक। इस प्रमाणीकरण प्रकार का शीर्षक जो फ्रंटएंड पर प्रदर्शित होता है। |

### `listTypes()`

रजिस्टर्ड प्रमाणीकरण प्रकारों की सूची प्राप्त करता है।

#### सिग्नेचर

- `listTypes(): { name: string; title: string }[]`

#### विवरण

| प्रॉपर्टी | प्रकार     | विवरण                 |
| ------- | -------- | -------------------- |
| `name`  | `string` | प्रमाणीकरण प्रकार पहचानकर्ता |
| `title` | `string` | प्रमाणीकरण प्रकार शीर्षक   |

### `get()`

एक प्रमाणीकरणकर्ता प्राप्त करता है।

#### सिग्नेचर

- `get(name: string, ctx: Context)`

#### विवरण

| प्रॉपर्टी | प्रकार      | विवरण           |
| ------ | --------- | -------------- |
| `name` | `string`  | प्रमाणीकरणकर्ता पहचानकर्ता |
| `ctx`  | `Context` | अनुरोध संदर्भ   |

### `middleware()`

प्रमाणीकरण मिडलवेयर। वर्तमान प्रमाणीकरणकर्ता प्राप्त करता है और उपयोगकर्ता प्रमाणीकरण करता है।