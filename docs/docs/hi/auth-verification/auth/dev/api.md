:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# API संदर्भ

## सर्वर साइड

### Auth

यह एक कर्नेल API है, संदर्भ के लिए देखें: [Auth](/api/auth/auth)

### BaseAuth

यह एक कर्नेल API है, संदर्भ के लिए देखें: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### अवलोकन

`AuthModel` NocoBase एप्लिकेशन में उपयोग किया जाने वाला एक प्रमाणीकरणकर्ता (`Authenticator`, संदर्भ के लिए देखें: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) और [Auth - constructor](/api/auth/auth#constructor)) डेटा मॉडल है। यह उपयोगकर्ता डेटा **संग्रह** के साथ इंटरैक्ट करने के लिए कुछ तरीके (methods) प्रदान करता है। इसके अतिरिक्त, आप Sequelize Model द्वारा प्रदान किए गए तरीकों का भी उपयोग कर सकते हैं।

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### क्लास मेथड्स

- `findUser(uuid: string): UserModel` - `uuid` का उपयोग करके उपयोगकर्ता को खोजें।
  - `uuid` - वर्तमान प्रमाणीकरण प्रकार से उपयोगकर्ता का अद्वितीय पहचानकर्ता।

- `newUser(uuid: string, userValues?: any): UserModel` - एक नया उपयोगकर्ता बनाएँ, और `uuid` के माध्यम से उपयोगकर्ता को वर्तमान प्रमाणीकरणकर्ता से जोड़ें।
  - `uuid` - वर्तमान प्रमाणीकरण प्रकार से उपयोगकर्ता का अद्वितीय पहचानकर्ता।
  - `userValues` - वैकल्पिक। उपयोगकर्ता की अन्य जानकारी। यदि इसे पास नहीं किया जाता है, तो `uuid` को उपयोगकर्ता के उपनाम (nickname) के रूप में उपयोग किया जाएगा।

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - एक नया उपयोगकर्ता खोजें या बनाएँ; बनाने का नियम ऊपर जैसा ही है।
  - `uuid` - वर्तमान प्रमाणीकरण प्रकार से उपयोगकर्ता का अद्वितीय पहचानकर्ता।
  - `userValues` - वैकल्पिक। उपयोगकर्ता की अन्य जानकारी।

## क्लाइंट साइड

### `plugin.registerType()`

प्रमाणीकरण प्रकार के क्लाइंट को रजिस्टर करें।

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### सिग्नेचर

- `registerType(authType: string, options: AuthOptions)`

#### प्रकार

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### विवरण

- `SignInForm` - साइन इन फ़ॉर्म
- `SignInButton` - साइन इन (थर्ड-पार्टी) बटन, जिसे साइन-इन फ़ॉर्म के विकल्प के रूप में उपयोग किया जा सकता है।
- `SignUpForm` - साइन अप फ़ॉर्म
- `AdminSettingsForm` - एडमिन कॉन्फ़िगरेशन फ़ॉर्म

### रूट

Auth प्लगइन के लिए फ्रंटएंड रूट्स इस प्रकार रजिस्टर किए जाते हैं:

- Auth लेआउट
  - नाम: `auth`
  - पाथ: `-`
  - कंपोनेंट: `AuthLayout`

- साइन इन पेज
  - नाम: `auth.signin`
  - पाथ: `/signin`
  - कंपोनेंट: `SignInPage`

- साइन अप पेज
  - नाम: `auth.signup`
  - पाथ: `/signup`
  - कंपोनेंट: `SignUpPage`