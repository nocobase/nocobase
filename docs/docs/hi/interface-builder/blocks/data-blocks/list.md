---
pkg: "@nocobase/plugin-block-list"
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# सूची ब्लॉक

## परिचय

सूची ब्लॉक डेटा को सूची के रूप में दिखाता है। यह कार्य सूचियों, समाचारों और उत्पाद जानकारी जैसे डेटा प्रदर्शित करने के लिए उपयुक्त है।

## ब्लॉक कॉन्फ़िगरेशन

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### डेटा स्कोप सेट करें

जैसा कि दिखाया गया है: "रद्द" स्थिति वाले ऑर्डर को फ़िल्टर करें।

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

अधिक जानकारी के लिए, [डेटा स्कोप सेट करें](/interface-builder/blocks/block-settings/data-scope) देखें।

### सॉर्टिंग नियम सेट करें

जैसा कि दिखाया गया है: ऑर्डर राशि के अनुसार अवरोही क्रम में सॉर्ट करें।

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

अधिक जानकारी के लिए, [सॉर्टिंग नियम सेट करें](/interface-builder/blocks/block-settings/sorting-rule) देखें।

## फ़ील्ड कॉन्फ़िगर करें

### इस संग्रह के फ़ील्ड

> **ध्यान दें**: इनहेरिट किए गए संग्रहों (यानी, पैरेंट संग्रहों) के फ़ील्ड स्वचालित रूप से मर्ज हो जाते हैं और वर्तमान फ़ील्ड सूची में प्रदर्शित होते हैं।

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### संबंधित संग्रहों के फ़ील्ड

> **ध्यान दें**: संबंधित संग्रहों के फ़ील्ड प्रदर्शित किए जा सकते हैं (वर्तमान में केवल 'वन-टू-वन' संबंध समर्थित हैं)।

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

सूची फ़ील्ड कॉन्फ़िगरेशन के लिए, [विवरण फ़ील्ड](/interface-builder/fields/generic/detail-form-item) देखें।

## क्रियाएँ कॉन्फ़िगर करें

### वैश्विक क्रियाएँ

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [फ़िल्टर करें](/interface-builder/actions/types/filter)
- [जोड़ें](/interface-builder/actions/types/add-new)
- [हटाएँ](/interface-builder/actions/types/delete)
- [रिफ्रेश करें](/interface-builder/actions/types/refresh)
- [इंपोर्ट करें](/interface-builder/actions/types/import)
- [एक्सपोर्ट करें](/interface-builder/actions/types/export)
- [टेम्पलेट प्रिंट](/template-print/index)
- [बल्क अपडेट](/interface-builder/actions/types/bulk-update)
- [अटैचमेंट एक्सपोर्ट करें](/interface-builder/actions/types/export-attachments)
- [वर्कफ़्लो ट्रिगर करें](/interface-builder/actions/types/trigger-workflow)
- [JS क्रिया](/interface-builder/actions/types/js-action)
- [AI कर्मचारी](/interface-builder/actions/types/ai-employee)

### पंक्ति क्रियाएँ

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [संपादित करें](/interface-builder/actions/types/edit)
- [हटाएँ](/interface-builder/actions/types/delete)
- [लिंक करें](/interface-builder/actions/types/link)
- [पॉप-अप](/interface-builder/actions/types/pop-up)
- [रिकॉर्ड अपडेट करें](/interface-builder/actions/types/update-record)
- [टेम्पलेट प्रिंट](/template-print/index)
- [वर्कफ़्लो ट्रिगर करें](/interface-builder/actions/types/trigger-workflow)
- [JS क्रिया](/interface-builder/actions/types/js-action)
- [AI कर्मचारी](/interface-builder/actions/types/ai-employee)