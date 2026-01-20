:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# ट्रिगर प्रकारों का विस्तार करें

प्रत्येक वर्कफ़्लो को एक विशिष्ट ट्रिगर के साथ कॉन्फ़िगर किया जाना चाहिए, जो प्रक्रिया निष्पादन शुरू करने के लिए प्रवेश बिंदु के रूप में कार्य करता है।

एक ट्रिगर प्रकार आमतौर पर एक विशिष्ट सिस्टम परिवेश घटना का प्रतिनिधित्व करता है। एप्लिकेशन के रनटाइम जीवनचक्र के दौरान, कोई भी हिस्सा जो सदस्यता लेने योग्य घटनाएँ प्रदान करता है, उसका उपयोग ट्रिगर प्रकार को परिभाषित करने के लिए किया जा सकता है। उदाहरण के लिए, अनुरोध प्राप्त करना, संग्रह (डेटा तालिका) संचालन, निर्धारित कार्य आदि।

ट्रिगर प्रकार एक स्ट्रिंग पहचानकर्ता के आधार पर प्लगइन की ट्रिगर तालिका में पंजीकृत होते हैं। वर्कफ़्लो प्लगइन में कई अंतर्निहित ट्रिगर हैं:

- `'collection'`: संग्रह (डेटा तालिका) संचालन द्वारा ट्रिगर किया जाता है;
- `'schedule'`: निर्धारित कार्यों द्वारा ट्रिगर किया जाता है;
- `'action'`: कार्रवाई के बाद की घटनाओं द्वारा ट्रिगर किया जाता है;

विस्तारित ट्रिगर प्रकारों को यह सुनिश्चित करना होगा कि उनके पहचानकर्ता अद्वितीय हों। ट्रिगर की सदस्यता लेने/सदस्यता रद्द करने का कार्यान्वयन सर्वर-साइड पर पंजीकृत होता है, और कॉन्फ़िगरेशन इंटरफ़ेस का कार्यान्वयन क्लाइंट-साइड पर पंजीकृत होता है।

## सर्वर-साइड

किसी भी ट्रिगर को `Trigger` बेस क्लास से इनहेरिट करना होगा और `on`/`off` मेथड्स को लागू करना होगा, जिनका उपयोग क्रमशः विशिष्ट परिवेश घटनाओं की सदस्यता लेने और सदस्यता रद्द करने के लिए किया जाता है। `on` मेथड में, आपको अंततः घटना को ट्रिगर करने के लिए विशिष्ट इवेंट कॉलबैक फ़ंक्शन के भीतर `this.workflow.trigger()` को कॉल करना होगा। इसके अतिरिक्त, `off` मेथड में, आपको सदस्यता रद्द करने के लिए संबंधित सफ़ाई का काम करना होगा।

यहाँ `this.workflow` वह वर्कफ़्लो प्लगइन इंस्टेंस है जिसे `Trigger` बेस क्लास के कंस्ट्रक्टर में पास किया जाता है।

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

फिर, उस प्लगइन में जो वर्कफ़्लो का विस्तार करता है, ट्रिगर इंस्टेंस को वर्कफ़्लो इंजन के साथ पंजीकृत करें:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

सर्वर के शुरू होने और लोड होने के बाद, `'interval'` प्रकार के ट्रिगर को जोड़ा और निष्पादित किया जा सकता है।

## क्लाइंट-साइड

क्लाइंट-साइड का हिस्सा मुख्य रूप से ट्रिगर प्रकार द्वारा आवश्यक कॉन्फ़िगरेशन आइटम के आधार पर एक कॉन्फ़िगरेशन इंटरफ़ेस प्रदान करता है। प्रत्येक ट्रिगर प्रकार को वर्कफ़्लो प्लगइन के साथ अपनी संबंधित प्रकार कॉन्फ़िगरेशन को भी पंजीकृत करना होगा।

उदाहरण के लिए, ऊपर उल्लिखित निर्धारित निष्पादन ट्रिगर के लिए, कॉन्फ़िगरेशन इंटरफ़ेस फ़ॉर्म में आवश्यक अंतराल समय कॉन्फ़िगरेशन आइटम (`interval`) को परिभाषित करें:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

फिर, विस्तारित प्लगइन के भीतर इस ट्रिगर प्रकार को वर्कफ़्लो प्लगइन इंस्टेंस के साथ पंजीकृत करें:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

इसके बाद, वर्कफ़्लो के कॉन्फ़िगरेशन इंटरफ़ेस में नया ट्रिगर प्रकार दिखाई देगा।

:::info{title=टिप}
क्लाइंट-साइड पर पंजीकृत ट्रिगर प्रकार का पहचानकर्ता सर्वर-साइड वाले के साथ सुसंगत होना चाहिए, अन्यथा यह त्रुटियाँ उत्पन्न करेगा।
:::

ट्रिगर प्रकारों को परिभाषित करने के अन्य विवरणों के लिए, कृपया [वर्कफ़्लो API संदर्भ](./api#pluginregisterTrigger) अनुभाग देखें।