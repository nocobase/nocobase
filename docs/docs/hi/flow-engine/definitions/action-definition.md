:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# ActionDefinition

ActionDefinition उन पुन: प्रयोज्य क्रियाओं (reusable actions) को परिभाषित करता है जिन्हें कई वर्कफ़्लो और चरणों में संदर्भित किया जा सकता है। एक क्रिया (action) फ़्लो इंजन में एक मुख्य निष्पादन इकाई है, जो विशिष्ट व्यावसायिक तर्क को समाहित करती है।

## प्रकार की परिभाषा

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## पंजीकरण का तरीका

```ts
// वैश्विक पंजीकरण (FlowEngine के माध्यम से)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // प्रोसेसिंग लॉजिक
  }
});

// मॉडल-स्तर का पंजीकरण (FlowModel के माध्यम से)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // प्रोसेसिंग लॉजिक
  }
});

// एक वर्कफ़्लो में उपयोग करें
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // वैश्विक क्रिया को संदर्भित करें
    },
    step2: {
      use: 'processDataAction', // मॉडल-स्तर की क्रिया को संदर्भित करें
    }
  }
});
```

## प्रॉपर्टी का विवरण

### name

**प्रकार**: `string`  
**आवश्यक**: हाँ  
**विवरण**: क्रिया के लिए अद्वितीय पहचानकर्ता

इसका उपयोग किसी चरण में `use` प्रॉपर्टी के माध्यम से क्रिया को संदर्भित करने के लिए किया जाता है।

**उदाहरण**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**प्रकार**: `string`  
**आवश्यक**: नहीं  
**विवरण**: क्रिया के लिए प्रदर्शित होने वाला शीर्षक

इसका उपयोग UI (यूज़र इंटरफ़ेस) में दिखाने और डीबगिंग के लिए किया जाता है।

**उदाहरण**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**प्रकार**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**आवश्यक**: हाँ  
**विवरण**: क्रिया के लिए हैंडलर फ़ंक्शन

यह क्रिया का मुख्य तर्क है, जो संदर्भ (context) और पैरामीटर प्राप्त करता है, और प्रोसेसिंग का परिणाम देता है।

**उदाहरण**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // विशिष्ट तर्क निष्पादित करें
    const result = await performAction(params);
    
    // परिणाम लौटाएँ
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**प्रकार**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**आवश्यक**: नहीं  
**विवरण**: क्रिया के लिए डिफ़ॉल्ट पैरामीटर

क्रिया के निष्पादित होने से पहले, पैरामीटर को डिफ़ॉल्ट मानों से भरता है।

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
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// एसिंक्रोनस डिफ़ॉल्ट पैरामीटर
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**प्रकार**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**आवश्यक**: नहीं  
**विवरण**: क्रिया के लिए UI कॉन्फ़िगरेशन स्कीमा

यह परिभाषित करता है कि क्रिया UI में कैसे प्रदर्शित होती है और उसका फ़ॉर्म कॉन्फ़िगरेशन कैसा है।

**उदाहरण**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP Method',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: 'Timeout (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**प्रकार**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**आवश्यक**: नहीं  
**विवरण**: पैरामीटर सहेजने से पहले निष्पादित होने वाला हुक फ़ंक्शन

क्रिया के पैरामीटर सहेजने से पहले निष्पादित होता है, इसका उपयोग पैरामीटर सत्यापन या परिवर्तन के लिए किया जा सकता है।

**उदाहरण**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // पैरामीटर सत्यापन
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // पैरामीटर परिवर्तन
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // परिवर्तनों को लॉग करें
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**प्रकार**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**आवश्यक**: नहीं  
**विवरण**: पैरामीटर सहेजने के बाद निष्पादित होने वाला हुक फ़ंक्शन

क्रिया के पैरामीटर सहेजने के बाद निष्पादित होता है, इसका उपयोग अन्य ऑपरेशनों को ट्रिगर करने के लिए किया जा सकता है।

**उदाहरण**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // लॉग रिकॉर्ड करें
  console.log('Action params saved:', params);
  
  // इवेंट ट्रिगर करें
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // कैश अपडेट करें
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**प्रकार**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**आवश्यक**: नहीं  
**विवरण**: क्या मूल पैरामीटर का उपयोग करना है

यदि `true` है, तो मूल पैरामीटर बिना किसी प्रोसेसिंग के सीधे हैंडलर फ़ंक्शन को पास किए जाएंगे।

**उदाहरण**:
```ts
// स्टैटिक कॉन्फ़िगरेशन
useRawParams: true

// डायनामिक कॉन्फ़िगरेशन
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**प्रकार**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**आवश्यक**: नहीं  
**विवरण**: क्रिया के लिए UI डिस्प्ले मोड

यह नियंत्रित करता है कि क्रिया UI में कैसे प्रदर्शित होती है।

**समर्थित मोड**:
- `'dialog'` - डायलॉग मोड
- `'drawer'` - ड्रॉअर मोड
- `'embed'` - एम्बेड मोड
- या एक कस्टम कॉन्फ़िगरेशन ऑब्जेक्ट

**उदाहरण**:
```ts
// सरल मोड
uiMode: 'dialog'

// कस्टम कॉन्फ़िगरेशन
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Action Configuration',
    maskClosable: false
  }
}

// डायनामिक मोड
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**प्रकार**: `ActionScene | ActionScene[]`  
**आवश्यक**: नहीं  
**विवरण**: क्रिया के उपयोग के परिदृश्य

यह क्रिया को केवल विशिष्ट परिदृश्यों में उपयोग करने के लिए प्रतिबंधित करता है।

**समर्थित परिदृश्य**:
- `'settings'` - सेटिंग्स परिदृश्य
- `'runtime'` - रनटाइम परिदृश्य
- `'design'` - डिज़ाइन-टाइम परिदृश्य

**उदाहरण**:
```ts
scene: 'settings'  // केवल सेटिंग्स परिदृश्य में उपयोग करें
scene: ['settings', 'runtime']  // सेटिंग्स और रनटाइम परिदृश्यों में उपयोग करें
```

### sort

**प्रकार**: `number`  
**आवश्यक**: नहीं  
**विवरण**: क्रिया के लिए सॉर्टिंग वेट

यह सूची में क्रिया के प्रदर्शन क्रम को नियंत्रित करता है। एक छोटा मान उच्च स्थिति को दर्शाता है।

**उदाहरण**:
```ts
sort: 0  // सबसे ऊपर
sort: 10 // मध्य स्थिति
sort: 100 // निचली स्थिति
```

## पूरा उदाहरण

```ts
class DataProcessingModel extends FlowModel {}

// डेटा लोडिंग क्रिया को पंजीकृत करें
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP Method',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: 'Timeout (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// डेटा प्रोसेसिंग क्रिया को पंजीकृत करें
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: 'Processor',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: 'Options',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: 'Format',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: 'Encoding',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```