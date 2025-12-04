---
pkg: '@nocobase/plugin-telemetry'
---
:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::


# टेलीमेट्री

## अवलोकन

NocoBase का टेलीमेट्री मॉड्यूल [OpenTelemetry](https://opentelemetry.io/) पर आधारित है, जो NocoBase एप्लिकेशनों के लिए एकीकृत और विस्तार योग्य अवलोकन क्षमताएँ प्रदान करता है। यह मॉड्यूल HTTP अनुरोधों और सिस्टम संसाधन उपयोग सहित विभिन्न एप्लिकेशन मेट्रिक्स को इकट्ठा करने और निर्यात करने में मदद करता है।

## पर्यावरण चर कॉन्फ़िगरेशन

टेलीमेट्री मॉड्यूल को सक्षम करने के लिए, आपको संबंधित [पर्यावरण चर](/get-started/installation/env#%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F) कॉन्फ़िगर करने होंगे।

### TELEMETRY_ENABLED

इसे `on` पर सेट करें।

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_SERVICE_NAME

सेवा का नाम।

```bash
TELEMETRY_SERVICE_NAME=nocobase
```

### TELEMETRY_METRIC_READER

मेट्रिक एक्सपोर्टर। कई एक्सपोर्टर समर्थित हैं और उन्हें अल्पविराम से अलग किया जाता है। उपलब्ध मानों के लिए मौजूदा एक्सपोर्टर के दस्तावेज़ देखें।

```bash
TELEMETRY_METRIC_READER=console,http,prometheus
```

### TELEMETRY_METRICS

निर्यात करने के लिए मेट्रिक्स, जिन्हें अल्पविराम से अलग किया गया है। उपलब्ध मान [मेट्रिक्स](#指标) में पाए जा सकते हैं।

```bash
TELEMETRY_METRICS=http_request_cost,process_cpu_percent,process_memory_mb,process_heap_mb,sub_app_status
```

### TELEMETRY_HTTP_RECORD_THRESHOLD

HTTP अनुरोध अवधि (`http_request_cost`) रिकॉर्ड करने की सीमा, मिलीसेकंड में। डिफ़ॉल्ट मान `0` है, जिसका अर्थ है कि सभी अनुरोध रिकॉर्ड किए जाते हैं। जब इसे `0` से अधिक मान पर सेट किया जाता है, तो केवल वे अनुरोध रिकॉर्ड किए जाएंगे जिनकी अवधि इस सीमा से अधिक है।

```bash
TELEMETRY_HTTP_RECORD_THRESHOLD=1000
```

## मेट्रिक्स

एप्लिकेशन द्वारा वर्तमान में रिकॉर्ड किए गए मेट्रिक्स नीचे सूचीबद्ध हैं। यदि आपको अतिरिक्त मेट्रिक्स की आवश्यकता है, तो आप विस्तार के लिए [डेवलपमेंट दस्तावेज़](/plugin-development/server/telemetry) देख सकते हैं या हमसे संपर्क कर सकते हैं।

| मेट्रिक नाम           | मेट्रिक प्रकार    | विवरण                                                                                             |
| :-------------------- | :---------------- | :------------------------------------------------------------------------------------------------ |
| `process_cpu_percent` | `ObservableGauge` | प्रोसेस CPU उपयोग प्रतिशत                                                                         |
| `process_memory_mb`   | `ObservableGauge` | प्रोसेस मेमोरी उपयोग MB में                                                                       |
| `process_heap_mb`     | `ObservableGauge` | प्रोसेस हीप मेमोरी उपयोग MB में                                                                   |
| `http_request_cost`   | `Histogram`       | HTTP अनुरोध अवधि ms में                                                                          |
| `http_request_count`  | `Counter`         | HTTP अनुरोधों की संख्या                                                                          |
| `http_request_active` | `UpDownCounter`   | वर्तमान में सक्रिय HTTP अनुरोधों की संख्या                                                        |
| `sub_app_status`      | `ObservableGauge` | स्थिति के अनुसार सब-एप्लिकेशन गणना के आँकड़े, जो `plugin-multi-app-manager` प्लगइन द्वारा रिपोर्ट किए जाते हैं |