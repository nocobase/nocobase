:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# डिपेंडेंसी प्रबंधन

NocoBase प्लगइन डेवलपमेंट में, डिपेंडेंसी को दो श्रेणियों में बांटा गया है: **स्वयं की डिपेंडेंसी** और **ग्लोबल डिपेंडेंसी**।

- **ग्लोबल डिपेंडेंसी**: ये `@nocobase/server` और `@nocobase/client` द्वारा प्रदान की जाती हैं, और प्लगइन को इन्हें अलग से बंडल करने की आवश्यकता नहीं होती है।
- **स्वयं की डिपेंडेंसी**: ये प्लगइन की अपनी खास डिपेंडेंसी होती हैं (सर्वर-साइड डिपेंडेंसी सहित), और इन्हें प्लगइन के आर्टिफैक्ट्स में बंडल किया जाता है।

## डेवलपमेंट सिद्धांत

चूंकि स्वयं की डिपेंडेंसी को प्लगइन के आर्टिफैक्ट्स में बंडल किया जाएगा (जिसमें सर्वर डिपेंडेंसी का `dist/node_modules` में बंडल होना भी शामिल है), इसलिए प्लगइन डेवलपमेंट के दौरान, आप सभी डिपेंडेंसी को `dependencies` के बजाय `devDependencies` में घोषित कर सकते हैं। इससे डेवलपमेंट और प्रोडक्शन एनवायरनमेंट के बीच अंतर से बचा जा सकता है।

जब किसी प्लगइन को निम्नलिखित डिपेंडेंसी इंस्टॉल करने की आवश्यकता हो, तो कृपया सुनिश्चित करें कि **वर्जन नंबर** ग्लोबल डिपेंडेंसी में `@nocobase/server` और `@nocobase/client` के साथ मेल खाता हो, अन्यथा रनटाइम में टकराव हो सकता है।

## ग्लोबल डिपेंडेंसी

निम्नलिखित डिपेंडेंसी NocoBase द्वारा प्रदान की जाती हैं और इन्हें प्लगइन में बंडल करने की आवश्यकता नहीं होती है। यदि इनकी वास्तव में आवश्यकता हो, तो इन्हें फ्रेमवर्क वर्जन के साथ मेल खाना चाहिए।

``` js
// NocoBase कोर
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client',
'@nocobase/database',
'@nocobase/evaluators',
'@nocobase/logger',
'@nocobase/resourcer',
'@nocobase/sdk',
'@nocobase/server',
'@nocobase/test',
'@nocobase/utils',

// @nocobase/auth
'jsonwebtoken',

// @nocobase/cache
'cache-manager',
'cache-manager-fs-hash',

// @nocobase/database
'sequelize',
'umzug',
'async-mutex',

// @nocobase/evaluators
'@formulajs/formulajs',
'mathjs',

// @nocobase/logger
'winston',
'winston-daily-rotate-file',

// Koa इकोसिस्टम
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React इकोसिस्टम
'react',
'react-dom',
'react/jsx-runtime',

// React राउटर
'react-router',
'react-router-dom',

// Ant डिज़ाइन
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18n
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// सामान्य यूटिलिटीज़
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash',
```

## डेवलपमेंट सुझाव

1.  **डिपेंडेंसी में निरंतरता बनाए रखें**\
    यदि आपको उन पैकेजों का उपयोग करने की आवश्यकता है जो पहले से ही ग्लोबल डिपेंडेंसी में मौजूद हैं, तो अलग-अलग वर्जन इंस्टॉल करने से बचें और सीधे ग्लोबल डिपेंडेंसी का उपयोग करें।

2.  **बंडल का आकार कम करें**\
    सामान्य UI लाइब्रेरीज़ (जैसे `antd`), यूटिलिटी लाइब्रेरीज़ (जैसे `lodash`), डेटाबेस ड्राइवर (जैसे `pg`, `mysql2`) के लिए, आपको ग्लोबली प्रदान किए गए वर्जन पर निर्भर रहना चाहिए ताकि डुप्लिकेट बंडलिंग से बचा जा सके।

3.  **डीबग और प्रोडक्शन एनवायरनमेंट के बीच निरंतरता**\
    `devDependencies` का उपयोग करने से डेवलपमेंट और अंतिम आर्टिफैक्ट्स के बीच निरंतरता सुनिश्चित होती है, जिससे `dependencies` और `peerDependencies` के अनुचित कॉन्फ़िगरेशन के कारण होने वाले एनवायरनमेंट संबंधी अंतरों से बचा जा सकता है।