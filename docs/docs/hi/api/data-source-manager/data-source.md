:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# डेटा स्रोत (एब्स्ट्रैक्ट)

`DataSource` एक एब्स्ट्रैक्ट क्लास है जिसका उपयोग एक प्रकार के डेटा स्रोत को दर्शाने के लिए किया जाता है, जो एक डेटाबेस, API, आदि हो सकता है।

## सदस्य

### collectionManager

डेटा स्रोत का CollectionManager इंस्टेंस, जिसे [`ICollectionManager`](/api/data-source-manager/i-collection-manager) इंटरफ़ेस को लागू करना होगा।

### resourceManager

डेटा स्रोत का resourceManager इंस्टेंस।

### acl

डेटा स्रोत का ACL इंस्टेंस।

## API

### constructor()

कंस्ट्रक्टर, जो एक `DataSource` इंस्टेंस बनाता है।

#### सिग्नेचर

- `constructor(options: DataSourceOptions)`

### init()

इनिशियलाइज़ेशन फ़ंक्शन, जिसे `constructor` के तुरंत बाद कॉल किया जाता है।

#### सिग्नेचर

- `init(options: DataSourceOptions)`


### name

#### सिग्नेचर

- `get name()`

डेटा स्रोत का इंस्टेंस नाम देता है।

### middleware()

DataSource के लिए मिडलवेयर प्राप्त करता है, जिसका उपयोग सर्वर पर रिक्वेस्ट प्राप्त करने के लिए माउंट करने हेतु किया जाता है।

### testConnection()

एक स्टैटिक मेथड जिसे कनेक्शन टेस्ट ऑपरेशन के दौरान कॉल किया जाता है। इसका उपयोग पैरामीटर वैलिडेशन के लिए किया जा सकता है, और विशिष्ट लॉजिक सबक्लास द्वारा लागू किया जाता है।

#### सिग्नेचर

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### सिग्नेचर

- `async load(options: any = {})`

डेटा स्रोत के लिए लोड ऑपरेशन। लॉजिक सबक्लास द्वारा लागू किया जाता है।

### createCollectionManager()

#### सिग्नेचर
- `abstract createCollectionManager(options?: any): ICollectionManager`

डेटा स्रोत के लिए एक CollectionManager इंस्टेंस बनाता है। लॉजिक सबक्लास द्वारा लागू किया जाता है।

### createResourceManager()

डेटा स्रोत के लिए एक ResourceManager इंस्टेंस बनाता है। सबक्लास इसे ओवरराइड कर सकते हैं। डिफ़ॉल्ट रूप से, यह `@nocobase/resourcer` से `ResourceManager` बनाता है।

### createACL()

- DataSource के लिए एक ACL इंस्टेंस बनाता है। सबक्लास इसे ओवरराइड कर सकते हैं। डिफ़ॉल्ट रूप से, यह `@nocobase/acl` से `ACL` बनाता है।