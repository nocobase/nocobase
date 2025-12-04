---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# माइक्रोसॉफ्ट कॉन्फ़िगरेशन

### पूर्व-आवश्यकताएँ
उपयोगकर्ताओं को Outlook मेलबॉक्स को NocoBase से जोड़ने की अनुमति देने के लिए, आपको इसे ऐसे सर्वर पर डिप्लॉय करना होगा जो माइक्रोसॉफ्ट सेवाओं तक पहुँच सके। बैकएंड माइक्रोसॉफ्ट API को कॉल करेगा।

### खाता रजिस्टर करें

1.  https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account पर जाएँ।
2.  अपने माइक्रोसॉफ्ट खाते में लॉग इन करें।

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### एक टेनेंट बनाएँ

1.  https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount पर जाएँ और अपने खाते में लॉग इन करें।
2.  बुनियादी जानकारी भरें और सत्यापन कोड प्राप्त करें।

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3.  अन्य जानकारी भरें और जारी रखें।

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4.  अपनी क्रेडिट कार्ड जानकारी भरें (आप इसे अभी के लिए छोड़ सकते हैं)।

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### क्लाइंट ID प्राप्त करें

1.  शीर्ष मेनू पर क्लिक करें और "Microsoft Entra ID" चुनें।

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2.  बाईं ओर "App registrations" चुनें।

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3.  शीर्ष पर "New registration" पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4.  जानकारी भरें और सबमिट करें।

नाम कुछ भी हो सकता है। खाता प्रकारों के लिए, नीचे दी गई छवि में दिखाए गए विकल्प को चुनें। आप अभी के लिए रीडायरेक्ट URI को खाली छोड़ सकते हैं।

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5.  क्लाइंट ID प्राप्त करें।

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API प्राधिकरण

1.  बाईं ओर "API permissions" मेनू खोलें।

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2.  "Add a permission" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3.  "Microsoft Graph" पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4.  निम्नलिखित अनुमतियों को खोजें और जोड़ें। अंतिम परिणाम नीचे दी गई छवि में दिखाए अनुसार होना चाहिए।

    1.  `"email"`
    2.  `"offline_access"`
    3.  `"IMAP.AccessAsUser.All"`
    4.  `"SMTP.Send"`
    5.  `"offline_access"`
    6.  `"User.Read"` (डिफ़ॉल्ट रूप से)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### सीक्रेट प्राप्त करें

1.  बाईं ओर "Certificates & secrets" पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2.  "New client secret" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3.  विवरण और समाप्ति समय भरें, और जोड़ें।

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4.  सीक्रेट ID प्राप्त करें।

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5.  क्लाइंट ID और क्लाइंट सीक्रेट को कॉपी करें और उन्हें ईमेल कॉन्फ़िगरेशन पेज में पेस्ट करें।

![](https://static-docs.nocobase.com/mail-1733818630710.png)