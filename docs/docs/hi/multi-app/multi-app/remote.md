---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/multi-app/multi-app/remote) देखें।
:::

# बहु-पर्यावरण मोड

## परिचय

साझा मेमोरी मोड (shared-memory mode) के मल्टी-एप्लिकेशन परिनियोजन (deployment) और संचालन (operations) में स्पष्ट लाभ हैं, लेकिन जैसे-जैसे एप्लिकेशनों की संख्या और व्यावसायिक जटिलता बढ़ती है, एक एकल इंस्टेंस को धीरे-धीरे संसाधनों की प्रतिस्पर्धा और कम स्थिरता जैसी समस्याओं का सामना करना पड़ सकता है। ऐसी स्थितियों के लिए, उपयोगकर्ता अधिक जटिल व्यावसायिक आवश्यकताओं को पूरा करने के लिए बहु-पर्यावरण हाइब्रिड परिनियोजन (multi-environment hybrid deployment) समाधान अपना सकते हैं।

इस मोड के तहत, सिस्टम एक प्रवेश एप्लिकेशन (entry application) को एकीकृत प्रबंधन और शेड्यूलिंग केंद्र के रूप में तैनात करता है, और साथ ही वास्तविक व्यावसायिक एप्लिकेशनों को होस्ट करने के लिए स्वतंत्र एप्लिकेशन रनटाइम वातावरण के रूप में कई NocoBase इंस्टेंस तैनात करता है। प्रत्येक वातावरण एक-दूसरे से अलग होते हैं और मिलकर काम करते हैं, जिससे एकल इंस्टेंस के दबाव को प्रभावी ढंग से वितरित किया जाता है और सिस्टम की स्थिरता, स्केलेबिलिटी और फॉल्ट आइसोलेशन क्षमता में काफी सुधार होता है।

परिनियोजन स्तर पर, विभिन्न वातावरणों को स्वतंत्र प्रक्रियाओं (processes) में चलाया जा सकता है, अलग-अलग Docker कंटेनरों के रूप में तैनात किया जा सकता है, या कई Kubernetes Deployment के रूप में रखा जा सकता है, जो विभिन्न पैमानों और आर्किटेक्चर के बुनियादी ढांचे के वातावरण के लिए लचीले ढंग से अनुकूल हो सकते हैं।

## परिनियोजन

बहु-पर्यावरण हाइब्रिड परिनियोजन मोड में:

- **प्रवेश एप्लिकेशन (Supervisor)** एप्लिकेशनों और वातावरण की जानकारी के एकीकृत प्रबंधन के लिए जिम्मेदार है
- **वर्कर एप्लिकेशन (Worker)** वास्तविक व्यावसायिक रनटाइम वातावरण के रूप में कार्य करते हैं
- एप्लिकेशन और वातावरण कॉन्फ़िगरेशन को Redis के माध्यम से कैश किया जाता है
- प्रवेश एप्लिकेशन और वर्कर एप्लिकेशन के बीच निर्देश और स्थिति सिंक्रनाइज़ेशन Redis संचार पर निर्भर करता है

वर्तमान में वातावरण निर्माण (environment creation) की सुविधा प्रदान नहीं की गई है, प्रत्येक वर्कर एप्लिकेशन को मैन्युअल रूप से तैनात किया जाना चाहिए और संबंधित वातावरण जानकारी के साथ कॉन्फ़िगर किया जाना चाहिए ताकि उन्हें प्रवेश एप्लिकेशन द्वारा पहचाना जा सके।

### आर्किटेक्चर निर्भरताएँ

परिनियोजन से पहले कृपया निम्नलिखित सेवाएँ तैयार करें:

- **Redis**
  - एप्लिकेशन और वातावरण कॉन्फ़िगरेशन को कैश करता है
  - प्रवेश एप्लिकेशन और वर्कर एप्लिकेशन के बीच कमांड संचार चैनल के रूप में कार्य करता है

- **डेटाबेस (Database)**
  - डेटाबेस सेवाएँ जिनसे प्रवेश एप्लिकेशन और वर्कर एप्लिकेशन को कनेक्ट होना आवश्यक है

### प्रवेश एप्लिकेशन (Supervisor)

प्रवेश एप्लिकेशन एक एकीकृत प्रबंधन केंद्र के रूप में कार्य करता है, जो एप्लिकेशन निर्माण, शुरू करने, रोकने और वातावरण शेड्यूलिंग के साथ-साथ एप्लिकेशन एक्सेस प्रॉक्सी के लिए जिम्मेदार है।

प्रवेश एप्लिकेशन एनवायरनमेंट वेरिएबल कॉन्फ़िगरेशन विवरण:

```bash
# एप्लिकेशन मोड
APP_MODE=supervisor
# एप्लिकेशन डिस्कवरी एडॉप्टर
APP_DISCOVERY_ADAPTER=remote
# एप्लिकेशन प्रोसेस एडॉप्टर
APP_PROCESS_ADAPTER=remote
# एप्लिकेशन, वातावरण कॉन्फ़िगरेशन कैश redis
APP_SUPERVISOR_REDIS_URL=
# एप्लिकेशन कमांड संचार विधि
APP_COMMAND_ADPATER=redis
# एप्लिकेशन कमांड संचार redis
APP_COMMAND_REDIS_URL=
```

### वर्कर एप्लिकेशन (Worker)

वर्कर एप्लिकेशन वास्तविक व्यावसायिक रनटाइम वातावरण के रूप में कार्य करते हैं, जो विशिष्ट NocoBase एप्लिकेशन इंस्टेंस को होस्ट करने और चलाने के लिए जिम्मेदार होते हैं।

वर्कर एप्लिकेशन एनवायरनमेंट वेरिएबल कॉन्फ़िगरेशन विवरण:

```bash
# एप्लिकेशन मोड
APP_MODE=worker
# एप्लिकेशन डिस्कवरी एडॉप्टर
APP_DISCOVERY_ADAPTER=remote
# एप्लिकेशन प्रोसेस एडॉप्टर
APP_PROCESS_ADAPTER=local
# एप्लिकेशन, वातावरण कॉन्फ़िगरेशन कैश redis
APP_SUPERVISOR_REDIS_URL=
# एप्लिकेशन कमांड संचार विधि
APP_COMMAND_ADPATER=redis
# एप्लिकेशन कमांड संचार redis
APP_COMMAND_REDIS_URL=
# वातावरण पहचानकर्ता
ENVIRONMENT_NAME=
# वातावरण एक्सेस URL
ENVIRONMENT_URL=
# वातावरण प्रॉक्सी एक्सेस URL
ENVIRONMENT_PROXY_URL=
```

### Docker Compose उदाहरण

निम्नलिखित उदाहरण Docker कंटेनरों को रनटाइम यूनिट के रूप में उपयोग करने वाले बहु-पर्यावरण हाइब्रिड परिनियोजन समाधान को दिखाता है, जहाँ Docker Compose के माध्यम से एक प्रवेश एप्लिकेशन और दो वर्कर एप्लिकेशन एक साथ तैनात किए जाते हैं।

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## उपयोग नियमावली

एप्लिकेशन के बुनियादी प्रबंधन संचालन साझा मेमोरी मोड के समान ही हैं, कृपया [साझा मेमोरी मोड](./local.md) देखें। यह अनुभाग मुख्य रूप से बहु-पर्यावरण कॉन्फ़िगरेशन से संबंधित सामग्री का परिचय देता है।

### वातावरण सूची

परिनियोजन पूरा होने के बाद, प्रवेश एप्लिकेशन के "एप्लिकेशन सुपरवाइजर" (App Supervisor) पेज पर जाएँ, जहाँ आप "वातावरण" (Environments) टैब में पंजीकृत वर्कर वातावरणों की सूची देख सकते हैं। इसमें वातावरण पहचानकर्ता, वर्कर एप्लिकेशन संस्करण, एक्सेस URL और स्थिति जैसी जानकारी शामिल है। वातावरण की उपलब्धता सुनिश्चित करने के लिए वर्कर एप्लिकेशन हर 2 मिनट में एक हार्टबीट (heartbeat) रिपोर्ट करते हैं।

![](https://static-docs.nocobase.com/202512291830371.png)

### एप्लिकेशन बनाना

एप्लिकेशन बनाते समय, आप एक या अधिक रनटाइम वातावरण चुन सकते हैं, जो यह निर्दिष्ट करता है कि एप्लिकेशन किन वर्कर एप्लिकेशनों में तैनात किया जाएगा। आमतौर पर, एक ही वातावरण चुनने की सलाह दी जाती है। केवल तभी कई वातावरण चुनें जब वर्कर एप्लिकेशन में [सेवा विभाजन (service splitting)](/cluster-mode/services-splitting) किया गया हो और लोड बैलेंसिंग या क्षमता आइसोलेशन प्राप्त करने के लिए एक ही एप्लिकेशन को कई रनटाइम वातावरणों में तैनात करने की आवश्यकता हो।

![](https://static-docs.nocobase.com/202512291835086.png)

### एप्लिकेशन सूची

एप्लिकेशन सूची पेज प्रत्येक एप्लिकेशन के वर्तमान रनटाइम वातावरण और स्थिति की जानकारी प्रदर्शित करेगा। यदि कोई एप्लिकेशन कई वातावरणों में तैनात है, तो कई रनटाइम स्थितियाँ दिखाई देंगी। सामान्य परिस्थितियों में, विभिन्न वातावरणों में एक ही एप्लिकेशन एक समान स्थिति बनाए रखेगा और इसे एकीकृत तरीके से शुरू और बंद करने की आवश्यकता होती है।

![](https://static-docs.nocobase.com/202512291842216.png)

### एप्लिकेशन शुरू करना

चूंकि एप्लिकेशन शुरू होने पर डेटाबेस में इनिशियलाइजेशन डेटा लिख सकता है, इसलिए बहु-पर्यावरण स्थितियों में रेस कंडीशन (race conditions) से बचने के लिए, कई वातावरणों में तैनात एप्लिकेशनों को शुरू करते समय कतार (queue) में रखा जाएगा।

![](https://static-docs.nocobase.com/202512291841727.png)

### एप्लिकेशन एक्सेस प्रॉक्सी

वर्कर एप्लिकेशनों को प्रवेश एप्लिकेशन के सब-पाथ `/apps/:appName/admin` के माध्यम से प्रॉक्सी एक्सेस किया जा सकता है।

![](https://static-docs.nocobase.com/202601082154230.png)

यदि एप्लिकेशन कई वातावरणों में तैनात है, तो प्रॉक्सी एक्सेस के लिए एक लक्ष्य वातावरण निर्दिष्ट करना आवश्यक है।

![](https://static-docs.nocobase.com/202601082155146.png)

डिफ़ॉल्ट रूप से, प्रॉक्सी एक्सेस एड्रेस वर्कर एप्लिकेशन के एक्सेस एड्रेस का उपयोग करता है, जो एनवायरनमेंट वेरिएबल `ENVIRONMENT_URL` के अनुरूप होता है। सुनिश्चित करें कि यह एड्रेस उस नेटवर्क वातावरण में सुलभ है जहाँ प्रवेश एप्लिकेशन चल रहा है। यदि आपको एक अलग प्रॉक्सी एक्सेस एड्रेस का उपयोग करने की आवश्यकता है, तो इसे एनवायरनमेंट वेरिएबल `ENVIRONMENT_PROXY_URL` के माध्यम से ओवरराइड किया जा सकता है।