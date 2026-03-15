:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/context/require-async) देखें।
:::

# ctx.requireAsync()

URL के माध्यम से **UMD/AMD** या ग्लोबली माउंटेड स्क्रिप्ट को एसिंक्रोनस रूप से लोड करता है, साथ ही **CSS** को भी लोड कर सकता है। यह उन RunJS परिदृश्यों के लिए उपयुक्त है जिनमें ECharts, Chart.js, FullCalendar (UMD वर्शन), या jQuery प्लगइन्स जैसे UMD/AMD लाइब्रेरीज़ के उपयोग की आवश्यकता होती है; `.css` एड्रेस पास करने पर यह स्टाइल लोड करेगा और इंजेक्ट करेगा। यदि कोई लाइब्रेरी ESM वर्शन भी प्रदान करती है, तो [ctx.importAsync()](./import-async.md) के उपयोग को प्राथमिकता दें।

##适用场景 (उपयोग के मामले)

इसका उपयोग किसी भी RunJS परिदृश्य में किया जा सकता है जहाँ UMD/AMD/global स्क्रिप्ट या CSS को मांग पर लोड करने की आवश्यकता हो, जैसे कि JSBlock, JSField, JSItem, JSColumn, वर्कफ़्लो (Workflow), JSAction आदि। विशिष्ट उपयोग: ECharts चार्ट, Chart.js, FullCalendar (UMD), dayjs (UMD), jQuery प्लगइन्स आदि।

## टाइप डेफ़िनेशन

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## पैरामीटर

| पैरामीटर | प्रकार | विवरण |
|-----------|------|-------------|
| `url` | `string` | स्क्रिप्ट या CSS एड्रेस। यह **शॉर्टहैंड** `<package>@<version>/<file-path>` (ESM CDN के माध्यम से रिज़ॉल्व होने पर ओरिजिनल UMD फ़ाइल के लिए `?raw` जोड़ता है) या **पूर्ण URL** का समर्थन करता है। `.css` फ़ाइल पास करने पर स्टाइल लोड और इंजेक्ट करता है। |

## रिटर्न वैल्यू

- लोड की गई लाइब्रेरी ऑब्जेक्ट (UMD/AMD कॉलबैक का पहला मॉड्यूल मान)। कई UMD लाइब्रेरीज़ खुद को `window` (जैसे, `window.echarts`) से जोड़ लेती हैं, इसलिए रिटर्न वैल्यू `undefined` हो सकती है। वास्तविक उपयोग के दौरान लाइब्रेरी के दस्तावेज़ के अनुसार ग्लोबल वेरिएबल का उपयोग करें।
- `.css` फ़ाइल पास करने पर `loadCSS` का परिणाम लौटाता है।

## URL प्रारूप विवरण

- **शॉर्टहैंड पाथ**: जैसे `echarts@5/dist/echarts.min.js`| डिफ़ॉल्ट ESM CDN (esm.sh) के तहत, यह `https://esm.sh/echarts@5/dist/echarts.min.js?raw` के लिए अनुरोध करता है। `?raw` पैरामीटर का उपयोग ESM रैपर के बजाय ओरिजिनल UMD फ़ाइल प्राप्त करने के लिए किया जाता है।
- **पूर्ण URL**: किसी भी CDN एड्रेस का सीधे उपयोग किया जा सकता है, जैसे `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`।
- **CSS**: `.css` पर समाप्त होने वाला URL लोड किया जाएगा और पेज में इंजेक्ट किया जाएगा।

## ctx.importAsync() से अंतर

- **ctx.requireAsync()**: **UMD/AMD/global** स्क्रिप्ट लोड करता है। ECharts, Chart.js, FullCalendar (UMD), jQuery प्लगइन्स आदि के लिए उपयुक्त है। लोड होने के बाद लाइब्रेरीज़ अक्सर `window` से जुड़ जाती हैं; रिटर्न वैल्यू लाइब्रेरी ऑब्जेक्ट या `undefined` हो सकती है।
- **ctx.importAsync()**: **ESM मॉड्यूल** लोड करता है और मॉड्यूल नेमस्पेस लौटाता है। यदि कोई लाइब्रेरी ESM प्रदान करती है, तो बेहतर मॉड्यूल सिमेंटिक्स और Tree-shaking के लिए `ctx.importAsync()` का उपयोग करें।

## उदाहरण

### बुनियादी उपयोग

```javascript
// शॉर्टहैंड पाथ (ESM CDN के माध्यम से ...?raw के रूप में रिज़ॉल्व किया गया)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// पूर्ण URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// CSS लोड करें और पेज में इंजेक्ट करें
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts चार्ट

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('बिक्री अवलोकन') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js बार चार्ट

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('मात्रा'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## ध्यान देने योग्य बातें

- **रिटर्न वैल्यू का प्रारूप**: UMD एक्सपोर्ट के तरीके अलग-अलग होते हैं; रिटर्न वैल्यू लाइब्रेरी ऑब्जेक्ट या `undefined` हो सकती है। यदि `undefined` है, तो लाइब्रेरी के दस्तावेज़ के अनुसार इसे `window` के माध्यम से एक्सेस करें।
- **नेटवर्क निर्भरता**: इसके लिए CDN एक्सेस की आवश्यकता होती है। आंतरिक नेटवर्क वातावरण में, आप **ESM_CDN_BASE_URL** के माध्यम से स्व-होस्ट की गई सेवा का उपयोग कर सकते हैं।
- **importAsync का चुनाव**: यदि कोई लाइब्रेरी ESM और UMD दोनों प्रदान करती है, तो `ctx.importAsync()` को प्राथमिकता दें।

## संबंधित

- [ctx.importAsync()](./import-async.md) - ESM मॉड्यूल लोड करता है, Vue, dayjs (ESM) आदि के लिए उपयुक्त है।
- [ctx.render()](./render.md) - चार्ट और अन्य घटकों को कंटेनर में रेंडर करता है।
- [ctx.libs](./libs.md) - बिल्ट-इन React, antd, dayjs आदि, किसी एसिंक्रोनस लोडिंग की आवश्यकता नहीं है।