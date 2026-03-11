:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/flow-engine/runjs-extension-points) देखें।
:::

# RunJS प्लगइन एक्सटेंशन पॉइंट्स (ctx दस्तावेज़ / स्निपेट्स / सीन मैपिंग)

जब कोई प्लगइन RunJS क्षमताओं को जोड़ता या विस्तारित करता है, तो यह अनुशंसा की जाती है कि "संदर्भ मैपिंग (context mapping) / `ctx` दस्तावेज़ / उदाहरण कोड" को **आधिकारिक एक्सटेंशन पॉइंट्स** के माध्यम से पंजीकृत किया जाए, ताकि:

- CodeEditor `ctx.xxx.yyy` के लिए ऑटो-कम्प्लीशन प्रदान कर सके।
- AI कोडिंग को संरचित `ctx` API संदर्भ + उदाहरण मिल सकें।

यह अध्याय दो एक्सटेंशन पॉइंट्स का परिचय देता है:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

इसका उपयोग RunJS के "योगदान" (contributions) को पंजीकृत करने के लिए किया जाता है। विशिष्ट उपयोग के मामलों में शामिल हैं:

- `RunJSContextRegistry` मैपिंग को जोड़ना/ओवरराइड करना (`modelClass` -> `RunJSContext`, जिसमें `scenes` शामिल हैं)।
- `FlowRunJSContext` या कस्टम RunJSContext के लिए `RunJSDocMeta` (`ctx` API के विवरण/उदाहरण/कम्प्लीशन टेम्पलेट) का विस्तार करना।

### व्यवहार का विवरण

- योगदान `setupRunJSContexts()` चरण के दौरान सामूहिक रूप से निष्पादित किए जाएंगे;
- यदि `setupRunJSContexts()` पहले ही पूरा हो चुका है, तो **देर से किए गए पंजीकरण तुरंत निष्पादित होंगे** (सेटअप को फिर से चलाने की आवश्यकता नहीं है);
- प्रत्येक योगदान प्रत्येक `RunJSVersion` के लिए **अधिकतम एक बार** निष्पादित किया जाएगा।

### उदाहरण: एक JS-लेखन योग्य मॉडल संदर्भ जोड़ना

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx दस्तावेज़/कम्प्लीशन (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) मॉडल -> संदर्भ मैपिंग (सीन एडिटर कम्प्लीशन/स्निपेट्स फ़िल्टरिंग को प्रभावित करता है)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

इसका उपयोग RunJS के लिए उदाहरण कोड स्निपेट्स (snippets) को पंजीकृत करने के लिए किया जाता है, जिनका उपयोग निम्न के लिए किया जाता है:

- CodeEditor स्निपेट कम्प्लीशन।
- AI कोडिंग के लिए उदाहरण/संदर्भ सामग्री के रूप में (सीन/वर्जन/लोकेल के आधार पर फ़िल्टर किया जा सकता है)।

### अनुशंसित ref नामकरण

यह सुझाव दिया जाता है कि आप `plugin/<pluginName>/<topic>` का उपयोग करें, उदाहरण के लिए:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

कोर के `global/*` या `scene/*` नेमस्पेस के साथ टकराव से बचें।

### टकराव की रणनीति (Conflict Strategy)

- डिफ़ॉल्ट रूप से, मौजूदा `ref` प्रविष्टियों को ओवरराइड नहीं किया जाता है (बिना किसी त्रुटि के `false` लौटाता है)।
- स्पष्ट रूप से ओवरराइड करने के लिए, `{ override: true }` पास करें।

### उदाहरण: एक स्निपेट पंजीकृत करना

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. सर्वोत्तम अभ्यास

- **दस्तावेज़ + स्निपेट्स का स्तरित रखरखाव**:
  - `RunJSDocMeta`: विवरण/कम्प्लीशन टेम्पलेट (छोटे, संरचित)।
  - स्निपेट्स: लंबे उदाहरण (पुन: प्रयोज्य, सीन/वर्जन द्वारा फ़िल्टर करने योग्य)।
- **अत्यधिक प्रॉम्प्ट लंबाई से बचें**: उदाहरण संक्षिप्त होने चाहिए; "न्यूनतम चलने योग्य टेम्पलेट्स" को प्राथमिकता दें।
- **सीन प्राथमिकता**: यदि आपका JS कोड मुख्य रूप से फ़ॉर्म या टेबल जैसे दृश्यों में चलता है, तो कम्प्लीशन और उदाहरणों की प्रासंगिकता बढ़ाने के लिए `scenes` फ़ील्ड को सही ढंग से भरें।

## 4. वास्तविक ctx के आधार पर कम्प्लीशन छिपाना: `hidden(ctx)`

कुछ `ctx` API अत्यधिक संदर्भ-विशिष्ट होते हैं (उदाहरण के लिए, `ctx.popup` केवल तभी उपलब्ध होता है जब कोई पॉपअप या ड्रावर खुला हो)। जब आप कम्प्लीशन के दौरान इन अनुपलब्ध API को छिपाना चाहते हैं, तो आप `RunJSDocMeta` में संबंधित प्रविष्टि के लिए `hidden(ctx)` परिभाषित कर सकते हैं:

- `true` लौटाता है: वर्तमान नोड और उसके सब-ट्री को छिपाता है।
- `string[]` लौटाता है: वर्तमान नोड के तहत विशिष्ट सब-पाथ को छिपाता है (एक साथ कई पाथ लौटाने का समर्थन करता है; पाथ सापेक्ष होते हैं; प्रीफ़िक्स मिलान के आधार पर सब-ट्री छिपाए जाते हैं)।

`hidden(ctx)` `async` का समर्थन करता है: आप दृश्यता निर्धारित करने के लिए `await ctx.getVar('ctx.xxx')` का उपयोग कर सकते हैं (यह उपयोगकर्ता के विवेक पर निर्भर है)। यह अनुशंसा की जाती है कि इस लॉजिक को तेज़ रखें और साइड-इफेक्ट्स से मुक्त रखें (जैसे कि नेटवर्क अनुरोधों से बचें)।

उदाहरण: `ctx.popup.*` कम्प्लीशन केवल तभी दिखाएं जब `popup.uid` मौजूद हो।

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

उदाहरण: पॉपअप उपलब्ध है लेकिन कुछ सब-पाथ छिपे हुए हैं (केवल सापेक्ष पाथ; उदाहरण के लिए, `record` और `parent.record` को छिपाना)।

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

नोट: CodeEditor हमेशा वास्तविक `ctx` के आधार पर कम्प्लीशन फ़िल्टरिंग सक्षम रखता है (fail-open, त्रुटियां नहीं फेंकता)।

## 5. रनटाइम `info/meta` और संदर्भ सूचना API (कम्प्लीशन और बड़े मॉडल के लिए)

`FlowRunJSContext.define()` (स्थिर) के माध्यम से `ctx` दस्तावेज़ बनाए रखने के अलावा, आप रनटाइम पर `FlowContext.defineProperty/defineMethod` के माध्यम से **info/meta** भी इंजेक्ट कर सकते हैं। फिर आप CodeEditor या बड़े मॉडल (LLMs) के लिए निम्नलिखित API का उपयोग करके **क्रमबद्ध (serializable)** संदर्भ जानकारी आउटपुट कर सकते हैं:

- `await ctx.getApiInfos(options?)`: स्थिर API जानकारी।
- `await ctx.getVarInfos(options?)`: वेरिएबल संरचना जानकारी (`meta` से प्राप्त, path/maxDepth विस्तार का समर्थन करती है)।
- `await ctx.getEnvInfos()`: रनटाइम वातावरण स्नैपशॉट।

### 5.1 `defineMethod(name, fn, info?)`

`info` निम्नलिखित का समर्थन करता है (सभी वैकल्पिक हैं):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc जैसा)

> नोट: `getApiInfos()` स्थिर API दस्तावेज़ आउटपुट करता है और इसमें `deprecated`, `disabled`, या `disabledReason` जैसे फ़ील्ड शामिल नहीं होंगे।

उदाहरण: `ctx.refreshTargets()` के लिए दस्तावेज़ लिंक प्रदान करना।

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'लक्ष्य ब्लॉक के डेटा को रिफ्रेश करें',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: वेरिएबल चयनकर्ता UI (`getPropertyMetaTree` / `FlowContextSelector`) के लिए उपयोग किया जाता है। यह दृश्यता, ट्री संरचना, अक्षम करने आदि को निर्धारित करता है (फ़ंक्शन/async का समर्थन करता है)।
  - सामान्य फ़ील्ड: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: स्थिर API दस्तावेज़ों (`getApiInfos`) और बड़े मॉडल के विवरण के लिए उपयोग किया जाता है। यह वेरिएबल चयनकर्ता UI को प्रभावित नहीं करता है (फ़ंक्शन/async का समर्थन करता है)।
  - सामान्य फ़ील्ड: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

जब केवल `meta` प्रदान किया जाता है (`info` के बिना):

- `getApiInfos()` इस कुंजी को नहीं लौटाएगा (क्योंकि स्थिर API दस्तावेज़ `meta` से अनुमानित नहीं किए जाते हैं)।
- `getVarInfos()` `meta` के आधार पर वेरिएबल संरचना का निर्माण करेगा (वेरिएबल चयनकर्ताओं/डायनेमिक वेरिएबल ट्री के लिए उपयोग किया जाता है)।

### 5.3 संदर्भ सूचना API

"उपलब्ध संदर्भ क्षमता जानकारी" को आउटपुट करने के लिए उपयोग किया जाता है।

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // सीधे await ctx.getVar(getVar) में उपयोग किया जा सकता है, "ctx." से शुरू करने की अनुशंसा की जाती है
  value?: any; // हल किया गया स्थिर मान (क्रमबद्ध, केवल तभी लौटाया जाता है जब अनुमान लगाया जा सके)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // स्थिर दस्तावेज़ (शीर्ष स्तर)
type FlowContextVarInfos = Record<string, any>; // वेरिएबल संरचना (path/maxDepth द्वारा विस्तार योग्य)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

सामान्य पैरामीटर:

- `getApiInfos({ version })`: RunJS दस्तावेज़ संस्करण (डिफ़ॉल्ट `v1`)।
- `getVarInfos({ path, maxDepth })`: ट्रिमिंग और अधिकतम विस्तार गहराई (डिफ़ॉल्ट 3)।

नोट: उपरोक्त API द्वारा लौटाए गए परिणामों में फ़ंक्शन शामिल नहीं होते हैं और वे बड़े मॉडल को सीधे क्रमबद्ध करके भेजने के लिए उपयुक्त हैं।

### 5.4 `await ctx.getVar(path)`

जब आपके पास "वेरिएबल पाथ स्ट्रिंग" हो (उदाहरण के लिए कॉन्फ़िगरेशन या उपयोगकर्ता इनपुट से) और आप सीधे उस वेरिएबल का रनटाइम मान प्राप्त करना चाहते हों, तो `getVar` का उपयोग करें:

- उदाहरण: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` एक एक्सप्रेशन पाथ है जो `ctx.` से शुरू होता है (जैसे `ctx.record.id` / `ctx.record.roles[0].id`)।

इसके अतिरिक्त: अंडरस्कोर `_` से शुरू होने वाले मेथड या प्रॉपर्टी को निजी सदस्य माना जाएगा और वे `getApiInfos()` या `getVarInfos()` के आउटपुट में दिखाई नहीं देंगे।