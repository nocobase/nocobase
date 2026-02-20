:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# API संदर्भ

## सर्वर-साइड

### `BaseNotificationChannel`

यह एक अमूर्त क्लास है जो विभिन्न प्रकार के सूचना चैनलों के लिए एक आधार के रूप में कार्य करती है। यह चैनल इम्प्लीमेंटेशन के लिए आवश्यक इंटरफेस को परिभाषित करती है। एक नया सूचना चैनल जोड़ने के लिए, आपको इस क्लास को एक्सटेंड करना होगा और इसके तरीकों को लागू करना होगा।

```ts
export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
  }): Promise<{ message: Message; status: 'success' | 'fail'; reason?: string }>;
}
```

### `PluginNotificationManagerServer`

यह सर्वर-साइड प्लगइन एक सूचना प्रबंधन उपकरण के रूप में कार्य करता है, जो सूचना चैनल प्रकारों को रजिस्टर करने और सूचनाएं भेजने के तरीके प्रदान करता है।

#### `registerChannelType()`

यह तरीका सर्वर-साइड पर एक नया चैनल प्रकार रजिस्टर करता है। उदाहरण उपयोग नीचे दिया गया है।

```ts
import PluginNotificationManagerServer from '@nocobase/plugin-notification-manager';
import { Plugin } from '@nocobase/server';
import { ExampleSever } from './example-server';
export class PluginNotificationExampleServer extends Plugin {
  async load() {
    const notificationServer = this.pm.get(PluginNotificationManagerServer) as PluginNotificationManagerServer;
    notificationServer.registerChannelType({ type: 'example-sms', Channel: ExampleSever });
  }
}

export default PluginNotificationExampleServer;
```

##### सिग्नेचर

`registerChannelType({ type, Channel }: {type: string, Channel: BaseNotificationChannel })`

#### `send()`

`send` तरीका एक निर्दिष्ट चैनल के माध्यम से सूचनाएं भेजने के लिए उपयोग किया जाता है।

```ts
// इन-ऐप मैसेज
send({
  channelName: 'in-app-message',
  message: {
    title: 'इन-ऐप मैसेज टेस्ट शीर्षक',
    content: 'इन-ऐप मैसेज टेस्ट'
  },
  receivers: {
    type: 'userId',
    value: [1, 2, 3]
  },
  triggerFrom: 'workflow'
});

// ईमेल
send({
  channelName: 'email',
  message: {
    title: 'ईमेल टेस्ट शीर्षक',
    content: 'ईमेल टेस्ट'
  },
  receivers: {
    type: 'channel-self-defined',
    channelType: 'email',
    value: ['a@example.com', 'b@example.com']
  },
  triggerFrom: 'workflow'
});
```

##### सिग्नेचर

`send(sendConfig: {channelName: String, message: Object, receivers: ReceiversType, triggerFrom: String })`

`receivers` फ़ील्ड वर्तमान में दो प्रारूपों का समर्थन करता है: NocoBase यूज़र ID `userId` या कस्टम चैनल कॉन्फ़िगरेशन `channel-self-defined`।

```ts
type ReceiversType =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
```

##### विस्तृत जानकारी

`sendConfig`

| प्रॉपर्टी      | प्रकार            | विवरण        |
| ------------- | --------------- | ------------------ |
| `channelName` | `string`        | चैनल पहचानकर्ता |
| `message`     | `object`        | मैसेज ऑब्जेक्ट     |
| `receivers`   | `ReceiversType` | प्राप्तकर्ता         |
| `triggerFrom` | `string`        | ट्रिगर का स्रोत  |

## क्लाइंट-साइड

### `PluginNotificationManagerClient`

#### `channelTypes`

पंजीकृत चैनल प्रकारों की लाइब्रेरी।

##### सिग्नेचर

`channelTypes: Registry<registerTypeOptions>`

#### `registerChannelType()`

एक क्लाइंट-साइड चैनल प्रकार रजिस्टर करता है।

##### सिग्नेचर

`registerChannelType(params: registerTypeOptions)`

##### प्रकार

```ts
type registerTypeOptions = {
  title: string; // चैनल के लिए प्रदर्शित शीर्षक
  type: string; // चैनल पहचानकर्ता
  components: {
    ChannelConfigForm?: ComponentType; // चैनल कॉन्फ़िगरेशन फ़ॉर्म कंपोनेंट;
    MessageConfigForm?: ComponentType<{ variableOptions: any }>; // मैसेज कॉन्फ़िगरेशन फ़ॉर्म कंपोनेंट;
    ContentConfigForm?: ComponentType<{ variableOptions: any }>; // सामग्री कॉन्फ़िगरेशन फ़ॉर्म कंपोनेंट (केवल मैसेज सामग्री के लिए, प्राप्तकर्ता कॉन्फ़िगरेशन को छोड़कर);
  };
  meta?: {
    // चैनल कॉन्फ़िगरेशन के लिए मेटाडेटा
    createable?: boolean; // क्या नए चैनल जोड़े जा सकते हैं;
    editable?: boolean; // क्या चैनल कॉन्फ़िगरेशन संपादन योग्य है;
    deletable?: boolean; // क्या चैनल कॉन्फ़िगरेशन हटाने योग्य है;
  };
};

type RegisterChannelType = (params: ChannelType) => void;
```