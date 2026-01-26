:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

## शर्त आधारित कथन

शर्त आधारित कथन आपको डेटा मानों के आधार पर दस्तावेज़ में सामग्री के प्रदर्शन या छिपाने को गतिशील रूप से नियंत्रित करने की अनुमति देते हैं। शर्तें लिखने के तीन मुख्य तरीके दिए गए हैं:

- **इनलाइन शर्तें**: सीधे टेक्स्ट आउटपुट करती हैं (या इसे अन्य टेक्स्ट से बदल देती हैं)।
- **शर्त आधारित ब्लॉक**: दस्तावेज़ के एक खंड को दिखाते या छिपाते हैं, जो कई टैग, पैराग्राफ, तालिकाओं आदि के लिए उपयुक्त है।
- **स्मार्ट शर्तें**: एक ही टैग के साथ लक्ष्य तत्वों (जैसे पंक्तियों, पैराग्राफों, चित्रों आदि) को सीधे हटाती या रखती हैं, जिससे सिंटैक्स अधिक संक्षिप्त हो जाता है।

सभी शर्तें एक लॉजिकल मूल्यांकन फ़ॉर्मेटर (जैसे ifEQ, ifGT आदि) से शुरू होती हैं, जिसके बाद एक्शन फ़ॉर्मेटर (जैसे show, elseShow, drop, keep आदि) आते हैं।

### अवलोकन

शर्त आधारित कथनों में समर्थित लॉजिकल ऑपरेटर और एक्शन फ़ॉर्मेटर में शामिल हैं:

- **लॉजिकल ऑपरेटर**
  - **ifEQ(value)**: जाँचता है कि डेटा निर्दिष्ट मान के बराबर है या नहीं।
  - **ifNE(value)**: जाँचता है कि डेटा निर्दिष्ट मान के बराबर नहीं है या नहीं।
  - **ifGT(value)**: जाँचता है कि डेटा निर्दिष्ट मान से बड़ा है या नहीं।
  - **ifGTE(value)**: जाँचता है कि डेटा निर्दिष्ट मान से बड़ा या उसके बराबर है या नहीं।
  - **ifLT(value)**: जाँचता है कि डेटा निर्दिष्ट मान से छोटा है या नहीं।
  - **ifLTE(value)**: जाँचता है कि डेटा निर्दिष्ट मान से छोटा या उसके बराबर है या नहीं।
  - **ifIN(value)**: जाँचता है कि डेटा किसी ऐरे या स्ट्रिंग में शामिल है या नहीं।
  - **ifNIN(value)**: जाँचता है कि डेटा किसी ऐरे या स्ट्रिंग में शामिल नहीं है या नहीं।
  - **ifEM()**: जाँचता है कि डेटा खाली है या नहीं (जैसे `null`, `undefined`, एक खाली स्ट्रिंग, एक खाली ऐरे, या एक खाली ऑब्जेक्ट)।
  - **ifNEM()**: जाँचता है कि डेटा खाली नहीं है या नहीं।
  - **ifTE(type)**: जाँचता है कि डेटा का प्रकार निर्दिष्ट प्रकार (उदाहरण के लिए, "string", "number", "boolean" आदि) के बराबर है या नहीं।
  - **and(value)**: लॉजिकल "और", जिसका उपयोग कई शर्तों को जोड़ने के लिए किया जाता है।
  - **or(value)**: लॉजिकल "या", जिसका उपयोग कई शर्तों को जोड़ने के लिए किया जाता है।

- **एक्शन फ़ॉर्मेटर**
  - **:show(text) / :elseShow(text)**: इनलाइन शर्तों में निर्दिष्ट टेक्स्ट को सीधे आउटपुट करने के लिए उपयोग किया जाता है।
  - **:hideBegin / :hideEnd** और **:showBegin / :showEnd**: दस्तावेज़ के खंडों को छिपाने या दिखाने के लिए शर्त आधारित ब्लॉक में उपयोग किया जाता है।
  - **:drop(element) / :keep(element)**: निर्दिष्ट दस्तावेज़ तत्वों को हटाने या रखने के लिए स्मार्ट शर्तों में उपयोग किया जाता है।

अगले खंड प्रत्येक उपयोग के लिए विस्तृत सिंटैक्स, उदाहरण और परिणाम प्रस्तुत करते हैं।

### इनलाइन शर्तें

#### 1. :show(text) / :elseShow(text)

##### सिंटैक्स
```
{data:condition:show(text)}
{data:condition:show(text):elseShow(alternative text)}
```

##### उदाहरण
मान लीजिए डेटा है:
```json
{
  "val2": 2,
  "val5": 5
}
```
टेम्पलेट इस प्रकार है:
```
val2 = {d.val2:ifGT(3):show('high')}
val2 = {d.val2:ifGT(3):show('high'):elseShow('low')}
val5 = {d.val5:ifGT(3):show('high')}
```

##### परिणाम
```
val2 = 2
val2 = low
val5 = high
```

#### 2. स्विच केस (कई शर्त आधारित कथन)

##### सिंटैक्स
स्विच-केस के समान संरचना बनाने के लिए लगातार शर्त फ़ॉर्मेटर का उपयोग करें:
```
{data:ifEQ(value1):show(result1):ifEQ(value2):show(result2):elseShow(default result)}
```
या `or` ऑपरेटर के साथ इसे प्राप्त करें:
```
{data:ifEQ(value1):show(result1):or(data):ifEQ(value2):show(result2):elseShow(default result)}
```

##### उदाहरण
डेटा:
```json
{
  "val1": 1,
  "val2": 2,
  "val3": 3
}
```
टेम्पलेट:
```
val1 = {d.val1:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val2 = {d.val2:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
val3 = {d.val3:ifEQ(1):show(A):ifEQ(2):show(B):elseShow(C)}
```

##### परिणाम
```
val1 = A
val2 = B
val3 = C
```

#### 3. बहु-चर शर्त आधारित कथन

##### सिंटैक्स
कई चरों का परीक्षण करने के लिए लॉजिकल ऑपरेटर `and`/`or` का उपयोग करें:
```
{data1:ifEQ(condition1):and(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
{data1:ifEQ(condition1):or(.data2):ifEQ(condition2):show(result):elseShow(alternative result)}
```

##### उदाहरण
डेटा:
```json
{
  "val2": 2,
  "val5": 5
}
```
टेम्पलेट:
```
and = {d.val2:ifEQ(1):and(.val5):ifEQ(5):show(OK):elseShow(KO)}
or = {d.val2:ifEQ(1):or(.val5):ifEQ(5):show(OK):elseShow(KO)}
```

##### परिणाम
```
and = KO
or = OK
```

### लॉजिकल ऑपरेटर और फ़ॉर्मेटर

निम्नलिखित खंडों में, वर्णित फ़ॉर्मेटर इनलाइन शर्त सिंटैक्स का उपयोग करते हैं, जिसका प्रारूप इस प्रकार है:
```
{data:formatter(parameter):show(text):elseShow(alternative text)}
```

#### 1. :and(value)

##### सिंटैक्स
```
{data:ifEQ(value):and(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
{d.car:ifEQ('delorean'):and(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### परिणाम
यदि `d.car` `'delorean'` के बराबर है और `d.speed` 80 से अधिक है, तो आउटपुट `TravelInTime` होगा; अन्यथा, आउटपुट `StayHere` होगा।

#### 2. :or(value)

##### सिंटैक्स
```
{data:ifEQ(value):or(new data or condition):ifGT(another value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
{d.car:ifEQ('delorean'):or(.speed):ifGT(80):show('TravelInTime'):elseShow('StayHere')}
```

##### परिणाम
यदि `d.car` `'delorean'` के बराबर है या `d.speed` 80 से अधिक है, तो आउटपुट `TravelInTime` होगा; अन्यथा, आउटपुट `StayHere` होगा।

#### 3. :ifEM()

##### सिंटैक्स
```
{data:ifEM():show(text):elseShow(alternative text)}
```

##### उदाहरण
```
null:ifEM():show('Result true'):elseShow('Result false')
[]:ifEM():show('Result true'):elseShow('Result false')
```

##### परिणाम
`null` या एक खाली ऐरे के लिए, आउटपुट `Result true` होगा; अन्यथा, यह `Result false` होगा।

#### 4. :ifNEM()

##### सिंटैक्स
```
{data:ifNEM():show(text):elseShow(alternative text)}
```

##### उदाहरण
```
0:ifNEM():show('Result true'):elseShow('Result false')
'homer':ifNEM():show('Result true'):elseShow('Result false')
```

##### परिणाम
गैर-खाली डेटा (जैसे संख्या 0 या स्ट्रिंग 'homer') के लिए, आउटपुट `Result true` होगा; खाली डेटा के लिए, आउटपुट `Result false` होगा।

#### 5. :ifEQ(value)

##### सिंटैक्स
```
{data:ifEQ(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
100:ifEQ(100):show('Result true'):elseShow('Result false')
'homer':ifEQ('homer'):show('Result true'):elseShow('Result false')
```

##### परिणाम
यदि डेटा निर्दिष्ट मान के बराबर है, तो आउटपुट `Result true` होगा; अन्यथा, यह `Result false` होगा।

#### 6. :ifNE(value)

##### सिंटैक्स
```
{data:ifNE(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
100:ifNE(100):show('Result true'):elseShow('Result false')
100:ifNE(101):show('Result true'):elseShow('Result false')
```

##### परिणाम
पहला उदाहरण `Result false` आउटपुट करता है, जबकि दूसरा उदाहरण `Result true` आउटपुट करता है।

#### 7. :ifGT(value)

##### सिंटैक्स
```
{data:ifGT(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
1234:ifGT(1):show('Result true'):elseShow('Result false')
-23:ifGT(19):show('Result true'):elseShow('Result false')
```

##### परिणाम
पहला उदाहरण `Result true` आउटपुट करता है, और दूसरा `Result false` आउटपुट करता है।

#### 8. :ifGTE(value)

##### सिंटैक्स
```
{data:ifGTE(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
50:ifGTE(-29):show('Result true'):elseShow('Result false')
1:ifGTE(768):show('Result true'):elseShow('Result false')
```

##### परिणाम
पहला उदाहरण `Result true` आउटपुट करता है, जबकि दूसरा `Result false` आउटपुट करता है।

#### 9. :ifLT(value)

##### सिंटैक्स
```
{data:ifLT(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
-23:ifLT(19):show('Result true'):elseShow('Result false')
1290:ifLT(768):show('Result true'):elseShow('Result false')
```

##### परिणाम
पहला उदाहरण `Result true` आउटपुट करता है, और दूसरा `Result false` आउटपुट करता है।

#### 10. :ifLTE(value)

##### सिंटैक्स
```
{data:ifLTE(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
5:ifLTE(5):show('Result true'):elseShow('Result false')
1290:ifLTE(768):show('Result true'):elseShow('Result false')
```

##### परिणाम
पहला उदाहरण `Result true` आउटपुट करता है, और दूसरा `Result false` आउटपुट करता है।

#### 11. :ifIN(value)

##### सिंटैक्स
```
{data:ifIN(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
'car is broken':ifIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifIN(2):show('Result true'):elseShow('Result false')
```

##### परिणाम
दोनों उदाहरण `Result true` आउटपुट करते हैं (क्योंकि स्ट्रिंग में 'is' शामिल है, और ऐरे में 2 शामिल है)।

#### 12. :ifNIN(value)

##### सिंटैक्स
```
{data:ifNIN(value):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
'car is broken':ifNIN('is'):show('Result true'):elseShow('Result false')
[1,2,'toto']:ifNIN(2):show('Result true'):elseShow('Result false')
```

##### परिणाम
पहला उदाहरण `Result false` आउटपुट करता है (क्योंकि स्ट्रिंग में 'is' शामिल है), और दूसरा उदाहरण `Result false` आउटपुट करता है (क्योंकि ऐरे में 2 शामिल है)।

#### 13. :ifTE(type)

##### सिंटैक्स
```
{data:ifTE('type'):show(text):elseShow(alternative text)}
```

##### उदाहरण
```
'homer':ifTE('string'):show('Result true'):elseShow('Result false')
10.5:ifTE('number'):show('Result true'):elseShow('Result false')
```

##### परिणाम
पहला उदाहरण `Result true` आउटपुट करता है (क्योंकि 'homer' एक स्ट्रिंग है), और दूसरा `Result true` आउटपुट करता है (क्योंकि 10.5 एक संख्या है)।

### शर्त आधारित ब्लॉक

शर्त आधारित ब्लॉक का उपयोग दस्तावेज़ के एक खंड को दिखाने या छिपाने के लिए किया जाता है, आमतौर पर कई टैग या टेक्स्ट के पूरे ब्लॉक को घेरने के लिए।

#### 1. :showBegin / :showEnd

##### सिंटैक्स
```
{data:ifEQ(condition):showBegin}
Document block content
{data:showEnd}
```

##### उदाहरण
डेटा:
```json
{
  "toBuy": true
}
```
टेम्पलेट:
```
Banana{d.toBuy:ifEQ(true):showBegin}
Apple
Pineapple
{d.toBuy:showEnd}Grapes
```

##### परिणाम
जब शर्त पूरी होती है, तो बीच की सामग्री प्रदर्शित होती है:
```
Banana
Apple
Pineapple
Grapes
```

#### 2. :hideBegin / :hideEnd

##### सिंटैक्स
```
{data:ifEQ(condition):hideBegin}
Document block content
{data:hideEnd}
```

##### उदाहरण
डेटा:
```json
{
  "toBuy": true
}
```
टेम्पलेट:
```
Banana{d.toBuy:ifEQ(true):hideBegin}
Apple
Pineapple
{d.toBuy:hideEnd}Grapes
```

##### परिणाम
जब शर्त पूरी होती है, तो बीच की सामग्री छिपी होती है, जिसके परिणामस्वरूप:
```
Banana
Grapes
```