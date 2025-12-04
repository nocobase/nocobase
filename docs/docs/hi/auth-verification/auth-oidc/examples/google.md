:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Google से साइन इन करें

> https://developers.google.com/identity/openid-connect/openid-connect

## Google OAuth 2.0 क्रेडेंशियल प्राप्त करें

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) पर जाएँ - क्रेडेंशियल बनाएँ - OAuth क्लाइंट ID

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

कॉन्फ़िगरेशन इंटरफ़ेस पर जाएँ और अधिकृत रीडायरेक्ट URL भरें। NocoBase में एक नया प्रमाणीकरणकर्ता (authenticator) जोड़ते समय रीडायरेक्ट URL प्राप्त किया जा सकता है, आमतौर पर यह `http(s)://host:port/api/oidc:redirect` होता है। [उपयोगकर्ता मैनुअल - कॉन्फ़िगरेशन](../index.md#configuration) अनुभाग देखें।

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## NocoBase पर एक नया प्रमाणीकरणकर्ता जोड़ें

प्लगइन सेटिंग्स - उपयोगकर्ता प्रमाणीकरण - जोड़ें - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

[उपयोगकर्ता मैनुअल - कॉन्फ़िगरेशन](../index.md#configuration) में बताए गए मापदंडों (parameters) का संदर्भ लें और प्रमाणीकरणकर्ता कॉन्फ़िगरेशन पूरा करें।