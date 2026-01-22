---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# गूगल कॉन्फ़िगरेशन

### पूर्व-आवश्यकताएँ

उपयोगकर्ताओं को NocoBase में अपने Google मेल खातों को जोड़ने में सक्षम बनाने के लिए, इसे ऐसे सर्वर पर डिप्लॉय किया जाना चाहिए जो Google सेवाओं तक पहुँच सकता हो, क्योंकि बैकएंड Google API को कॉल करेगा।
    
### एक खाता रजिस्टर करें

1. Google Cloud पर जाने के लिए https://console.cloud.google.com/welcome खोलें।
2. पहली बार विज़िट करने पर आपको नियमों और शर्तों से सहमत होना होगा।
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### एक ऐप बनाएँ

1. ऊपर "Select a project" पर क्लिक करें।
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. पॉप-अप में "NEW PROJECT" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. प्रोजेक्ट की जानकारी भरें।
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. प्रोजेक्ट बनने के बाद उसे चुनें।

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Gmail API सक्षम करें

1. "APIs & Services" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. APIs & Services डैशबोर्ड पर जाएँ।

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. "mail" खोजें।

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Gmail API को सक्षम करने के लिए "ENABLE" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### OAuth सहमति स्क्रीन कॉन्फ़िगर करें

1. बाईं ओर "OAuth consent screen" मेनू पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. "External" चुनें।

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. प्रोजेक्ट की जानकारी भरें (यह प्राधिकरण पेज पर दिखाई देगी) और सेव पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. डेवलपर संपर्क जानकारी भरें और जारी रखें पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. जारी रखें पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. ऐप प्रकाशित होने से पहले परीक्षण के लिए टेस्ट उपयोगकर्ता जोड़ें।

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. जारी रखें पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. सारांश जानकारी की समीक्षा करें और डैशबोर्ड पर वापस जाएँ।

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### क्रेडेंशियल बनाएँ

1. बाईं ओर "Credentials" मेनू पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. "CREATE CREDENTIALS" बटन पर क्लिक करें और "OAuth client ID" चुनें।

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. "Web application" चुनें।

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. एप्लिकेशन की जानकारी भरें।

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. प्रोजेक्ट का अंतिम डिप्लॉयमेंट डोमेन दर्ज करें (यहाँ उदाहरण NocoBase का एक परीक्षण पता है)।

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. अधिकृत रीडायरेक्ट URI जोड़ें। यह `डोमेन + "/admin/settings/mail/oauth2"` होना चाहिए। उदाहरण के लिए: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. OAuth जानकारी देखने के लिए क्रिएट पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Client ID और Client secret को कॉपी करें और उन्हें ईमेल कॉन्फ़िगरेशन पेज में भरें।

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. कॉन्फ़िगरेशन पूरा करने के लिए सेव पर क्लिक करें।

### ऐप प्रकाशित करें

उपरोक्त प्रक्रिया पूरी करने और टेस्ट उपयोगकर्ता प्राधिकरण लॉगिन तथा ईमेल भेजने जैसी सुविधाओं का परीक्षण करने के बाद, आप ऐप को प्रकाशित कर सकते हैं।

1. "OAuth consent screen" मेनू पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. "EDIT APP" बटन पर क्लिक करें, फिर नीचे "SAVE AND CONTINUE" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. उपयोगकर्ता अनुमति स्कोप चुनने के लिए "ADD OR REMOVE SCOPES" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. "Gmail API" खोजें, फिर "Gmail API" को चेक करें (पुष्टि करें कि स्कोप मान "https://mail.google.com/" वाला Gmail API है)।

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. सेव करने के लिए नीचे "UPDATE" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. प्रत्येक पेज के नीचे "SAVE AND CONTINUE" बटन पर क्लिक करें, और अंत में डैशबोर्ड पेज पर वापस जाने के लिए "BACK TO DASHBOARD" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. "PUBLISH APP" बटन पर क्लिक करें। एक पुष्टिकरण पेज दिखाई देगा, जिसमें प्रकाशन के लिए आवश्यक जानकारी सूचीबद्ध होगी। फिर "CONFIRM" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. कंसोल पेज पर वापस जाएँ, और आप देखेंगे कि प्रकाशन स्थिति "In production" है।

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. "PREPARE FOR VERIFICATION" बटन पर क्लिक करें, आवश्यक जानकारी भरें, और "SAVE AND CONTINUE" बटन पर क्लिक करें (छवि में दिया गया डेटा केवल प्रदर्शन उद्देश्यों के लिए है)।

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. आवश्यक जानकारी भरना जारी रखें (छवि में दिया गया डेटा केवल प्रदर्शन उद्देश्यों के लिए है)।

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. "SAVE AND CONTINUE" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. सत्यापन के लिए सबमिट करने हेतु "SUBMIT FOR VERIFICATION" बटन पर क्लिक करें।

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. अनुमोदन परिणाम की प्रतीक्षा करें।

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. यदि अनुमोदन अभी भी लंबित है, तो उपयोगकर्ता अधिकृत करने और लॉग इन करने के लिए असुरक्षित लिंक पर क्लिक कर सकते हैं।

![](https://static-docs.nocobase.com/mail-1735633689645.png)