---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# प्रमाणीकरण: CAS

## परिचय

प्रमाणीकरण: CAS प्लगइन CAS (सेंट्रल ऑथेंटिकेशन सर्विस) प्रोटोकॉल मानक का पालन करता है, जिससे उपयोगकर्ता थर्ड-पार्टी आइडेंटिटी प्रमाणीकरण सेवा प्रदाताओं (IdP) द्वारा प्रदान किए गए खातों का उपयोग करके NocoBase में लॉग इन कर सकते हैं।

## इंस्टॉलेशन

## उपयोगकर्ता मैनुअल

### प्लगइन सक्रिय करें

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### CAS प्रमाणीकरण जोड़ें

उपयोगकर्ता प्रमाणीकरण प्रबंधन पृष्ठ पर जाएँ

http://localhost:13000/admin/settings/auth/authenticators

CAS प्रमाणीकरण विधि जोड़ें

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

CAS कॉन्फ़िगर करें और सक्रिय करें

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### लॉग इन पृष्ठ पर जाएँ

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)