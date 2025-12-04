:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# EventDefinition

EventDefinition एक वर्कफ़्लो (flow) में इवेंट हैंडलिंग लॉजिक को परिभाषित करता है, जिसका उपयोग विशिष्ट इवेंट ट्रिगर्स का जवाब देने के लिए किया जाता है। इवेंट्स, वर्कफ़्लो (flow) के निष्पादन को ट्रिगर करने के लिए FlowEngine में एक महत्वपूर्ण तंत्र हैं।

## प्रकार की परिभाषा

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

EventDefinition वास्तव में ActionDefinition का एक उपनाम (alias) है, इसलिए इसमें वही गुण (properties) और विधियाँ (methods) होती हैं।

## पंजीकरण का तरीका

```ts
// वैश्विक पंजीकरण (FlowEngine के माध्यम से)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // इवेंट हैंडलिंग लॉजिक
  }
});

// मॉडल-स्तर पर पंजीकरण (FlowModel के माध्यम से)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // इवेंट हैंडलिंग लॉजिक
  }
});

// वर्कफ़्लो (flow) में उपयोग
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // एक पंजीकृत इवेंट को संदर्भित करता है
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## गुणों का विवरण

### name

**प्रकार**: `string`  
**आवश्यक**: हाँ  
**विवरण**: इवेंट का अद्वितीय पहचानकर्ता।

वर्कफ़्लो (flow) में `on` गुण (property) के माध्यम से इवेंट को संदर्भित करने के लिए उपयोग किया जाता है।

**उदाहरण**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**प्रकार**: `string`  
**आवश्यक**: नहीं  
**विवरण**: इवेंट के लिए प्रदर्शित होने वाला शीर्षक।

यूज़र इंटरफ़ेस (UI) में प्रदर्शित करने और डीबगिंग के लिए उपयोग किया जाता है।

**उदाहरण**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**प्रकार**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**आवश्यक**: हाँ  
**विवरण**: इवेंट का हैंडलर फ़ंक्शन।

यह इवेंट का मुख्य लॉजिक है, जो कॉन्टेक्स्ट और पैरामीटर्स को प्राप्त करता है, और प्रोसेसिंग का परिणाम देता है।

**उदाहरण**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // इवेंट हैंडलिंग लॉजिक निष्पादित करें
    const result = await handleEvent(params);
    
    // परिणाम वापस करें
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**विवरण**: इवेंट के लिए डिफ़ॉल्ट पैरामीटर्स।

इवेंट ट्रिगर होने पर पैरामीटर्स को डिफ़ॉल्ट मानों से भरता है।

**उदाहरण**:
```ts
// स्थिर डिफ़ॉल्ट पैरामीटर्स
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// गतिशील डिफ़ॉल्ट पैरामीटर्स
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// अतुल्यकालिक (Asynchronous) डिफ़ॉल्ट पैरामीटर्स
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**प्रकार**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**आवश्यक**: नहीं  
**विवरण**: इवेंट के लिए यूज़र इंटरफ़ेस (UI) कॉन्फ़िगरेशन स्कीमा।

यह यूज़र इंटरफ़ेस (UI) में इवेंट के प्रदर्शन के तरीके और फ़ॉर्म कॉन्फ़िगरेशन को परिभाषित करता है।

**उदाहरण**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**प्रकार**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**आवश्यक**: नहीं  
**विवरण**: पैरामीटर्स सहेजने से पहले निष्पादित होने वाला हुक फ़ंक्शन।

इवेंट पैरामीटर्स सहेजने से पहले निष्पादित होता है, जिसका उपयोग पैरामीटर सत्यापन (validation) या रूपांतरण (transformation) के लिए किया जा सकता है।

**उदाहरण**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // पैरामीटर सत्यापन
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // पैरामीटर रूपांतरण
  params.eventType = params.eventType.toLowerCase();
  
  // परिवर्तनों को लॉग करें
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**प्रकार**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**आवश्यक**: नहीं  
**विवरण**: पैरामीटर्स सहेजने के बाद निष्पादित होने वाला हुक फ़ंक्शन।

इवेंट पैरामीटर्स सहेजने के बाद निष्पादित होता है, जिसका उपयोग अन्य कार्रवाइयों (actions) को ट्रिगर करने के लिए किया जा सकता है।

**उदाहरण**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // लॉग करें
  console.log('Event params saved:', params);
  
  // इवेंट ट्रिगर करें
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // कैश अपडेट करें
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**प्रकार**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**आवश्यक**: नहीं  
**विवरण**: इवेंट के लिए यूज़र इंटरफ़ेस (UI) प्रदर्शन मोड।

यह नियंत्रित करता है कि इवेंट यूज़र इंटरफ़ेस (UI) में कैसे प्रदर्शित होता है।

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
    width: 600,
    title: 'Event Configuration'
  }
}

// गतिशील मोड
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## अंतर्निहित इवेंट प्रकार

FlowEngine में निम्नलिखित सामान्य इवेंट प्रकार (types) अंतर्निहित (built-in) हैं:

- `'click'` - क्लिक इवेंट
- `'submit'` - सबमिट इवेंट
- `'reset'` - रीसेट इवेंट
- `'remove'` - हटाएँ इवेंट
- `'openView'` - व्यू खोलें इवेंट
- `'dropdownOpen'` - ड्रॉपडाउन खोलें इवेंट
- `'popupScroll'` - पॉपअप स्क्रॉल इवेंट
- `'search'` - खोज इवेंट
- `'customRequest'` - कस्टम अनुरोध इवेंट
- `'collapseToggle'` - कोलैप्स टॉगल इवेंट

## पूरा उदाहरण

```ts
class FormModel extends FlowModel {}

// फ़ॉर्म सबमिट इवेंट पंजीकृत करें
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // फ़ॉर्म डेटा को मान्य करें
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // फ़ॉर्म सबमिशन को प्रोसेस करें
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// डेटा परिवर्तन इवेंट पंजीकृत करें
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // डेटा परिवर्तन को लॉग करें
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // संबंधित कार्रवाइयों (actions) को ट्रिगर करें
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// वर्कफ़्लो (flow) में इवेंट्स का उपयोग करना
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```