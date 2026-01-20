:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# ICollectionManager

`ICollectionManager` इंटरफ़ेस का उपयोग किसी डेटा स्रोत के `संग्रह` इंस्टेंस को प्रबंधित करने के लिए किया जाता है।

## API

### registerFieldTypes()

`संग्रह` में फ़ील्ड प्रकारों को रजिस्टर करता है।

#### सिग्नेचर

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

किसी `संग्रह` के `इंटरफ़ेस` को रजिस्टर करता है।

#### सिग्नेचर

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

एक `संग्रह टेम्पलेट` को रजिस्टर करता है।

#### सिग्नेचर

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

एक `मॉडल` को रजिस्टर करता है।

#### सिग्नेचर

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

एक `रिपॉजिटरी` को रजिस्टर करता है।

#### सिग्नेचर

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

एक रजिस्टर्ड रिपॉजिटरी इंस्टेंस प्राप्त करता है।

#### सिग्नेचर

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

एक `संग्रह` को परिभाषित करता है।

#### सिग्नेचर

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

किसी मौजूदा `संग्रह` की प्रॉपर्टीज़ को संशोधित करता है।

#### सिग्नेचर

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

जाँचता है कि क्या कोई `संग्रह` मौजूद है।

#### सिग्नेचर

- `hasCollection(name: string): boolean`

### getCollection()

एक `संग्रह` इंस्टेंस प्राप्त करता है।

#### सिग्नेचर

- `getCollection(name: string): ICollection`

### getCollections()

सभी `संग्रह` इंस्टेंस प्राप्त करता है।

#### सिग्नेचर

- `getCollections(): Array<ICollection>`

### getRepository()

एक `रिपॉजिटरी` इंस्टेंस प्राप्त करता है।

#### सिग्नेचर

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

डेटा स्रोत को सिंक्रनाइज़ करता है। इसका लॉजिक सबक्लासेस द्वारा लागू किया जाता है।

#### सिग्नेचर

- `sync(): Promise<void>`