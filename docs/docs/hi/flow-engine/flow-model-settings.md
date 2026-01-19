:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# FlowModel: इवेंट Flow और कॉन्फ़िगरेशन

FlowModel, कंपोनेंट की कॉन्फ़िगरेशन लॉजिक को लागू करने के लिए "इवेंट Flow" पर आधारित एक तरीका प्रदान करता है। यह कंपोनेंट के व्यवहार और कॉन्फ़िगरेशन को अधिक एक्स्टेंसिबल और विज़ुअल बनाता है।

## कस्टम मॉडल

आप `FlowModel` को इनहेरिट करके अपना कस्टम कंपोनेंट मॉडल बना सकते हैं। मॉडल को कंपोनेंट की रेंडरिंग लॉजिक को परिभाषित करने के लिए `render()` मेथड को लागू करना होगा।

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Flow रजिस्टर करना

हर मॉडल एक या एक से अधिक **Flow** रजिस्टर कर सकता है, जिनका उपयोग कंपोनेंट की कॉन्फ़िगरेशन लॉजिक और इंटरैक्शन स्टेप्स का वर्णन करने के लिए किया जाता है।

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'बटन सेटिंग्स',
  steps: {
    general: {
      title: 'सामान्य कॉन्फ़िगरेशन',
      uiSchema: {
        title: {
          type: 'string',
          title: 'बटन शीर्षक',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

विवरण

-   `key`: Flow का यूनीक आइडेंटिफ़ायर।
-   `title`: Flow का नाम, जिसका उपयोग UI में दिखाने के लिए किया जाता है।
-   `steps`: कॉन्फ़िगरेशन स्टेप्स (Step) को परिभाषित करता है। हर स्टेप में शामिल हैं:
    -   `title`: स्टेप का शीर्षक।
    -   `uiSchema`: कॉन्फ़िगरेशन फ़ॉर्म स्ट्रक्चर (Formily Schema के साथ कंपैटिबल)।
    -   `defaultParams`: डिफ़ॉल्ट पैरामीटर।
    -   `handler(ctx, params)`: सेव करते समय ट्रिगर होता है, जिसका उपयोग मॉडल की स्थिति को अपडेट करने के लिए किया जाता है।

## मॉडल को रेंडर करना

कंपोनेंट मॉडल को रेंडर करते समय, आप `showFlowSettings` पैरामीटर का उपयोग करके यह कंट्रोल कर सकते हैं कि कॉन्फ़िगरेशन फ़ीचर को इनेबल करना है या नहीं। यदि `showFlowSettings` इनेबल है, तो कंपोनेंट के ऊपरी-दाएँ कोने में एक कॉन्फ़िगरेशन एंट्री (जैसे सेटिंग्स आइकन या बटन) अपने आप दिखाई देगी।

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## openFlowSettings का उपयोग करके कॉन्फ़िगरेशन फ़ॉर्म को मैन्युअल रूप से खोलना

बिल्ट-इन इंटरैक्शन एंट्री के माध्यम से कॉन्फ़िगरेशन फ़ॉर्म खोलने के अलावा, आप कोड में `openFlowSettings()` को मैन्युअल रूप से भी कॉल कर सकते हैं।

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### पैरामीटर परिभाषाएँ

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // आवश्यक, संबंधित मॉडल इंस्टेंस
  preset?: boolean;               // केवल उन स्टेप्स को रेंडर करता है जिन्हें preset=true के रूप में चिह्नित किया गया है (डिफ़ॉल्ट false)
  flowKey?: string;               // एक सिंगल Flow निर्दिष्ट करें
  flowKeys?: string[];            // कई Flows निर्दिष्ट करें (यदि flowKey भी प्रदान किया गया है तो इसे अनदेखा कर दिया जाएगा)
  stepKey?: string;               // एक सिंगल स्टेप निर्दिष्ट करें (आमतौर पर flowKey के साथ उपयोग किया जाता है)
  uiMode?: 'dialog' | 'drawer';   // फ़ॉर्म प्रदर्शित करने के लिए कंटेनर, डिफ़ॉल्ट 'dialog'
  onCancel?: () => void;          // कैंसिल पर क्लिक करने पर कॉलबैक
  onSaved?: () => void;           // कॉन्फ़िगरेशन सफलतापूर्वक सेव होने के बाद कॉलबैक
}
```

### उदाहरण: Drawer मोड में किसी विशिष्ट Flow का कॉन्फ़िगरेशन फ़ॉर्म खोलना

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('बटन कॉन्फ़िगरेशन सेव हो गया है');
  },
});
```