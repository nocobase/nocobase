:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# DataSourceManager डेटा स्रोत प्रबंधन

NocoBase, मल्टीपल डेटा स्रोतों के प्रबंधन के लिए `DataSourceManager` प्रदान करता है। प्रत्येक `DataSource` का अपना `Database`, `ResourceManager`, और `ACL` इंस्टेंस होता है, जो डेवलपर्स को कई डेटा स्रोतों को लचीले ढंग से प्रबंधित और विस्तारित करने में सुविधा प्रदान करता है।

## मूल अवधारणाएँ

प्रत्येक `DataSource` इंस्टेंस में निम्नलिखित शामिल हैं:

- **`dataSource.collectionManager`**: `संग्रह` और फ़ील्ड को प्रबंधित करने के लिए उपयोग किया जाता है।
- **`dataSource.resourceManager`**: संसाधन-संबंधी ऑपरेशंस (जैसे कि CRUD, आदि) को संभालता है।
- **`dataSource.acl`**: संसाधन ऑपरेशंस के लिए एक्सेस कंट्रोल (ACL)।

सुविधाजनक पहुँच के लिए, मुख्य डेटा स्रोत सदस्यों के लिए उपनाम (aliases) प्रदान किए गए हैं:

- `app.db` `dataSourceManager.get('main').collectionManager.db` के समतुल्य है
- `app.acl` `dataSourceManager.get('main').acl` के समतुल्य है
- `app.resourceManager` `dataSourceManager.get('main').resourceManager` के समतुल्य है

## सामान्य तरीके

### dataSourceManager.get(dataSourceKey)

यह तरीका (method) निर्दिष्ट `DataSource` इंस्टेंस को लौटाता है।

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

सभी डेटा स्रोतों के लिए मिडलवेयर (middleware) रजिस्टर करें। यह सभी डेटा स्रोतों पर होने वाले ऑपरेशंस को प्रभावित करेगा।

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

यह डेटा स्रोत लोड होने से पहले निष्पादित होता है। इसका उपयोग आमतौर पर स्टैटिक क्लास रजिस्ट्रेशन के लिए किया जाता है, जैसे कि मॉडल क्लास और फ़ील्ड प्रकार (field type) रजिस्ट्रेशन:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // कस्टम फ़ील्ड प्रकार
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

यह डेटा स्रोत लोड होने के बाद निष्पादित होता है। इसका उपयोग आमतौर पर ऑपरेशंस को रजिस्टर करने, एक्सेस कंट्रोल सेट करने आदि के लिए किया जाता है।

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // एक्सेस अनुमतियाँ सेट करें
});
```

## डेटा स्रोत एक्सटेंशन

पूर्ण डेटा स्रोत एक्सटेंशन के लिए, कृपया [डेटा स्रोत एक्सटेंशन अध्याय](#) देखें।