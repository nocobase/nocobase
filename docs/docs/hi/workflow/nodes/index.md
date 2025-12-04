:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# अवलोकन
एक वर्कफ़्लो आमतौर पर कई जुड़े हुए कार्य चरणों से मिलकर बना होता है। प्रत्येक नोड इनमें से एक चरण को दर्शाता है और प्रक्रिया में एक बुनियादी तार्किक इकाई के रूप में कार्य करता है। ठीक वैसे ही जैसे प्रोग्रामिंग भाषा में, विभिन्न प्रकार के नोड अलग-अलग निर्देशों का प्रतिनिधित्व करते हैं, जो नोड के व्यवहार को निर्धारित करते हैं। जब वर्कफ़्लो चलता है, तो सिस्टम क्रमिक रूप से प्रत्येक नोड में प्रवेश करता है और उसके निर्देशों को निष्पादित करता है।

:::info{title=नोट}
एक वर्कफ़्लो का ट्रिगर नोड नहीं होता है। इसे केवल फ़्लोचार्ट में एक एंट्री पॉइंट के रूप में प्रदर्शित किया जाता है, लेकिन यह नोड से एक अलग अवधारणा है। विवरण के लिए, कृपया [ट्रिगर](../triggers/index.md) की सामग्री देखें।
:::

कार्यात्मक दृष्टिकोण से, वर्तमान में कार्यान्वित नोड्स को कई प्रमुख श्रेणियों में विभाजित किया जा सकता है (कुल 29 प्रकार के नोड्स):

- आर्टिफिशियल इंटेलिजेंस
  - [बड़ा भाषा मॉडल](../../ai-employees/workflow/nodes/llm/chat.md) (प्लगइन @nocobase/plugin-workflow-llm द्वारा प्रदान किया गया)
- प्रवाह नियंत्रण
  - [शर्त](./condition.md)
  - [बहु-शर्तें](./multi-conditions.md)
  - [लूप](./loop.md) (प्लगइन @nocobase/plugin-workflow-loop द्वारा प्रदान किया गया)
  - [वेरिएबल](./variable.md) (प्लगइन @nocobase/plugin-workflow-variable द्वारा प्रदान किया गया)
  - [समानांतर शाखा](./parallel.md) (प्लगइन @nocobase/plugin-workflow-parallel द्वारा प्रदान किया गया)
  - [वर्कफ़्लो इनवोक करें](./subflow.md) (प्लगइन @nocobase/plugin-workflow-subflow द्वारा प्रदान किया गया)
  - [वर्कफ़्लो आउटपुट](./output.md) (प्लगइन @nocobase/plugin-workflow-subflow द्वारा प्रदान किया गया)
  - [JSON वेरिएबल मैपिंग](./json-variable-mapping.md) (प्लगइन @nocobase/plugin-workflow-json-variable-mapping द्वारा प्रदान किया गया)
  - [विलंब](./delay.md) (प्लगइन @nocobase/plugin-workflow-delay द्वारा प्रदान किया गया)
  - [वर्कफ़्लो समाप्त करें](./end.md)
- गणना
  - [गणना](./calculation.md)
  - [दिनांक गणना](./date-calculation.md) (प्लगइन @nocobase/plugin-workflow-date-calculation द्वारा प्रदान किया गया)
  - [JSON गणना](./json-query.md) (प्लगइन @nocobase/plugin-workflow-json-query द्वारा प्रदान किया गया)
- संग्रह क्रियाएँ
  - [डेटा बनाएँ](./create.md)
  - [डेटा अपडेट करें](./update.md)
  - [डेटा हटाएँ](./destroy.md)
  - [डेटा क्वेरी करें](./query.md)
  - [एग्रीगेट क्वेरी](./aggregate.md) (प्लगइन @nocobase/plugin-workflow-aggregate द्वारा प्रदान किया गया)
  - [SQL क्रिया](./sql.md) (प्लगइन @nocobase/plugin-workflow-sql द्वारा प्रदान किया गया)
- मैन्युअल हैंडलिंग
  - [मैन्युअल हैंडलिंग](./manual.md) (प्लगइन @nocobase/plugin-workflow-manual द्वारा प्रदान किया गया)
  - [अनुमोदन](./approval.md) (प्लगइन @nocobase/plugin-workflow-approval द्वारा प्रदान किया गया)
  - [CC](./cc.md) (प्लगइन @nocobase/plugin-workflow-cc द्वारा प्रदान किया गया)
- अन्य एक्सटेंशन
  - [HTTP अनुरोध](./request.md) (प्लगइन @nocobase/plugin-workflow-request द्वारा प्रदान किया गया)
  - [जावास्क्रिप्ट](./javascript.md) (प्लगइन @nocobase/plugin-workflow-javascript द्वारा प्रदान किया गया)
  - [ईमेल भेजें](./mailer.md) (प्लगइन @nocobase/plugin-workflow-mailer द्वारा प्रदान किया गया)
  - [सूचना](../../notification-manager/index.md#वर्कफ़्लो सूचना नोड) (प्लगइन @nocobase/plugin-workflow-notification द्वारा प्रदान किया गया)
  - [रिस्पॉन्स](./response.md) (प्लगइन @nocobase/plugin-workflow-webhook द्वारा प्रदान किया गया)
  - [रिस्पॉन्स मैसेज](./response-message.md) (प्लगइन @nocobase/plugin-workflow-response-message द्वारा प्रदान किया गया)