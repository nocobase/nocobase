:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## NocoBase में एक प्रमाणीकरणकर्ता जोड़ना

सबसे पहले, NocoBase में एक नया प्रमाणीकरणकर्ता जोड़ें: प्लगइन सेटिंग्स - उपयोगकर्ता प्रमाणीकरण - जोड़ें - OIDC.

कॉलबैक URL कॉपी करें.

![](https://static-docs.nocobase.com/202412021504114.png)

## एप्लिकेशन रजिस्टर करें

Microsoft Entra एडमिन सेंटर खोलें और एक नया एप्लिकेशन रजिस्टर करें.

![](https://static-docs.nocobase.com/202412021506837.png)

यहां वह कॉलबैक URL पेस्ट करें जिसे आपने अभी कॉपी किया है.

![](https://static-docs.nocobase.com/202412021520696.png)

## आवश्यक जानकारी प्राप्त करें और भरें

उस एप्लिकेशन पर क्लिक करें जिसे आपने अभी रजिस्टर किया है, और ओवरव्यू पेज से **एप्लिकेशन (क्लाइंट) ID** और **डायरेक्टरी (टेनेंट) ID** कॉपी करें.

![](https://static-docs.nocobase.com/202412021522063.png)

`Certificates & secrets` पर क्लिक करें, एक नया क्लाइंट सीक्रेट बनाएँ, और **वैल्यू** कॉपी करें.

![](https://static-docs.nocobase.com/202412021522846.png)

Microsoft Entra जानकारी और NocoBase प्रमाणीकरण कॉन्फ़िगरेशन के बीच का संबंध इस प्रकार है:

| Microsoft Entra जानकारी    | NocoBase प्रमाणीकरण फ़ील्ड                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| एप्लिकेशन (क्लाइंट) ID | क्लाइंट ID                                                                                                                                        |
| क्लाइंट सीक्रेट्स - वैल्यू  | क्लाइंट सीक्रेट                                                                                                                                    |
| डायरेक्टरी (टेनेंट) ID   | जारीकर्ता (Issuer):<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, `{tenant}` को डायरेक्टरी (टेनेंट) ID से बदलें |