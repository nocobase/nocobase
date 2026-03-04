:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/template-print/syntax/formatters/time-interval-formatting) देखें।
:::

### समय अंतराल फ़ॉर्मेटिंग

#### 1. :formatI(patternOut, patternIn)

##### सिंटैक्स विवरण
अवधि या अंतराल को फ़ॉर्मेट करें, समर्थित आउटपुट फ़ॉर्मेट में शामिल हैं:
- `human+`、`human` (मानवीय प्रदर्शन के लिए उपयुक्त)
- और `millisecond(s)`、`second(s)`、`minute(s)`、`hour(s)`、`year(s)`、`month(s)`、`week(s)`、`day(s)` जैसी इकाइयाँ (या उनके संक्षिप्त रूप)।

पैरामीटर:
- patternOut: आउटपुट फ़ॉर्मेट (उदाहरण के लिए `'second'`、`'human+'` आदि)
- patternIn: वैकल्पिक, इनपुट इकाई (उदाहरण के लिए `'milliseconds'`、`'s'` आदि)

##### उदाहरण
```
2000:formatI('second')       // आउटपुट 2
2000:formatI('seconds')      // आउटपुट 2
2000:formatI('s')            // आउटपुट 2
3600000:formatI('minute')    // आउटपुट 60
3600000:formatI('hour')      // आउटपुट 1
2419200000:formatI('days')   // आउटपुट 28

// मानवीय प्रदर्शन:
2000:formatI('human')        // आउटपुट "a few seconds"
2000:formatI('human+')       // आउटपुट "in a few seconds"
-2000:formatI('human+')      // आउटपुट "a few seconds ago"

// इकाई रूपांतरण उदाहरण:
60:formatI('ms', 'minute')   // आउटपुट 3600000
4:formatI('ms', 'weeks')      // आउटपुट 2419200000
'P1M':formatI('ms')          // आउटपुट 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // आउटपुट 10296.085
```

##### परिणाम
आउटपुट परिणाम इनपुट मान और इकाई रूपांतरण के आधार पर संबंधित अवधि या अंतराल के रूप में प्रदर्शित होता है।