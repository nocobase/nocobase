---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# ईमेल भेजें

## परिचय

इसका उपयोग ईमेल भेजने के लिए किया जाता है। यह टेक्स्ट और HTML दोनों फॉर्मेट में ईमेल सामग्री को सपोर्ट करता है।

## नोड बनाएँ

वर्कफ़्लो कॉन्फ़िगरेशन इंटरफ़ेस में, फ़्लो में प्लस ("+") बटन पर क्लिक करके "ईमेल भेजें" नोड जोड़ें:

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## नोड कॉन्फ़िगरेशन

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

प्रत्येक विकल्प वर्कफ़्लो संदर्भ से वेरिएबल्स का उपयोग कर सकता है। संवेदनशील जानकारी के लिए, आप ग्लोबल वेरिएबल्स और सीक्रेट्स का भी उपयोग कर सकते हैं।

## अक्सर पूछे जाने वाले प्रश्न

### Gmail भेजने की आवृत्ति सीमा

कुछ ईमेल भेजते समय, आपको निम्नलिखित त्रुटि का सामना करना पड़ सकता है:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

ऐसा इसलिए है क्योंकि Gmail उन डोमेन से भेजने के अनुरोधों पर दर-सीमा (rate-limit) लगाता है जो निर्दिष्ट नहीं हैं। एप्लिकेशन को डिप्लॉय करते समय, आपको सर्वर के होस्टनेम को उस डोमेन पर कॉन्फ़िगर करना होगा जिसे आपने Gmail में कॉन्फ़िगर किया है। उदाहरण के लिए, Docker डिप्लॉयमेंट में:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # अपने कॉन्फ़िगर किए गए भेजने वाले डोमेन पर सेट करें
```

संदर्भ: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)