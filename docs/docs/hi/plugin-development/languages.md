:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# भाषा सूची

NocoBase बहु-भाषा समर्थन (i18n) प्रदान करता है। नीचे वर्तमान में अंतर्निहित भाषाओं की सूची दी गई है। प्रत्येक भाषा कॉन्फ़िगरेशन में एक **भाषा कोड (Locale Code)** और एक **प्रदर्शित नाम (Label)** शामिल होता है।

## भाषा कोड मानक

* भाषा कोड **[IETF BCP 47](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)** मानक प्रारूप का पालन करते हैं:

  ```
  language[-script][-region][-variant]
  ```

  सामान्य रूप से यह `language-region` होता है, उदाहरण के लिए:

  * `en-US` → अंग्रेज़ी (संयुक्त राज्य अमेरिका)
  * `fr-FR` → फ़्रेंच (फ़्रांस)
  * `zh-CN` → सरलीकृत चीनी

* **केस-संवेदी**:

  * भाषा वाला भाग छोटे अक्षरों में होता है (`en`, `fr`, `zh`)
  * क्षेत्र वाला भाग बड़े अक्षरों में होता है (`US`, `FR`, `CN`)

* एक ही भाषा के कई क्षेत्रीय संस्करण हो सकते हैं, उदाहरण के लिए:

  * `fr-FR` (फ़्रेंच फ़्रांसीसी), `fr-CA` (कनाडाई फ़्रांसीसी)

## अंतर्निहित भाषाएँ

| भाषा कोड  | प्रदर्शित नाम                 |
| ----- | -------------------- |
| ar-EG | العربية              |
| az-AZ | Azərbaycan dili      |
| bg-BG | Български            |
| bn-BD | Bengali              |
| by-BY | Беларускі            |
| ca-ES | Сatalà/Espanya       |
| cs-CZ | Česky                |
| da-DK | Dansk                |
| de-DE | Deutsch              |
| el-GR | Ελληνικά             |
| en-GB | English(GB)          |
| en-US | English              |
| es-ES | Español              |
| et-EE | Estonian (Eesti)     |
| fa-IR | فارسی                |
| fi-FI | Suomi                |
| fr-BE | Français(BE)         |
| fr-CA | Français(CA)         |
| fr-FR | Français             |
| ga-IE | Gaeilge              |
| gl-ES | Galego               |
| he-IL | עברית                |
| hi-IN | हिन्दी               |
| hr-HR | Hrvatski jezik       |
| hu-HU | Magyar               |
| hy-AM | Հայերեն              |
| id-ID | Bahasa Indonesia     |
| is-IS | Íslenska             |
| it-IT | Italiano             |
| ja-JP | 日本語                  |
| ka-GE | ქართული              |
| kk-KZ | Қазақ тілі           |
| km-KH | ភាសាខ្មែរ            |
| kn-IN | ಕನ್ನಡ                |
| ko-KR | 한국어                  |
| ku-IQ | کوردی                |
| lt-LT | lietuvių             |
| lv-LV | Latviešu valoda      |
| mk-MK | македонски јазик     |
| ml-IN | മലയാളം               |
| mn-MN | Монгол хэл           |
| ms-MY | بهاس ملايو           |
| nb-NO | Norsk bokmål         |
| ne-NP | नेपाली               |
| nl-BE | Vlaams               |
| nl-NL | Nederlands           |
| pl-PL | Polski               |
| pt-BR | Português brasileiro |
| pt-PT | Português            |
| ro-RO | România              |
| ru-RU | Русский              |
| si-LK | සිංහල                |
| sk-SK | Slovenčina           |
| sl-SI | Slovenščina          |
| sr-RS | српски језик         |
| sv-SE | Svenska              |
| ta-IN | Tamil                |
| th-TH | ภาษาไทย              |
| tk-TK | Turkmen              |
| tr-TR | Türkçe               |
| uk-UA | Українська           |
| ur-PK | Oʻzbekcha            |
| vi-VN | Tiếng Việt           |
| zh-CN | सरलीकृत चीनी                 |
| zh-HK | पारंपरिक चीनी (हांगकांग)             |
| zh-TW | पारंपरिक चीनी (ताइवान)             |

## उपयोग निर्देश

* भाषा कॉन्फ़िगरेशन का उपयोग आमतौर पर इनके लिए किया जाता है:

  * **इंटरफ़ेस प्रदर्शन**: भाषा स्विचिंग मेनू में `label` प्रदर्शित करने के लिए।
  * **अंतर्राष्ट्रीयकरण फ़ाइल लोडिंग**: `भाषा कोड` के आधार पर संबंधित अनुवाद JSON फ़ाइलों को लोड करने के लिए।

* नई भाषा जोड़ते समय, आपको ये करना होगा:

  1. भाषा कोड को परिभाषित करने के लिए BCP 47 मानक का पालन करें;
  2. `label` के रूप में एक स्पष्ट स्थानीयकृत नाम प्रदान करें;
  3. संबंधित अनुवाद फ़ाइलें प्रदान करें।