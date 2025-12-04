:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowDefinition

FlowDefinition फ़्लो की मूल संरचना और कॉन्फ़िगरेशन को परिभाषित करता है और फ़्लो इंजन की मुख्य अवधारणाओं में से एक है। यह फ़्लो के मेटाडेटा, ट्रिगर शर्तों और निष्पादन चरणों का वर्णन करता है।

## प्रकार परिभाषा

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## पंजीकरण विधि

```ts
class MyModel extends FlowModel {}

// मॉडल क्लास के माध्यम से एक फ़्लो पंजीकृत करें
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## प्रॉपर्टी विवरण

### key

**प्रकार**: `string`  
**आवश्यक**: हाँ  
**विवरण**: फ़्लो का अद्वितीय पहचानकर्ता।

एक सुसंगत `xxxSettings` नामकरण शैली का उपयोग करने की सलाह दी जाती है, उदाहरण के लिए:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

यह नामकरण पहचान और रखरखाव को आसान बनाता है, और इसे पूरे प्रोजेक्ट में लगातार उपयोग करने की सलाह दी जाती है।

**उदाहरण**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**प्रकार**: `string`  
**आवश्यक**: नहीं  
**विवरण**: फ़्लो का मानव-पठनीय शीर्षक।

key के साथ सुसंगत शैली बनाए रखने की सलाह दी जाती है, जिसमें `Xxx settings` नामकरण का उपयोग किया जाता है, उदाहरण के लिए:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

यह नामकरण शैली अधिक स्पष्ट और समझने में आसान है, जो UI प्रदर्शन और टीम सहयोग को सुविधाजनक बनाती है।

**उदाहरण**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**प्रकार**: `boolean`  
**आवश्यक**: नहीं  
**डिफ़ॉल्ट**: `false`  
**विवरण**: क्या फ़्लो को केवल मैन्युअल रूप से निष्पादित किया जा सकता है।

- `true`: फ़्लो को केवल मैन्युअल रूप से ट्रिगर किया जा सकता है और यह स्वचालित रूप से निष्पादित नहीं होगा।
- `false`: फ़्लो को स्वचालित रूप से निष्पादित किया जा सकता है (जब `on` प्रॉपर्टी मौजूद नहीं होती है तो यह डिफ़ॉल्ट रूप से स्वचालित निष्पादन होता है)।

**उदाहरण**:
```ts
manual: true  // केवल मैन्युअल रूप से निष्पादित करें
manual: false // स्वचालित रूप से निष्पादित किया जा सकता है
```

### sort

**प्रकार**: `number`  
**आवश्यक**: नहीं  
**डिफ़ॉल्ट**: `0`  
**विवरण**: फ़्लो का निष्पादन क्रम। मान जितना छोटा होगा, वह उतनी ही पहले निष्पादित होगा।

कई फ़्लो के निष्पादन क्रम को नियंत्रित करने के लिए ऋणात्मक संख्याओं का उपयोग किया जा सकता है।

**उदाहरण**:
```ts
sort: -1  // प्राथमिकता के साथ निष्पादित करें
sort: 0   // डिफ़ॉल्ट क्रम
sort: 1   // बाद में निष्पादित करें
```

### on

**प्रकार**: `FlowEvent<TModel>`  
**आवश्यक**: नहीं  
**विवरण**: इवेंट कॉन्फ़िगरेशन जो इस फ़्लो को `dispatchEvent` द्वारा ट्रिगर होने की अनुमति देता है।

इसका उपयोग केवल ट्रिगर इवेंट नाम (स्ट्रिंग या `{ eventName }`) घोषित करने के लिए किया जाता है, इसमें हैंडलर फ़ंक्शन शामिल नहीं होता है।

**समर्थित इवेंट प्रकार**:
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
- या कोई भी कस्टम स्ट्रिंग

**उदाहरण**:
```ts
on: 'click'  // क्लिक करने पर ट्रिगर होता है
on: 'submit' // सबमिट करने पर ट्रिगर होता है
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**प्रकार**: `Record<string, StepDefinition<TModel>>`  
**आवश्यक**: हाँ  
**विवरण**: फ़्लो के चरणों की परिभाषा।

यह फ़्लो में शामिल सभी चरणों को परिभाषित करता है, जिसमें प्रत्येक चरण की एक अद्वितीय key होती है।

**उदाहरण**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**प्रकार**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**आवश्यक**: नहीं  
**विवरण**: फ़्लो-स्तर के डिफ़ॉल्ट पैरामीटर।

जब मॉडल को इंस्टेंशिएट (createModel) किया जाता है, तो यह "वर्तमान फ़्लो" के चरण पैरामीटर के लिए प्रारंभिक मान भरता है। यह केवल छूटे हुए मानों को भरता है और मौजूदा मानों को अधिलेखित (overwrite) नहीं करता है। निश्चित वापसी का आकार है: `{ [stepKey]: params }`

**उदाहरण**:
```ts
// स्टैटिक डिफ़ॉल्ट पैरामीटर
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// डायनामिक डिफ़ॉल्ट पैरामीटर
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// एसिंक्रोनस डिफ़ॉल्ट पैरामीटर
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## पूर्ण उदाहरण

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```