:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# API संदर्भ

## सर्वर-साइड

सर्वर-साइड पैकेज संरचना में उपलब्ध API नीचे दिए गए कोड में दिखाए गए हैं:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

वर्कफ़्लो प्लगइन क्लास।

आमतौर पर, एप्लिकेशन के रनटाइम के दौरान, आप कहीं भी एप्लिकेशन इंस्टेंस `app` प्राप्त कर सकते हैं, वहाँ आप `PluginWorkflowServer` का इंस्टेंस प्राप्त करने के लिए `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` को कॉल कर सकते हैं (नीचे इसे `plugin` के रूप में संदर्भित किया जाएगा)।

#### `registerTrigger()`

यह एक नए ट्रिगर प्रकार को विस्तारित और रजिस्टर करता है।

**सिग्नेचर**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**पैरामीटर्स**

| पैरामीटर  | प्रकार                      | विवरण              |
| --------- | --------------------------- | ----------------- |
| `type`    | `string`                    | ट्रिगर प्रकार पहचानकर्ता |
| `trigger` | `typeof Trigger \| Trigger` | ट्रिगर प्रकार या इंस्टेंस |

**उदाहरण**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

यह एक नए नोड प्रकार को विस्तारित और रजिस्टर करता है।

**सिग्नेचर**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**पैरामीटर्स**

| पैरामीटर      | प्रकार                                | विवरण              |
| ------------- | ----------------------------------- | ----------------- |
| `type`        | `string`                            | इंस्ट्रक्शन प्रकार पहचानकर्ता |
| `instruction` | `typeof Instruction \| Instruction` | इंस्ट्रक्शन प्रकार या इंस्टेंस |

**उदाहरण**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

यह एक विशिष्ट वर्कफ़्लो को ट्रिगर करता है। इसका उपयोग मुख्य रूप से कस्टम ट्रिगर में किया जाता है, ताकि किसी विशिष्ट कस्टम इवेंट को सुनने पर संबंधित वर्कफ़्लो को ट्रिगर किया जा सके।

**सिग्नेचर**

`trigger(workflow: Workflow, context: any)`

**पैरामीटर्स**
| पैरामीटर | प्रकार | विवरण |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | ट्रिगर किया जाने वाला वर्कफ़्लो ऑब्जेक्ट |
| `context` | `object` | ट्रिगर के समय प्रदान किया गया संदर्भ डेटा |

:::info{title=टिप}
`context` वर्तमान में एक आवश्यक आइटम है। यदि इसे प्रदान नहीं किया जाता है, तो वर्कफ़्लो ट्रिगर नहीं होगा।
:::

**उदाहरण**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

यह एक विशिष्ट नोड कार्य के साथ रुके हुए वर्कफ़्लो को फिर से शुरू करता है।

- केवल रुके हुए (`EXECUTION_STATUS.STARTED`) स्थिति में वर्कफ़्लो को ही फिर से शुरू किया जा सकता है।
- केवल लंबित (`JOB_STATUS.PENDING`) स्थिति में नोड कार्यों को ही फिर से शुरू किया जा सकता है।

**सिग्नेचर**

`resume(job: JobModel)`

**पैरामीटर्स**

| पैरामीटर | प्रकार       | विवरण            |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | अपडेट किया गया जॉब ऑब्जेक्ट |

:::info{title=टिप}
पास किया गया जॉब ऑब्जेक्ट आमतौर पर एक अपडेटेड ऑब्जेक्ट होता है, और इसकी `status` को आमतौर पर `JOB_STATUS.PENDING` के अलावा किसी अन्य मान पर अपडेट किया जाता है, अन्यथा यह रुका रहेगा।
:::

**उदाहरण**

विवरण के लिए [सोर्स कोड](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) देखें।

### `Trigger`

ट्रिगर के लिए बेस क्लास, जिसका उपयोग कस्टम ट्रिगर प्रकारों को विस्तारित करने के लिए किया जाता है।

| पैरामीटर      | प्रकार                                                        | विवरण                    |
| ------------- | ----------------------------------------------------------- | ----------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | कंस्ट्रक्टर                |
| `on?`         | `(workflow: WorkflowModel): void`                           | वर्कफ़्लो सक्षम करने के बाद इवेंट हैंडलर |
| `off?`        | `(workflow: WorkflowModel): void`                           | वर्कफ़्लो अक्षम करने के बाद इवेंट हैंडलर |

`on`/`off` का उपयोग वर्कफ़्लो को सक्षम/अक्षम करते समय इवेंट लिसनर को रजिस्टर/अन-रजिस्टर करने के लिए किया जाता है। पास किया गया पैरामीटर ट्रिगर के अनुरूप वर्कफ़्लो इंस्टेंस होता है, जिसे संबंधित कॉन्फ़िगरेशन के अनुसार प्रोसेस किया जा सकता है। कुछ ट्रिगर प्रकार, जो पहले से ही वैश्विक स्तर पर इवेंट्स को सुन रहे हैं, उन्हें इन दोनों मेथड्स को लागू करने की आवश्यकता नहीं हो सकती है। उदाहरण के लिए, एक शेड्यूल्ड ट्रिगर में, आप `on` में एक टाइमर रजिस्टर कर सकते हैं और `off` में उसे अन-रजिस्टर कर सकते हैं।

### `Instruction`

इंस्ट्रक्शन प्रकारों के लिए बेस क्लास, जिसका उपयोग कस्टम इंस्ट्रक्शन प्रकारों को विस्तारित करने के लिए किया जाता है।

| पैरामीटर      | प्रकार                                                            | विवरण                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | कंस्ट्रक्टर                           |
| `run`         | `Runner`                                                        | नोड में पहली बार प्रवेश करने के लिए निष्पादन तर्क |
| `resume?`     | `Runner`                                                        | बाधा से फिर से शुरू होने के बाद नोड में प्रवेश करने के लिए निष्पादन तर्क |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | संबंधित नोड द्वारा उत्पन्न शाखा के लिए स्थानीय वेरिएबल सामग्री प्रदान करता है |

**संबंधित प्रकार**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

`getScope` के लिए, आप [लूप नोड के कार्यान्वयन](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83) को संदर्भित कर सकते हैं, जिसका उपयोग शाखाओं के लिए स्थानीय वेरिएबल सामग्री प्रदान करने के लिए किया जाता है।

### `EXECUTION_STATUS`

वर्कफ़्लो निष्पादन योजना स्थितियों के लिए एक स्थिरांक तालिका, जिसका उपयोग संबंधित निष्पादन योजना की वर्तमान स्थिति को पहचानने के लिए किया जाता है।

| स्थिरांक नाम                     | अर्थ                       |
| ------------------------------- | -------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | कतार में                    |
| `EXECUTION_STATUS.STARTED`      | शुरू हो गया                 |
| `EXECUTION_STATUS.RESOLVED`     | सफलतापूर्वक पूरा हुआ        |
| `EXECUTION_STATUS.FAILED`       | असफल                      |
| `EXECUTION_STATUS.ERROR`        | निष्पादन त्रुटि             |
| `EXECUTION_STATUS.ABORTED`      | अधूरी                      |
| `EXECUTION_STATUS.CANCELED`     | रद्द कर दिया गया            |
| `EXECUTION_STATUS.REJECTED`     | अस्वीकृत                   |
| `EXECUTION_STATUS.RETRY_NEEDED` | सफलतापूर्वक निष्पादित नहीं हुआ, पुनः प्रयास की आवश्यकता है |

पहले तीन को छोड़कर, अन्य सभी विफल स्थिति का प्रतिनिधित्व करते हैं, लेकिन विभिन्न विफलता कारणों को व्यक्त करने के लिए उपयोग किए जा सकते हैं।

### `JOB_STATUS`

वर्कफ़्लो नोड जॉब स्थितियों के लिए एक स्थिरांक तालिका, जिसका उपयोग संबंधित नोड जॉब की वर्तमान स्थिति को पहचानने के लिए किया जाता है। नोड द्वारा उत्पन्न स्थिति पूरे निष्पादन योजना की स्थिति को भी प्रभावित करती है।

| स्थिरांक नाम                    | अर्थ                                     |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | लंबित: निष्पादन इस नोड तक पहुँच गया है, लेकिन इंस्ट्रक्शन इसे निलंबित करने और प्रतीक्षा करने के लिए कहता है |
| `JOB_STATUS.RESOLVED`     | सफलतापूर्वक पूरा हुआ                      |
| `JOB_STATUS.FAILED`       | असफल: इस नोड का निष्पादन कॉन्फ़िगर की गई शर्तों को पूरा करने में विफल रहा |
| `JOB_STATUS.ERROR`        | त्रुटि: इस नोड के निष्पादन के दौरान एक अनहैंडल्ड त्रुटि हुई   |
| `JOB_STATUS.ABORTED`      | अधूरी: इस नोड का निष्पादन लंबित स्थिति में होने के बाद अन्य तर्क द्वारा समाप्त कर दिया गया   |
| `JOB_STATUS.CANCELED`     | रद्द: लंबित स्थिति में होने के बाद इस नोड का निष्पादन मैन्युअल रूप से रद्द कर दिया गया       |
| `JOB_STATUS.REJECTED`     | अस्वीकृत: लंबित स्थिति में होने के बाद इस नोड की निरंतरता को मैन्युअल रूप से अस्वीकार कर दिया गया       |
| `JOB_STATUS.RETRY_NEEDED` | सफलतापूर्वक निष्पादित नहीं हुआ, पुनः प्रयास की आवश्यकता है                     |

## क्लाइंट-साइड

क्लाइंट-साइड पैकेज संरचना में उपलब्ध API नीचे दिए गए कोड में दिखाए गए हैं:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

यह ट्रिगर प्रकार के लिए कॉन्फ़िगरेशन पैनल को रजिस्टर करता है।

**सिग्नेचर**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**पैरामीटर्स**

| पैरामीटर  | प्रकार                      | विवरण                                 |
| --------- | --------------------------- | ------------------------------------ |
| `type`    | `string`                    | ट्रिगर प्रकार पहचानकर्ता, जो रजिस्ट्रेशन के लिए उपयोग किए गए पहचानकर्ता के अनुरूप है |
| `trigger` | `typeof Trigger \| Trigger` | ट्रिगर प्रकार या इंस्टेंस                     |

#### `registerInstruction()`

यह नोड प्रकार के लिए कॉन्फ़िगरेशन पैनल को रजिस्टर करता है।

**सिग्नेचर**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**पैरामीटर्स**

| पैरामीटर      | प्रकार                                | विवरण                               |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type`        | `string`                            | नोड प्रकार पहचानकर्ता, जो रजिस्ट्रेशन के लिए उपयोग किए गए पहचानकर्ता के अनुरूप है |
| `instruction` | `typeof Instruction \| Instruction` | नोड प्रकार या इंस्टेंस                     |

#### `registerInstructionGroup()`

यह नोड प्रकार समूह को रजिस्टर करता है। NocoBase डिफ़ॉल्ट रूप से 4 नोड प्रकार समूह प्रदान करता है:

*   `'control'`: कंट्रोल (नियंत्रण) वर्ग
*   `'collection'`: संग्रह संचालन वर्ग
*   `'manual'`: मैन्युअल प्रोसेसिंग (हस्तचालित प्रसंस्करण) वर्ग
*   `'extended'`: अन्य एक्सटेंशन (विस्तार) वर्ग

यदि आपको अन्य समूहों को विस्तारित करने की आवश्यकता है, तो आप इस मेथड का उपयोग करके उन्हें रजिस्टर कर सकते हैं।

**सिग्नेचर**

`registerInstructionGroup(type: string, group: { label: string }): void`

**पैरामीटर्स**

| पैरामीटर | प्रकार               | विवरण                           |
| --------- | ----------------- | ----------------------------- |
| `type`    | `string`          | नोड समूह पहचानकर्ता, जो रजिस्ट्रेशन के लिए उपयोग किए गए पहचानकर्ता के अनुरूप है |
| `group` | `{ label: string }` | समूह जानकारी, वर्तमान में केवल शीर्षक शामिल है         |

**उदाहरण**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

ट्रिगर के लिए बेस क्लास, जिसका उपयोग कस्टम ट्रिगर प्रकारों को विस्तारित करने के लिए किया जाता है।

| पैरामीटर        | प्रकार                                                             | विवरण                               |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title`         | `string`                                                         | ट्रिगर प्रकार का नाम                     |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | ट्रिगर कॉन्फ़िगरेशन आइटम का संग्रह                   |
| `scope?`        | `{ [key: string]: any }`                                         | कॉन्फ़िगरेशन आइटम स्कीमा में उपयोग किए जा सकने वाले ऑब्जेक्ट का संग्रह |
| `components?`   | `{ [key: string]: React.FC }`                                    | कॉन्फ़िगरेशन आइटम स्कीमा में उपयोग किए जा सकने वाले कंपोनेंट का संग्रह |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | ट्रिगर संदर्भ डेटा के लिए मान एक्सेसरी           |

- यदि `useVariables` सेट नहीं है, तो इसका मतलब है कि इस प्रकार का ट्रिगर मान पुनर्प्राप्ति कार्यक्षमता प्रदान नहीं करता है, और वर्कफ़्लो नोड्स में ट्रिगर का संदर्भ डेटा नहीं चुना जा सकता है।

### `Instruction`

इंस्ट्रक्शन के लिए बेस क्लास, जिसका उपयोग कस्टम नोड प्रकारों को विस्तारित करने के लिए किया जाता है।

| पैरामीटर             | प्रकार                                                    | विवरण                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`              | `string`                                                | नोड प्रकार समूह पहचानकर्ता, वर्तमान में उपलब्ध विकल्प: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | नोड कॉन्फ़िगरेशन आइटम का संग्रह                                                                 |
| `scope?`             | `Record<string, Function>`                              | कॉन्फ़िगरेशन आइटम स्कीमा में उपयोग किए जा सकने वाले ऑब्जेक्ट का संग्रह                                             |
| `components?`        | `Record<string, React.FC>`                              | कॉन्फ़िगरेशन आइटम स्कीमा में उपयोग किए जा सकने वाले कंपोनेंट का संग्रह                                             |
| `Component?`         | `React.FC`                                              | नोड के लिए कस्टम रेंडरिंग कंपोनेंट                                                             |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | नोड के लिए नोड वेरिएबल विकल्प प्रदान करने की मेथड                                                     |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | नोड के लिए शाखा स्थानीय वेरिएबल विकल्प प्रदान करने की मेथड                                                     |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | नोड के लिए इनिशियलाइज़र विकल्प प्रदान करने की मेथड                                                     |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | नोड उपलब्ध है या नहीं, यह निर्धारित करने की मेथड                                                         |

**संबंधित प्रकार**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- यदि `useVariables` सेट नहीं है, तो इसका मतलब है कि यह नोड प्रकार मान पुनर्प्राप्ति कार्यक्षमता प्रदान नहीं करता है, और वर्कफ़्लो नोड्स में इस प्रकार के नोड का परिणाम डेटा नहीं चुना जा सकता है। यदि परिणाम मान एकल है (चयन योग्य नहीं), तो आप संबंधित जानकारी व्यक्त करने वाली स्थिर सामग्री लौटा सकते हैं (संदर्भ: [कैलकुलेशन नोड सोर्स कोड](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68))। यदि इसे चयन योग्य होने की आवश्यकता है (जैसे किसी ऑब्जेक्ट का एक गुण), तो आप संबंधित चयन कंपोनेंट आउटपुट को कस्टमाइज़ कर सकते हैं (संदर्भ: [नया डेटा नोड सोर्स कोड](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41))।
- `Component` नोड के लिए एक कस्टम रेंडरिंग कंपोनेंट है। जब डिफ़ॉल्ट नोड रेंडरिंग पर्याप्त नहीं होती है, तो इसे कस्टम नोड व्यू रेंडरिंग के लिए पूरी तरह से ओवरराइड किया जा सकता है। उदाहरण के लिए, यदि आपको शाखा प्रकार के स्टार्ट नोड के लिए अधिक एक्शन बटन या अन्य इंटरैक्शन प्रदान करने की आवश्यकता है, तो आप इस मेथड का उपयोग करेंगे (संदर्भ: [पैरेलल ब्रांच सोर्स कोड](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx))।
- `useInitializers` का उपयोग ब्लॉक्स को इनिशियलाइज़ करने के लिए एक मेथड प्रदान करने के लिए किया जाता है। उदाहरण के लिए, एक मैन्युअल नोड में, आप अपस्ट्रीम नोड्स के आधार पर संबंधित उपयोगकर्ता ब्लॉक्स को इनिशियलाइज़ कर सकते हैं। यदि यह मेथड प्रदान की जाती है, तो यह मैन्युअल नोड के इंटरफ़ेस कॉन्फ़िगरेशन में ब्लॉक्स को इनिशियलाइज़ करते समय उपलब्ध होगी (संदर्भ: [नया डेटा नोड सोर्स कोड](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71))।
- `isAvailable` का उपयोग मुख्य रूप से यह निर्धारित करने के लिए किया जाता है कि क्या कोई नोड वर्तमान परिवेश में उपयोग (जोड़ा) किया जा सकता है। वर्तमान परिवेश में वर्तमान वर्कफ़्लो, अपस्ट्रीम नोड्स और वर्तमान शाखा इंडेक्स शामिल हैं।