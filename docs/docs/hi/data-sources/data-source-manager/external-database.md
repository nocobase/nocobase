:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# बाहरी डेटाबेस

## परिचय
आप किसी मौजूदा बाहरी डेटाबेस को डेटा स्रोत के रूप में इस्तेमाल कर सकते हैं। वर्तमान में, MySQL, MariaDB, PostgreSQL, MSSQL और Oracle जैसे बाहरी डेटाबेस समर्थित हैं।

## उपयोग के निर्देश

### बाहरी डेटाबेस जोड़ना
प्लगइन को सक्रिय करने के बाद, आप डेटा स्रोत प्रबंधन में "नया जोड़ें" (Add new) ड्रॉपडाउन मेनू से इसे चुनकर जोड़ सकते हैं।

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

जिस डेटाबेस से आप कनेक्ट करना चाहते हैं, उसकी जानकारी भरें।

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### संग्रह का सिंक्रनाइज़ेशन
एक बाहरी डेटाबेस के साथ कनेक्शन स्थापित करने के बाद, डेटा स्रोत के भीतर के सभी संग्रह सीधे पढ़े जाएँगे। बाहरी डेटाबेस सीधे संग्रह जोड़ने या तालिका संरचना को संशोधित करने का समर्थन नहीं करते हैं। यदि संशोधनों की आवश्यकता है, तो आप उन्हें डेटाबेस क्लाइंट के माध्यम से कर सकते हैं और फिर सिंक्रनाइज़ करने के लिए इंटरफ़ेस में "रिफ्रेश" (Refresh) बटन पर क्लिक कर सकते हैं।

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### फ़ील्ड्स को कॉन्फ़िगर करना
बाहरी डेटाबेस मौजूदा संग्रह के फ़ील्ड्स को स्वचालित रूप से पढ़ेगा और प्रदर्शित करेगा। आप फ़ील्ड के शीर्षक, डेटा प्रकार (Field type) और UI प्रकार (Field interface) को तुरंत देख और कॉन्फ़िगर कर सकते हैं। अधिक कॉन्फ़िगरेशन को संशोधित करने के लिए आप "संपादित करें" (Edit) बटन पर भी क्लिक कर सकते हैं।

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

चूंकि बाहरी डेटाबेस तालिका संरचना को संशोधित करने का समर्थन नहीं करते हैं, इसलिए नया फ़ील्ड जोड़ते समय उपलब्ध एकमात्र प्रकार एसोसिएशन फ़ील्ड है। एसोसिएशन फ़ील्ड वास्तविक फ़ील्ड नहीं होते हैं, बल्कि संग्रह के बीच कनेक्शन स्थापित करने के लिए उपयोग किए जाते हैं।

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

अधिक जानकारी के लिए, [संग्रह फ़ील्ड्स/अवलोकन](/data-sources/data-modeling/collection-fields) अध्याय देखें।

### फ़ील्ड प्रकार मैपिंग
NocoBase स्वचालित रूप से बाहरी डेटाबेस से फ़ील्ड प्रकारों को संबंधित डेटा प्रकार (Field type) और UI प्रकार (Field Interface) से मैप करता है।

- डेटा प्रकार (Field type): यह परिभाषित करता है कि एक फ़ील्ड किस प्रकार, प्रारूप और संरचना का डेटा संग्रहीत कर सकता है।
- UI प्रकार (Field interface): यह उपयोगकर्ता इंटरफ़ेस में फ़ील्ड मानों को प्रदर्शित करने और इनपुट करने के लिए उपयोग किए जाने वाले नियंत्रण के प्रकार को संदर्भित करता है।

| PostgreSQL | MySQL/MariaDB | NocoBase डेटा प्रकार | NocoBase इंटरफ़ेस प्रकार |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### असमर्थित फ़ील्ड प्रकार
असमर्थित फ़ील्ड प्रकारों को अलग से प्रदर्शित किया जाता है। इन फ़ील्ड्स का उपयोग करने से पहले विकास अनुकूलन (development adaptation) की आवश्यकता होती है।

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### फ़िल्टर लक्ष्य कुंजी
ब्लॉक के रूप में प्रदर्शित होने वाले संग्रह में एक फ़िल्टर लक्ष्य कुंजी (Filter target key) कॉन्फ़िगर होनी चाहिए। फ़िल्टर लक्ष्य कुंजी का उपयोग किसी विशिष्ट फ़ील्ड के आधार पर डेटा को फ़िल्टर करने के लिए किया जाता है, और फ़ील्ड मान अद्वितीय होना चाहिए। डिफ़ॉल्ट रूप से, फ़िल्टर लक्ष्य कुंजी संग्रह का प्राथमिक कुंजी फ़ील्ड होता है। दृश्यों (views), प्राथमिक कुंजी रहित संग्रह, या संयुक्त प्राथमिक कुंजी वाले संग्रह के लिए, आपको एक कस्टम फ़िल्टर लक्ष्य कुंजी परिभाषित करनी होगी।

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

केवल वे संग्रह जिनमें फ़िल्टर लक्ष्य कुंजी कॉन्फ़िगर की गई है, उन्हें ही पेज में जोड़ा जा सकता है।

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)