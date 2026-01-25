:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Google Workspace

## Google को IdP के रूप में सेट करें

[Google एडमिन कंसोल](https://admin.google.com/) - ऐप्स - वेब और मोबाइल ऐप्स

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

ऐप सेट करने के बाद, **SSO URL**, **एंटिटी ID** और **सर्टिफिकेट** कॉपी करें।

![](https://static-docs.nocobase.com/aafd20a730e85411c0c8f368637e0.png)

## NocoBase पर नया ऑथेंटिकेटर जोड़ें

प्लगइन सेटिंग्स - यूज़र ऑथेंटिकेशन - जोड़ें - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

कॉपी की गई जानकारी को नीचे दिए गए अनुसार भरें:

- SSO URL: SSO URL
- पब्लिक सर्टिफिकेट: सर्टिफिकेट
- idP इश्यूअर: एंटिटी ID
- http: यदि आप लोकल http पर टेस्ट कर रहे हैं, तो इसे चुनें।

इसके बाद, Usage से SP Issuer/EntityID और ACS URL कॉपी करें।

## Google पर SP जानकारी भरें

Google कंसोल पर वापस जाएँ, **सर्विस प्रोवाइडर डिटेल्स** पेज पर, पहले कॉपी किए गए ACS URL और एंटिटी ID डालें, और **साइंड रिस्पॉन्स** को चुनें।

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

**एट्रिब्यूट मैपिंग** सेक्शन में, मैपिंग जोड़ें ताकि आप संबंधित एट्रिब्यूट को मैप कर सकें।

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)