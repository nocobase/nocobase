:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Migration अपग्रेड स्क्रिप्ट

NocoBase प्लगइन के विकास और अपडेट के दौरान, प्लगइन की डेटाबेस संरचना या कॉन्फ़िगरेशन में असंगत बदलाव हो सकते हैं। इन बदलावों को सुचारु रूप से संभालने के लिए, NocoBase **Migration** तंत्र प्रदान करता है। यह तंत्र माइग्रेशन फ़ाइलें लिखकर इन बदलावों को प्रबंधित करता है। यह लेख आपको Migration के उपयोग के तरीके और विकास प्रक्रिया को व्यवस्थित रूप से समझने में मदद करेगा।

## Migration की अवधारणा

Migration एक स्क्रिप्ट है जो प्लगइन अपग्रेड के दौरान स्वचालित रूप से निष्पादित होती है, जिसका उपयोग निम्नलिखित समस्याओं को हल करने के लिए किया जाता है:

- डेटा तालिका संरचना में समायोजन (जैसे फ़ील्ड जोड़ना, फ़ील्ड प्रकारों को संशोधित करना)
- डेटा माइग्रेशन (जैसे फ़ील्ड मानों का थोक अपडेट)
- प्लगइन कॉन्फ़िगरेशन या आंतरिक तर्क में अपडेट

Migration के निष्पादन का समय तीन प्रकारों में विभाजित है:

| प्रकार        | ट्रिगर होने का समय                                      | निष्पादन परिदृश्य |
| ----------- | --------------------------------------------------- | ------------------ |
| `beforeLoad` | सभी प्लगइन कॉन्फ़िगरेशन लोड होने से पहले         |                    |
| `afterSync`  | संग्रह कॉन्फ़िगरेशन डेटाबेस के साथ सिंक्रनाइज़ होने के बाद (संग्रह संरचना पहले ही बदल चुकी है) | |
| `afterLoad`  | सभी प्लगइन कॉन्फ़िगरेशन लोड होने के बाद          |                    |

## Migration फ़ाइलें बनाएँ

Migration फ़ाइलें प्लगइन डायरेक्टरी के अंतर्गत `src/server/migrations/*.ts` में रखी जानी चाहिए। NocoBase `create-migration` कमांड प्रदान करता है ताकि आप माइग्रेशन फ़ाइलों को तेज़ी से उत्पन्न कर सकें।

```bash
yarn nocobase create-migration [options] <name>
```

वैकल्पिक पैरामीटर

| पैरामीटर      | विवरण |
| -------------- | ----------- |
| `--pkg <pkg>`  | प्लगइन पैकेज का नाम निर्दिष्ट करें |
| `--on [on]`    | निष्पादन का समय निर्दिष्ट करें, विकल्प: `beforeLoad`, `afterSync`, `afterLoad` |

उदाहरण

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

उत्पन्न की गई माइग्रेशन फ़ाइल का पाथ इस प्रकार है:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

फ़ाइल की प्रारंभिक सामग्री:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // अपनी अपग्रेड लॉजिक यहाँ लिखें
  }
}
```

> ⚠️ `appVersion` का उपयोग अपग्रेड के लिए लक्षित संस्करण की पहचान करने के लिए किया जाता है। निर्दिष्ट संस्करण से कम वाले वातावरण इस माइग्रेशन को निष्पादित करेंगे।

## Migration लिखना

Migration फ़ाइलों में, आप डेटाबेस, प्लगइन और एप्लिकेशन इंस्टेंस को आसानी से संचालित करने के लिए `this` के माध्यम से निम्नलिखित सामान्य गुणों और API तक पहुँच सकते हैं:

सामान्य गुण

- **`this.app`**  
  वर्तमान NocoBase एप्लिकेशन इंस्टेंस। इसका उपयोग वैश्विक सेवाओं, प्लगइन या कॉन्फ़िगरेशन तक पहुँचने के लिए किया जा सकता है।  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  डेटाबेस सेवा इंस्टेंस, जो मॉडल (संग्रह) पर संचालन के लिए इंटरफेस प्रदान करता है।  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  वर्तमान प्लगइन इंस्टेंस, जिसका उपयोग प्लगइन के कस्टम तरीकों तक पहुँचने के लिए किया जा सकता है।  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Sequelize इंस्टेंस, जो सीधे मूल SQL या लेनदेन संचालन को निष्पादित कर सकता है।  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize का QueryInterface, जिसका उपयोग आमतौर पर तालिका संरचनाओं को संशोधित करने के लिए किया जाता है, जैसे कि फ़ील्ड जोड़ना, तालिकाएँ हटाना आदि।  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Migration लिखने का उदाहरण

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // फ़ील्ड जोड़ने के लिए queryInterface का उपयोग करें
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // डेटा मॉडल तक पहुँचने के लिए db का उपयोग करें
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // प्लगइन के कस्टम तरीके को निष्पादित करें
    await this.plugin.customMethod();
  }
}
```

ऊपर सूचीबद्ध सामान्य गुणों के अलावा, Migration समृद्ध API भी प्रदान करता है। विस्तृत दस्तावेज़ के लिए, कृपया [Migration API](/api/server/migration) देखें।

## Migration को ट्रिगर करना

Migration का निष्पादन `nocobase upgrade` कमांड द्वारा ट्रिगर किया जाता है:

```bash
$ yarn nocobase upgrade
```

अपग्रेड के दौरान, सिस्टम Migration के प्रकार और `appVersion` के आधार पर निष्पादन क्रम निर्धारित करेगा।

## Migration का परीक्षण करना

प्लगइन विकास में, यह सलाह दी जाती है कि आप **Mock Server** का उपयोग करके यह परीक्षण करें कि माइग्रेशन सही ढंग से निष्पादित होता है या नहीं, ताकि वास्तविक डेटा को नुकसान पहुँचाने से बचा जा सके।

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // प्लगइन का नाम
      version: '0.18.0-alpha.5', // अपग्रेड से पहले का संस्करण
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // सत्यापन लॉजिक लिखें, जैसे कि फ़ील्ड मौजूद है या नहीं, डेटा माइग्रेशन सफल रहा या नहीं, इसकी जाँच करें
  });
});
```

> टिप: Mock Server का उपयोग करके आप अपग्रेड परिदृश्यों का तेज़ी से अनुकरण कर सकते हैं और Migration के निष्पादन क्रम तथा डेटा में बदलावों को सत्यापित कर सकते हैं।

## विकास अभ्यास के लिए सुझाव

1.  **Migration को विभाजित करें**  
    प्रत्येक अपग्रेड के लिए एक माइग्रेशन फ़ाइल उत्पन्न करने का प्रयास करें, ताकि परमाणुता बनी रहे और समस्या निवारण सरल हो।
2.  **निष्पादन का समय निर्दिष्ट करें**  
    ऑपरेशन ऑब्जेक्ट के आधार पर `beforeLoad`, `afterSync` या `afterLoad` चुनें, ताकि अनलोड किए गए मॉड्यूल पर निर्भरता से बचा जा सके।
3.  **संस्करण नियंत्रण का ध्यान रखें**  
    `appVersion` का उपयोग करके माइग्रेशन के लिए लागू संस्करण को स्पष्ट रूप से निर्दिष्ट करें, ताकि बार-बार निष्पादन को रोका जा सके।
4.  **परीक्षण कवरेज**  
    Mock Server पर माइग्रेशन को सत्यापित करने के बाद ही वास्तविक वातावरण में अपग्रेड निष्पादित करें।