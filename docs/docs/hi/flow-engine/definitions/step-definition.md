:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# स्टेपडेफ़िनिशन

स्टेपडेफ़िनिशन किसी वर्कफ़्लो में एक सिंगल स्टेप को परिभाषित करता है। हर स्टेप एक एक्शन, इवेंट हैंडलिंग या कोई और ऑपरेशन हो सकता है। एक स्टेप किसी वर्कफ़्लो की बुनियादी एग्जीक्यूशन यूनिट है।

## टाइप डेफ़िनिशन

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## इस्तेमाल का तरीका

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // कस्टम प्रोसेसिंग लॉजिक
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## प्रॉपर्टी विवरण

### key

**टाइप**: `string`  
**ज़रूरी**: नहीं  
**विवरण**: वर्कफ़्लो में स्टेप का यूनीक आइडेंटिफ़ायर।

अगर इसे नहीं दिया जाता है, तो `steps` ऑब्जेक्ट में स्टेप के की-नेम का इस्तेमाल किया जाएगा।

**उदाहरण**:
```ts
steps: {
  loadData: {  // key 'loadData' है
    use: 'loadDataAction'
  }
}
```

### use

**टाइप**: `string`  
**ज़रूरी**: नहीं  
**विवरण**: इस्तेमाल किए जाने वाले रजिस्टर्ड ActionDefinition का नाम।

आप `use` प्रॉपर्टी का इस्तेमाल करके किसी रजिस्टर्ड एक्शन को रेफर कर सकते हैं, जिससे बार-बार परिभाषा देने से बचा जा सके।

**उदाहरण**:
```ts
// पहले एक्शन रजिस्टर करें
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // डेटा लोड करने का लॉजिक
  }
});

// स्टेप में इस्तेमाल करें
steps: {
  step1: {
    use: 'loadDataAction',  // रजिस्टर्ड एक्शन को रेफर करें
    title: 'Load Data'
  }
}
```

### title

**टाइप**: `string`  
**ज़रूरी**: नहीं  
**विवरण**: स्टेप का डिस्प्ले टाइटल।

इसका इस्तेमाल UI में दिखाने और डीबगिंग के लिए किया जाता है।

**उदाहरण**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**टाइप**: `number`  
**ज़रूरी**: नहीं  
**विवरण**: स्टेप के एग्जीक्यूशन का क्रम। वैल्यू जितनी कम होगी, वह उतनी ही पहले एग्जीक्यूट होगा।

इसका इस्तेमाल एक ही वर्कफ़्लो में कई स्टेप्स के एग्जीक्यूशन के क्रम को कंट्रोल करने के लिए किया जाता है।

**उदाहरण**:
```ts
steps: {
  step1: { sort: 0 },  // सबसे पहले एग्जीक्यूट होगा
  step2: { sort: 1 },  // इसके बाद एग्जीक्यूट होगा
  step3: { sort: 2 }   // सबसे आखिर में एग्जीक्यूट होगा
}
```

### handler

**टाइप**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**ज़रूरी**: नहीं  
**विवरण**: स्टेप का हैंडलर फ़ंक्शन।

जब `use` प्रॉपर्टी का इस्तेमाल नहीं किया जाता है, तो आप सीधे हैंडलर फ़ंक्शन को परिभाषित कर सकते हैं।

**उदाहरण**:
```ts
handler: async (ctx, params) => {
  // कॉन्टेक्स्ट की जानकारी प्राप्त करें
  const { model, flowEngine } = ctx;
  
  // प्रोसेसिंग लॉजिक
  const result = await processData(params);
  
  // परिणाम वापस करें
  return { success: true, data: result };
}
```

### defaultParams

**टाइप**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**ज़रूरी**: नहीं  
**विवरण**: स्टेप के डिफ़ॉल्ट पैरामीटर।

स्टेप के एग्जीक्यूट होने से पहले, पैरामीटर में डिफ़ॉल्ट वैल्यू भरता है।

**उदाहरण**:
```ts
// स्टैटिक डिफ़ॉल्ट पैरामीटर
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// डायनामिक डिफ़ॉल्ट पैरामीटर
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// एसिंक्रोनस डिफ़ॉल्ट पैरामीटर
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**टाइप**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**ज़रूरी**: नहीं  
**विवरण**: स्टेप का UI कॉन्फ़िगरेशन स्कीमा।

यह परिभाषित करता है कि स्टेप इंटरफ़ेस में कैसे प्रदर्शित होता है और उसका फ़ॉर्म कॉन्फ़िगरेशन क्या है।

**उदाहरण**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**टाइप**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**ज़रूरी**: नहीं  
**विवरण**: पैरामीटर सेव होने से पहले चलने वाला हुक फ़ंक्शन।

यह स्टेप पैरामीटर सेव होने से पहले एग्जीक्यूट होता है, और इसका इस्तेमाल पैरामीटर वैलिडेशन या ट्रांसफ़ॉर्मेशन के लिए किया जा सकता है।

**उदाहरण**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // पैरामीटर वैलिडेशन
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // पैरामीटर ट्रांसफ़ॉर्मेशन
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**टाइप**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**ज़रूरी**: नहीं  
**विवरण**: पैरामीटर सेव होने के बाद चलने वाला हुक फ़ंक्शन।

यह स्टेप पैरामीटर सेव होने के बाद एग्जीक्यूट होता है, और इसका इस्तेमाल दूसरे ऑपरेशन को ट्रिगर करने के लिए किया जा सकता है।

**उदाहरण**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // लॉग रिकॉर्ड करें
  console.log('Step params saved:', params);
  
  // दूसरे ऑपरेशन ट्रिगर करें
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**टाइप**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**ज़रूरी**: नहीं  
**विवरण**: स्टेप का UI डिस्प्ले मोड।

यह कंट्रोल करता है कि स्टेप इंटरफ़ेस में कैसे प्रदर्शित होता है।

**सपोर्टेड मोड**:
- `'dialog'` - डायलॉग मोड
- `'drawer'` - ड्रॉअर मोड
- `'embed'` - एम्बेड मोड
- या एक कस्टम कॉन्फ़िगरेशन ऑब्जेक्ट

**उदाहरण**:
```ts
// सिंपल मोड
uiMode: 'dialog'

// कस्टम कॉन्फ़िगरेशन
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// डायनामिक मोड
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**टाइप**: `boolean`  
**ज़रूरी**: नहीं  
**विवरण**: क्या यह एक प्रीसेट स्टेप है।

`preset: true` वाले स्टेप्स के पैरामीटर क्रिएशन के समय भरने होंगे। जिन स्टेप्स पर यह फ़्लैग नहीं है, उनके पैरामीटर मॉडल बनने के बाद भरे जा सकते हैं।

**उदाहरण**:
```ts
steps: {
  step1: {
    preset: true,  // क्रिएशन के समय पैरामीटर भरने होंगे
    use: 'requiredAction'
  },
  step2: {
    preset: false, // पैरामीटर बाद में भरे जा सकते हैं
    use: 'optionalAction'
  }
}
```

### paramsRequired

**टाइप**: `boolean`  
**ज़रूरी**: नहीं  
**विवरण**: क्या स्टेप पैरामीटर ज़रूरी हैं।

अगर `true` है, तो मॉडल जोड़ने से पहले एक कॉन्फ़िगरेशन डायलॉग खुलेगा।

**उदाहरण**:
```ts
paramsRequired: true  // मॉडल जोड़ने से पहले पैरामीटर कॉन्फ़िगर करने होंगे
paramsRequired: false // पैरामीटर बाद में कॉन्फ़िगर किए जा सकते हैं
```

### hideInSettings

**टाइप**: `boolean`  
**ज़रूरी**: नहीं  
**विवरण**: क्या स्टेप को सेटिंग्स मेनू में छिपाना है।

**उदाहरण**:
```ts
hideInSettings: true  // सेटिंग्स में छिपाएँ
hideInSettings: false // सेटिंग्स में दिखाएँ (डिफ़ॉल्ट)
```

### isAwait

**टाइप**: `boolean`  
**ज़रूरी**: नहीं  
**डिफ़ॉल्ट वैल्यू**: `true`  
**विवरण**: क्या हैंडलर फ़ंक्शन के पूरा होने का इंतज़ार करना है।

**उदाहरण**:
```ts
isAwait: true  // हैंडलर फ़ंक्शन के पूरा होने का इंतज़ार करें (डिफ़ॉल्ट)
isAwait: false // इंतज़ार न करें, एसिंक्रोनस रूप से एग्जीक्यूट करें
```

## पूरा उदाहरण

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```