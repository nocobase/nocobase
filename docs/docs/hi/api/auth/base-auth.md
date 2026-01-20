:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# BaseAuth

## अवलोकन

`BaseAuth` [Auth](./auth) एब्सट्रैक्ट क्लास से इनहेरिट करता है और यूज़र प्रमाणीकरण (authentication) प्रकारों का एक बुनियादी इम्प्लीमेंटेशन है, जो JWT को प्रमाणीकरण विधि के रूप में उपयोग करता है। ज़्यादातर मामलों में, आप यूज़र प्रमाणीकरण प्रकारों को `BaseAuth` से इनहेरिट करके बढ़ा सकते हैं, और सीधे `Auth` एब्सट्रैक्ट क्लास से इनहेरिट करने की ज़रूरत नहीं है।

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // यूज़र संग्रह (collection) सेट करें
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // यूज़र प्रमाणीकरण (authentication) लॉजिक, जिसे `auth.signIn` द्वारा कॉल किया जाता है
  // यूज़र डेटा वापस करें
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## क्लास मेथड्स

### `constructor()`

कंस्ट्रक्टर फ़ंक्शन, जो एक `BaseAuth` इंस्टेंस बनाता है।

#### सिग्नेचर

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### विवरण

| पैरामीटर         | प्रकार         | विवरण                                                                                                |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | [Auth - AuthConfig](./auth#authconfig) देखें                                                         |
| `userCollection` | `Collection` | यूज़र संग्रह, उदाहरण के लिए: `db.getCollection('users')`। [DataBase - Collection](../database/collection) देखें। |

### `user()`

एक्सेससर, जो यूज़र जानकारी सेट और प्राप्त करता है। डिफ़ॉल्ट रूप से, यह एक्सेस के लिए `ctx.state.currentUser` ऑब्जेक्ट का उपयोग करता है।

#### सिग्नेचर

- `set user()`
- `get user()`

### `check()`

रिक्वेस्ट टोकन के माध्यम से प्रमाणीकरण करता है और यूज़र जानकारी वापस करता है।

### `signIn()`

यूज़र साइन-इन, एक टोकन जनरेट करता है।

### `signUp()`

यूज़र साइन-अप।

### `signOut()`

यूज़र साइन-आउट, टोकन की समय-सीमा समाप्त हो जाती है।

### `validate()` *

मुख्य प्रमाणीकरण (authentication) लॉजिक, जिसे `signIn` इंटरफ़ेस द्वारा कॉल किया जाता है, यह निर्धारित करने के लिए कि क्या यूज़र सफलतापूर्वक साइन-इन कर सकता है।