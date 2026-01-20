:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

**प्रकार**

```typescript
interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}
```

**विवरण**

- `values`: अपडेट की जाने वाली रिकॉर्ड का डेटा ऑब्जेक्ट।
- `filter`: अपडेट किए जाने वाले रिकॉर्ड के लिए फ़िल्टर शर्तें निर्दिष्ट करता है। फ़िल्टर के विस्तृत उपयोग के लिए, [`find()`](#find) विधि देखें।
- `filterByTk`: TargetKey द्वारा अपडेट किए जाने वाले रिकॉर्ड के लिए फ़िल्टर शर्तें निर्दिष्ट करता है।
- `whitelist`: `values` फ़ील्ड के लिए एक श्वेतसूची (whitelist)। केवल इस सूची में मौजूद फ़ील्ड ही लिखे जाएँगे।
- `blacklist`: `values` फ़ील्ड के लिए एक कालीसूची (blacklist)। इस सूची में मौजूद फ़ील्ड नहीं लिखे जाएँगे।
- `transaction`: लेन-देन (transaction) ऑब्जेक्ट। यदि कोई लेन-देन पैरामीटर पास नहीं किया जाता है, तो यह विधि स्वचालित रूप से एक आंतरिक लेन-देन बनाएगी।

`filterByTk` या `filter` में से कम से कम एक को पास करना अनिवार्य है।