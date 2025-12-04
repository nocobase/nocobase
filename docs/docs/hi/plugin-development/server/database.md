:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# डेटाबेस

`Database` डेटाबेस-प्रकार के डेटा स्रोत (`DataSource`) का एक महत्वपूर्ण हिस्सा है। हर डेटाबेस-प्रकार के डेटा स्रोत का एक संबंधित `Database` इंस्टेंस होता है, जिसे `dataSource.db` के ज़रिए एक्सेस किया जा सकता है। मुख्य डेटा स्रोत का डेटाबेस इंस्टेंस एक सुविधाजनक `app.db` उपनाम (alias) भी प्रदान करता है। `db` के सामान्य तरीकों से परिचित होना सर्वर-साइड प्लगइन लिखने का आधार है।

## डेटाबेस के घटक

एक सामान्य `Database` में निम्नलिखित भाग होते हैं:

-   **संग्रह (Collection)**: डेटा तालिका (table) की संरचना को परिभाषित करता है।
-   **मॉडल (Model)**: ORM मॉडल से मेल खाता है (जो आमतौर पर Sequelize द्वारा प्रबंधित होता है)।
-   **रिपॉज़िटरी (Repository)**: डेटा एक्सेस लॉजिक को समाहित करने वाली रिपॉज़िटरी परत, जो उच्च-स्तरीय ऑपरेशन के तरीके प्रदान करती है।
-   **फ़ील्ड प्रकार (FieldType)**: फ़ील्ड के प्रकार।
-   **फ़िल्टर ऑपरेटर (FilterOperator)**: फ़िल्टरिंग के लिए उपयोग किए जाने वाले ऑपरेटर।
-   **इवेंट (Event)**: जीवनचक्र इवेंट और डेटाबेस इवेंट।

## प्लगइन में उपयोग का समय

### `beforeLoad` चरण के लिए उपयुक्त कार्य

इस चरण में डेटाबेस ऑपरेशन की अनुमति नहीं है। यह स्टैटिक क्लास के पंजीकरण या इवेंट सुनने के लिए उपयुक्त है।

-   `db.registerFieldTypes()` — कस्टम फ़ील्ड प्रकार
-   `db.registerModels()` — कस्टम मॉडल क्लास पंजीकृत करें
-   `db.registerRepositories()` — कस्टम रिपॉज़िटरी क्लास पंजीकृत करें
-   `db.registerOperators()` — कस्टम फ़िल्टर ऑपरेटर पंजीकृत करें
-   `db.on()` — डेटाबेस से संबंधित इवेंट सुनें

### `load` चरण के लिए उपयुक्त कार्य

इस चरण में, सभी पिछली क्लास परिभाषाएँ और इवेंट लोड हो चुके होते हैं, इसलिए डेटा तालिकाओं को लोड करने पर कोई कमी या छूट नहीं होगी।

-   `db.defineCollection()` — नई डेटा तालिकाएँ परिभाषित करें
-   `db.extendCollection()` — मौजूदा डेटा तालिका कॉन्फ़िगरेशन का विस्तार करें

यदि प्लगइन की अंतर्निहित तालिकाओं को परिभाषित करने के लिए है, तो उन्हें `./src/server/collections` डायरेक्टरी में रखना अधिक अनुशंसित है। विवरण के लिए, [संग्रह (Collections)](./collections.md) देखें।

## डेटा ऑपरेशन

`Database` डेटा को एक्सेस और ऑपरेट करने के दो मुख्य तरीके प्रदान करता है:

### रिपॉज़िटरी के माध्यम से ऑपरेशन

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

रिपॉज़िटरी परत का उपयोग आमतौर पर व्यावसायिक लॉजिक को समाहित करने के लिए किया जाता है, जैसे पेजिंग, फ़िल्टरिंग, अनुमति जाँच आदि।

### मॉडल के माध्यम से ऑपरेशन

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

मॉडल परत सीधे ORM एंटिटी से मेल खाती है, जो निचले-स्तर के डेटाबेस ऑपरेशन करने के लिए उपयुक्त है।

## किन चरणों में डेटाबेस ऑपरेशन की अनुमति है?

### प्लगइन जीवनचक्र

| चरण                | डेटाबेस ऑपरेशन की अनुमति है |
| -------------------- | --------------------------- |
| `staticImport`       | नहीं                         |
| `afterAdd`           | नहीं                         |
| `beforeLoad`         | नहीं                         |
| `load`                | नहीं                         |
| `install`             | हाँ                         |
| `beforeEnable`        | हाँ                         |
| `afterEnable`         | हाँ                         |
| `beforeDisable`       | हाँ                         |
| `afterDisable`        | हाँ                         |
| `remove`              | हाँ                         |
| `handleSyncMessage`   | हाँ                         |

### ऐप इवेंट

| चरण                | डेटाबेस ऑपरेशन की अनुमति है |
| -------------------- | --------------------------- |
| `beforeLoad`         | नहीं                         |
| `afterLoad`           | नहीं                         |
| `beforeStart`         | हाँ                         |
| `afterStart`          | हाँ                         |
| `beforeInstall`       | नहीं                         |
| `afterInstall`        | हाँ                         |
| `beforeStop`          | हाँ                         |
| `afterStop`           | नहीं                         |
| `beforeDestroy`       | हाँ                         |
| `afterDestroy`        | नहीं                         |
| `beforeLoadPlugin`    | नहीं                         |
| `afterLoadPlugin`     | नहीं                         |
| `beforeEnablePlugin`  | हाँ                         |
| `afterEnablePlugin`   | हाँ                         |
| `beforeDisablePlugin` | हाँ                         |
| `afterDisablePlugin`  | हाँ                         |
| `afterUpgrade`        | हाँ                         |

### डेटाबेस इवेंट/हुक

| चरण                         | डेटाबेस ऑपरेशन की अनुमति है |
| ------------------------------ | --------------------------- |
| `beforeSync`                   | नहीं                         |
| `afterSync`                    | हाँ                         |
| `beforeValidate`               | हाँ                         |
| `afterValidate`                | हाँ                         |
| `beforeCreate`                 | हाँ                         |
| `afterCreate`                  | हाँ                         |
| `beforeUpdate`                 | हाँ                         |
| `afterUpdate`                  | हाँ                         |
| `beforeSave`                   | हाँ                         |
| `afterSave`                    | हाँ                         |
| `beforeDestroy`               | हाँ                         |
| `afterDestroy`                 | हाँ                         |
| `afterCreateWithAssociations`  | हाँ                         |
| `afterUpdateWithAssociations` | हाँ                         |
| `afterSaveWithAssociations`    | हाँ                         |
| `beforeDefineCollection`      | नहीं                         |
| `afterDefineCollection`        | नहीं                         |
| `beforeRemoveCollection`       | नहीं                         |
| `afterRemoveCollection`        | नहीं                         |