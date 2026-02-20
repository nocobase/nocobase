---
pkg: '@nocobase/plugin-file-previewer-office'
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# Office फ़ाइल पूर्वावलोकन <Badge>v1.8.11+</Badge>

Office फ़ाइल पूर्वावलोकन प्लगइन का उपयोग NocoBase एप्लीकेशन में Office फ़ॉर्मेट की फ़ाइलों, जैसे Word, Excel, और PowerPoint, का पूर्वावलोकन करने के लिए किया जाता है।  
यह Microsoft की सार्वजनिक ऑनलाइन सेवा पर आधारित है, जो सार्वजनिक URL के माध्यम से एक्सेस की जा सकने वाली फ़ाइलों को पूर्वावलोकन इंटरफ़ेस में एम्बेड करती है, जिससे उपयोगकर्ता इन फ़ाइलों को डाउनलोड किए बिना या Office एप्लीकेशन का उपयोग किए बिना सीधे ब्राउज़र में देख सकते हैं।

## उपयोग मार्गदर्शिका

डिफ़ॉल्ट रूप से यह प्लगइन **अक्षम** (disabled) रहता है। इसे प्लगइन मैनेजर में सक्षम (enable) करने के बाद उपयोग किया जा सकता है, इसके लिए किसी अतिरिक्त कॉन्फ़िगरेशन की आवश्यकता नहीं है।

![प्लगइन सक्षम करने का इंटरफ़ेस](https://static-docs.nocobase.com/20250731140048.png)

डेटाटेबल के फ़ाइल फ़ील्ड में Office फ़ाइल (Word / Excel / PowerPoint) सफलतापूर्वक अपलोड करने के बाद, आप संबंधित फ़ाइल आइकन या लिंक पर क्लिक करके, पॉपअप या एम्बेडेड पूर्वावलोकन इंटरफ़ेस में फ़ाइल सामग्री देख सकते हैं।

![पूर्वावलोकन ऑपरेशन का उदाहरण](https://static-docs.nocobase.com/20250731143231.png)

## यह कैसे काम करता है

इस प्लगइन द्वारा एम्बेड किया गया पूर्वावलोकन Microsoft की सार्वजनिक ऑनलाइन सेवा (Office Web Viewer) पर निर्भर करता है। मुख्य प्रक्रिया इस प्रकार है:

- फ्रंटएंड उपयोगकर्ता द्वारा अपलोड की गई फ़ाइल के लिए एक सार्वजनिक रूप से एक्सेस करने योग्य URL बनाता है (जिसमें S3 हस्ताक्षरित URL भी शामिल हैं);
- प्लगइन एक iframe में फ़ाइल पूर्वावलोकन लोड करने के लिए निम्न पते का उपयोग करता है:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<public file URL>
  ```

- Microsoft सेवा उस URL से फ़ाइल सामग्री का अनुरोध करती है, उसे रेंडर करती है और एक देखने योग्य पृष्ठ वापस करती है।

## ध्यान दें

- चूंकि यह प्लगइन Microsoft की ऑनलाइन सेवा पर निर्भर करता है, इसलिए सुनिश्चित करें कि आपका नेटवर्क कनेक्शन स्थिर है और Microsoft की संबंधित सेवाएँ एक्सेस की जा सकती हैं।
- Microsoft आपके द्वारा प्रदान किए गए फ़ाइल URL को एक्सेस करेगा, और फ़ाइल सामग्री को उनके सर्वर पर पूर्वावलोकन पृष्ठ को रेंडर करने के लिए अस्थायी रूप से कैश किया जा सकता है। इसमें गोपनीयता का कुछ जोखिम है – यदि आपको इस बारे में चिंता है, तो संवेदनशील दस्तावेज़ों के लिए इस प्लगइन का उपयोग न करने की सलाह दी जाती है[^1]।
- पूर्वावलोकन के लिए आवश्यक फ़ाइलें सार्वजनिक रूप से एक्सेस करने योग्य URL के माध्यम से उपलब्ध होनी चाहिए। सामान्यतः, NocoBase पर अपलोड की गई फ़ाइलों के लिए सार्वजनिक एक्सेस लिंक स्वचालित रूप से जेनरेट हो जाते हैं (जिसमें S3-Pro प्लगइन द्वारा जेनरेट किए गए हस्ताक्षरित URL भी शामिल हैं)। हालांकि, यदि फ़ाइल पर एक्सेस अनुमतियाँ प्रतिबंधित हैं या वह आंतरिक नेटवर्क में संग्रहीत है, तो उसका पूर्वावलोकन नहीं किया जा सकता है[^2]।
- यह सेवा लॉगिन प्रमाणीकरण या निजी स्टोरेज संसाधनों का समर्थन नहीं करती। उदाहरण के लिए, जो फाइलें केवल आंतरिक नेटवर्क से ही एक्सेस हो सकती हैं या जिनके लिए लॉगिन आवश्यक है, उन्हें इस पूर्वावलोकन सुविधा के साथ उपयोग नहीं किया जा सकता।
- Microsoft द्वारा फ़ाइल प्राप्त करने के बाद, वह कुछ समय के लिए कैश में रह सकती है। भले ही मूल फ़ाइल हटा दी जाए, पूर्वावलोकन सामग्री थोड़े समय तक उपलब्ध रह सकती है।
- फ़ाइल आकार की अनुशंसित सीमाएँ हैं: Word और PowerPoint फाइलें 10MB से अधिक न हों, और Excel फाइलें 5MB से अधिक न हों, ताकि पूर्वावलोकन स्थिर रहे[^3]।
- इस सेवा के व्यावसायिक उपयोग के लिए कोई आधिकारिक स्पष्ट बयान उपलब्ध नहीं है। उपयोग से पहले जोखिमों का आकलन करें[^4]।

## समर्थित फ़ाइल प्रकार

यह प्लगइन केवल निम्न Office फ़ाइल फ़ॉर्मेट का पूर्वावलोकन सपोर्ट करता है, और यह फ़ाइल के MIME प्रकार या फ़ाइल एक्सटेंशन पर आधारित है:

- Word दस्तावेज़:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) या `application/msword` (`.doc`)
- Excel स्प्रेडशीट:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) या `application/vnd.ms-excel` (`.xls`)
- PowerPoint प्रस्तुति:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) या `application/vnd.ms-powerpoint` (`.ppt`)
- OpenDocument टेक्स्ट:
  `application/vnd.oasis.opendocument.text` (`.odt`)

अन्य फ़ॉर्मेट की फ़ाइलों के लिए यह प्लगइन पूर्वावलोकन सक्षम नहीं करेगा।

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)
