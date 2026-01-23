:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Auth

## अवलोकन

`Auth` यूज़र ऑथेंटिकेशन के प्रकारों का एक एब्स्ट्रैक्ट क्लास है। यह यूज़र ऑथेंटिकेशन को पूरा करने के लिए आवश्यक इंटरफ़ेस को परिभाषित करता है। एक नए यूज़र ऑथेंटिकेशन प्रकार को एक्सटेंड करने के लिए, आपको `Auth` क्लास को इनहेरिट करना होगा और इसके मेथड्स को इम्प्लीमेंट करना होगा। एक बुनियादी इम्प्लीमेंटेशन के लिए, [BaseAuth](./base-auth.md) देखें।

```ts
interface IAuth {
  user: Model;
  // ऑथेंटिकेशन स्थिति की जाँच करें और वर्तमान यूज़र को वापस करें।
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: ऑथेंटिकेशन
  async check() {
    // ...
  }
}
```

## इंस्टेंस प्रॉपर्टीज़

### `user`

ऑथेंटिकेटेड यूज़र जानकारी।

#### सिग्नेचर

- `abstract user: Model`

## क्लास मेथड्स

### `constructor()`

कंस्ट्रक्टर, एक `Auth` इंस्टेंस बनाता है।

#### सिग्नेचर

- `constructor(config: AuthConfig)`

#### प्रकार

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### विवरण

##### AuthConfig

| प्रॉपर्टी        | प्रकार                                          | विवरण                                                                                                         |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | ऑथेंटिकेटर डेटा मॉडल। NocoBase एप्लिकेशन में इसका वास्तविक प्रकार [AuthModel](/auth-verification/auth/dev/api#authmodel) है। |
| `options`       | `Record<string, any>`                           | ऑथेंटिकेटर-संबंधित कॉन्फ़िगरेशन।                                                                               |
| `ctx`           | `Context`                                       | रिक्वेस्ट कॉन्टेक्स्ट।                                                                                         |

### `check()`

यूज़र ऑथेंटिकेशन। यह यूज़र जानकारी वापस करता है। यह एक एब्स्ट्रैक्ट मेथड है जिसे सभी ऑथेंटिकेशन प्रकारों को इम्प्लीमेंट करना होगा।

#### सिग्नेचर

- `abstract check(): Promise<Model>`

### `signIn()`

यूज़र साइन इन।

#### सिग्नेचर

- `signIn(): Promise<any>`

### `signUp()`

यूज़र साइन अप।

#### सिग्नेचर

- `signUp(): Promise<any>`

### `signOut()`

यूज़र साइन आउट।

#### सिग्नेचर

- `signOut(): Promise<any>`