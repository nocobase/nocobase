:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# अनुकूलित इंटरैक्शन इवेंट्स

इवेंट एडिटर में JS लिखें और ECharts इंस्टेंस `chart` का उपयोग करके इंटरैक्शन रजिस्टर करें ताकि लिंकेज सक्षम हो सके, जैसे कि नए पेज पर जाना या ड्रिल-डाउन डायलॉग खोलना।

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## रजिस्टर और डी-रजिस्टर करें
- रजिस्टर करें: `chart.on(eventName, handler)`
- डी-रजिस्टर करें: `chart.off(eventName, handler)` या `chart.off(eventName)` समान नाम वाले इवेंट्स को साफ़ करने के लिए

**ध्यान दें:**
सुरक्षा कारणों से, यह दृढ़ता से सलाह दी जाती है कि किसी इवेंट को फिर से रजिस्टर करने से पहले उसे डी-रजिस्टर करें!

## हैंडलर पैरामीटर्स की डेटा संरचना

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

सामान्य फ़ील्ड्स में `params.data` और `params.name` शामिल हैं।

## उदाहरण: चयन को हाइलाइट करने के लिए क्लिक करें
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // वर्तमान डेटा पॉइंट को हाइलाइट करें
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // दूसरों को डाउनप्ले करें
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## उदाहरण: नेविगेट करने के लिए क्लिक करें
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // विकल्प 1: पूर्ण पेज रीफ़्रेश के बिना आंतरिक नेविगेशन (अनुशंसित), केवल सापेक्ष पाथ की आवश्यकता है
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // विकल्प 2: बाहरी पेज पर नेविगेट करें, पूर्ण URL आवश्यक है
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // विकल्प 3: बाहरी पेज को नए टैब में खोलें, पूर्ण URL आवश्यक है
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## उदाहरण: विवरण डायलॉग (ड्रिल-डाउन) खोलने के लिए क्लिक करें
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // नए डायलॉग के लिए संदर्भ वैरिएबल रजिस्टर करें
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

नए खुले डायलॉग में, `ctx.view.inputArgs.XXX` के माध्यम से चार्ट संदर्भ वैरिएबल का उपयोग करें।

## पूर्वावलोकन और सहेजें
- इवेंट कोड को लोड और निष्पादित करने के लिए "पूर्वावलोकन" पर क्लिक करें।
- वर्तमान इवेंट कॉन्फ़िगरेशन को सहेजने के लिए "सहेजें" पर क्लिक करें।
- पिछली सहेजी गई स्थिति पर वापस जाने के लिए "रद्द करें" पर क्लिक करें।

**सिफारिशें:**
- डुप्लिकेट निष्पादन या बढ़ी हुई मेमोरी उपयोग से बचने के लिए बाध्य करने से पहले हमेशा `chart.off('event')` का उपयोग करें।
- रेंडरिंग प्रक्रिया को अवरुद्ध करने से बचने के लिए इवेंट हैंडलर के अंदर हल्के ऑपरेशंस (जैसे `dispatchAction`, `setOption`) का उपयोग करें।
- यह सुनिश्चित करने के लिए कि इवेंट में संभाले गए फ़ील्ड वर्तमान डेटा के अनुरूप हैं, चार्ट विकल्पों और डेटा क्वेरीज़ के विरुद्ध मान्य करें।