:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

### समय अंतराल फ़ॉर्मेटिंग

#### 1. :formatI(patternOut, patternIn)

##### सिंटैक्स की व्याख्या
यह अवधि या अंतराल को फ़ॉर्मेट करता है। समर्थित आउटपुट फ़ॉर्मेट में शामिल हैं:
- `human+` या `human` (मानव-अनुकूल प्रदर्शन के लिए उपयुक्त)
- `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` जैसी इकाइयाँ (या उनके संक्षिप्त रूप)।

पैरामीटर:
- **patternOut:** आउटपुट फ़ॉर्मेट (उदाहरण के लिए, `'second'` या `'human+'`)।
- **patternIn:** वैकल्पिक, इनपुट इकाई (उदाहरण के लिए, `'milliseconds'` या `'s'`)।

##### उदाहरण
```
// उदाहरण वातावरण: API विकल्प { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Outputs 2
2000:formatI('seconds')      // Outputs 2
2000:formatI('s')            // Outputs 2
3600000:formatI('minute')    // Outputs 60
3600000:formatI('hour')      // Outputs 1
2419200000:formatI('days')   // Outputs 28

// फ़्रेंच उदाहरण:
2000:formatI('human')        // Outputs "quelques secondes"
2000:formatI('human+')       // Outputs "dans quelques secondes"
-2000:formatI('human+')      // Outputs "il y a quelques secondes"

// अंग्रेज़ी उदाहरण:
2000:formatI('human')        // Outputs "a few seconds"
2000:formatI('human+')       // Outputs "in a few seconds"
-2000:formatI('human+')      // Outputs "a few seconds ago"

// इकाई रूपांतरण उदाहरण:
60:formatI('ms', 'minute')   // Outputs 3600000
4:formatI('ms', 'weeks')      // Outputs 2419200000
'P1M':formatI('ms')          // Outputs 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Outputs 10296.085
```

##### परिणाम
आउटपुट परिणाम इनपुट मान और इकाई रूपांतरण के आधार पर संबंधित अवधि या अंतराल के रूप में प्रदर्शित होता है।