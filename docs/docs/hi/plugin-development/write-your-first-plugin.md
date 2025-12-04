:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# अपना पहला प्लगइन लिखें

यह गाइड आपको एक ब्लॉक प्लगइन बनाने में मदद करेगी जिसे पेजों में इस्तेमाल किया जा सकता है। इसमें आपको NocoBase प्लगइन की मूल संरचना और डेवलपमेंट वर्कफ़्लो को समझने में सहायता मिलेगी।

## पूर्वापेक्षाएँ

शुरू करने से पहले, कृपया सुनिश्चित करें कि आपने NocoBase को सफलतापूर्वक इंस्टॉल कर लिया है। यदि आपने अभी तक इंस्टॉल नहीं किया है, तो आप इन इंस्टॉलेशन गाइड को देख सकते हैं:

- [create-nocobase-app का उपयोग करके इंस्टॉल करें](/get-started/installation/create-nocobase-app)
- [Git सोर्स से इंस्टॉल करें](/get-started/installation/git)

इंस्टॉलेशन पूरा होने के बाद, आप आधिकारिक तौर पर अपनी प्लगइन डेवलपमेंट यात्रा शुरू कर सकते हैं।

## चरण 1: CLI के माध्यम से प्लगइन स्केलेटन बनाएँ

रिपॉजिटरी के रूट डायरेक्टरी में एक खाली प्लगइन को तेज़ी से बनाने के लिए नीचे दिए गए कमांड को चलाएँ:

```bash
yarn pm create @my-project/plugin-hello
```

कमांड सफलतापूर्वक चलने के बाद, `packages/plugins/@my-project/plugin-hello` डायरेक्टरी में बुनियादी फ़ाइलें बन जाएँगी। डिफ़ॉल्ट संरचना इस प्रकार है:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # 默认导出服务端插件
     ├─ client                   # 客户端代码存放位置
     │  ├─ index.tsx             # 默认导出的客户端插件类
     │  ├─ plugin.tsx            # 插件入口（继承 @nocobase/client Plugin）
     │  ├─ models                # 可选：前端模型（如流程节点）
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # 服务端代码存放位置
     │  ├─ index.ts              # 默认导出的服务端插件类
     │  ├─ plugin.ts             # 插件入口（继承 @nocobase/server Plugin）
     │  ├─ collections           # 可选：服务端 collections
     │  ├─ migrations            # 可选：数据迁移
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # 可选：多语言
        ├─ en-US.json
        └─ zh-CN.json
```

बनाने के बाद, आप अपने ब्राउज़र में प्लगइन मैनेजर पेज (डिफ़ॉल्ट URL: http://localhost:13000/admin/settings/plugin-manager) पर जाकर यह पुष्टि कर सकते हैं कि प्लगइन सूची में दिखाई दे रहा है या नहीं।

## चरण 2: एक साधारण क्लाइंट ब्लॉक लागू करें

अब हम प्लगइन में एक कस्टम ब्लॉक मॉडल जोड़ेंगे, जो एक स्वागत संदेश प्रदर्शित करेगा।

1.  **एक नई ब्लॉक मॉडल फ़ाइल बनाएँ** `client/models/HelloBlockModel.tsx`:

    ```tsx pure
    import { BlockModel } from '@nocobase/client';
    import React from 'react';
    import { tExpr } from '../utils';

    export class HelloBlockModel extends BlockModel {
      renderComponent() {
        return (
          <div>
            <h1>Hello, NocoBase!</h1>
            <p>This is a simple block rendered by HelloBlockModel.</p>
          </div>
        );
      }
    }

    HelloBlockModel.define({
      label: tExpr('Hello block'),
    });
    ```

2.  **ब्लॉक मॉडल को रजिस्टर करें**। `client/models/index.ts` को एडिट करें और नए मॉडल को एक्सपोर्ट करें ताकि इसे फ्रंटएंड रनटाइम द्वारा लोड किया जा सके:

    ```ts
    import { ModelConstructor } from '@nocobase/flow-engine';
    import { HelloBlockModel } from './HelloBlockModel';

    export default {
      HelloBlockModel,
    } as Record<string, ModelConstructor>;
    ```

कोड सेव करने के बाद, यदि आप डेवलपमेंट स्क्रिप्ट चला रहे हैं, तो आपको टर्मिनल आउटपुट में हॉट-रीलोड लॉग दिखाई देने चाहिए।

## चरण 3: प्लगइन को सक्रिय करें और उसका अनुभव करें

आप कमांड लाइन या इंटरफ़ेस के माध्यम से प्लगइन को सक्षम कर सकते हैं:

-   **कमांड लाइन**

    ```bash
    yarn pm enable @my-project/plugin-hello
    ```

-   **प्रबंधन इंटरफ़ेस**: प्लगइन मैनेजर पर जाएँ, `@my-project/plugin-hello` को ढूँढें, और "सक्रिय करें" पर क्लिक करें।

सक्रिय करने के बाद, एक नया "Modern page (v2)" पेज बनाएँ। ब्लॉक जोड़ते समय, आपको "Hello block" दिखाई देगा। इसे पेज में डालें और आपको वह स्वागत सामग्री दिखाई देगी जो आपने अभी लिखी थी।

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## चरण 4: बिल्ड और पैकेज करें

जब आप प्लगइन को अन्य वातावरणों में वितरित करने के लिए तैयार हों, तो आपको पहले उसे बिल्ड और फिर पैकेज करना होगा:

```bash
yarn build @my-project/plugin-hello --tar
# या दो चरणों में चलाएँ
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> **टिप:** यदि प्लगइन को सोर्स रिपॉजिटरी में बनाया गया है, तो पहली बार बिल्ड करने पर पूरे रिपॉजिटरी का टाइप चेक ट्रिगर होगा, जिसमें कुछ समय लग सकता है। यह सलाह दी जाती है कि आप सुनिश्चित करें कि डिपेंडेंसी इंस्टॉल हो चुकी हैं और रिपॉजिटरी बिल्ड करने योग्य स्थिति में है।

बिल्ड पूरा होने के बाद, पैकेज फ़ाइल डिफ़ॉल्ट रूप से `storage/tar/@my-project/plugin-hello.tar.gz` पर स्थित होती है।

## चरण 5: दूसरे NocoBase एप्लीकेशन पर अपलोड करें

लक्ष्य एप्लीकेशन की `./storage/plugins` डायरेक्टरी में अपलोड और एक्सट्रैक्ट करें। विवरण के लिए, [प्लगइन इंस्टॉल और अपग्रेड करें](../get-started/install-upgrade-plugins.mdx) देखें।