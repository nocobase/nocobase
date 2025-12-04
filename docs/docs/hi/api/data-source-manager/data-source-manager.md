:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# DataSourceManager

`DataSourceManager` कई `dataSource` इंस्टेंस को मैनेज करने वाली क्लास है।

## API

### add()
एक `dataSource` इंस्टेंस जोड़ता है।

#### सिग्नेचर

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

`dataSource` इंस्टेंस में ग्लोबल मिडिलवेयर जोड़ता है।

### middleware()

मौजूदा `DataSourceManager` इंस्टेंस का मिडिलवेयर प्राप्त करता है, जिसका उपयोग HTTP रिक्वेस्ट का जवाब देने के लिए किया जा सकता है।

### afterAddDataSource()

एक हुक फ़ंक्शन जिसे नया `dataSource` जोड़ने के बाद कॉल किया जाता है।

#### सिग्नेचर

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

एक डेटा स्रोत (Data Source) प्रकार और उसकी क्लास को रजिस्टर करता है।

#### सिग्नेचर

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

डेटा स्रोत (Data Source) क्लास प्राप्त करता है।

#### सिग्नेचर

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

रजिस्टर किए गए डेटा स्रोत (Data Source) प्रकार और इंस्टेंस विकल्पों के आधार पर एक डेटा स्रोत (Data Source) इंस्टेंस बनाता है।

#### सिग्नेचर

- `buildDataSourceByType(type: string, options: any): DataSource`