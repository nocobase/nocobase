---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::



# API दस्तावेज़

## परिचय

यह प्लगइन Swagger के आधार पर NocoBase HTTP API दस्तावेज़ बनाता है।

## स्थापना

यह एक बिल्ट-इन प्लगइन है, इसे स्थापित करने की आवश्यकता नहीं है। आप इसे सक्रिय करके उपयोग कर सकते हैं।

## उपयोग के निर्देश

### API दस्तावेज़ पृष्ठ पर जाएँ

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### दस्तावेज़ का अवलोकन

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- कुल API दस्तावेज़: `/api/swagger:get`
- कोर API दस्तावेज़: `/api/swagger:get?ns=core`
- सभी प्लगइन API दस्तावेज़: `/api/swagger:get?ns=plugins`
- प्रत्येक प्लगइन का दस्तावेज़: `/api/swagger:get?ns=plugins/{name}`
- कस्टम संग्रह के लिए API दस्तावेज़: `/api/swagger:get?ns=collections`
- निर्दिष्ट `${collection}` और संबंधित `${collection}.${association}` संसाधन: `/api/swagger:get?ns=collections/{name}`

## डेवलपर गाइड

### प्लगइन के लिए Swagger दस्तावेज़ कैसे लिखें

प्लगइन के `src` फ़ोल्डर में `swagger/index.ts` नामक एक फ़ाइल जोड़ें, जिसकी सामग्री इस प्रकार है:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

विस्तृत लेखन नियमों के लिए, कृपया [Swagger आधिकारिक दस्तावेज़](https://swagger.io/docs/specification/about/) देखें।