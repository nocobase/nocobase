:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# कस्टम चार्ट कॉन्फ़िगरेशन

कस्टम मोड में, आप कोड एडिटर में JS लिखकर चार्ट कॉन्फ़िगर कर सकते हैं। `ctx.data` के आधार पर, यह एक पूरा ECharts `option` देता है। यह कई सीरीज़ को मर्ज करने, जटिल टूलटिप्स और डायनामिक स्टाइल के लिए उपयुक्त है। सैद्धांतिक रूप से, यह सभी ECharts सुविधाओं और चार्ट प्रकारों को सपोर्ट कर सकता है।

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## डेटा कॉन्टेक्स्ट
- `ctx.data.objects`: ऑब्जेक्ट्स का ऐरे (प्रत्येक पंक्ति एक ऑब्जेक्ट के रूप में)
- `ctx.data.rows`: 2D ऐरे (हेडर सहित)
- `ctx.data.columns`: कॉलम के अनुसार ग्रुप किया गया 2D ऐरे

**सुझाया गया उपयोग:**
डेटा को `dataset.source` में एक साथ लाएँ। विस्तृत उपयोग के लिए, कृपया ECharts डॉक्यूमेंटेशन देखें:

 [डेटासेट](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [एक्सिस](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [उदाहरण](https://echarts.apache.org/examples/en/index.html)


आइए, एक सबसे सरल उदाहरण से शुरुआत करते हैं:

## उदाहरण 1: मासिक ऑर्डर बार चार्ट

![20251027082816](https://static-docs.nocobase.com/20251027082816.png)

```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'bar',
      showSymbol: false,
    },
  ],
}
```


## उदाहरण 2: बिक्री ट्रेंड चार्ट

![clipboard-image-1761525188](https://static-docs.nocobase.com/clipboard-image-1761525188.png)

```js
return {
  dataset: {
    source: ctx.data.objects.reverse()
  },
  title: {
    text: "Monthly Sales Trend",
    subtext: "Last 12 Months",
    left: "center"
  },
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross"
    }
  },
  legend: {
    data: ["Revenue", "Order Count", "Avg Order Value"],
    bottom: 0
  },
  grid: {
    left: "5%",
    right: "5%",
    bottom: "60",
    top: "80",
    containLabel: true
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    axisLabel: {
      rotate: 45
    }
  },
  yAxis: [
    {
      type: "value",
      name: "Amount(¥)",
      position: "left",
      axisLabel: {
        formatter: (value) => {
          return (value/10000).toFixed(0) + '0k';
        }
      }
    },
    {
      type: "value",
      name: "Order Count",
      position: "right"
    }
  ],
  series: [
    {
      name: "Revenue",
      type: "line",
      smooth: true,
      encode: {
        x: "month",
        y: "monthly_revenue"
      },
      areaStyle: {
        opacity: 0.3
      },
      itemStyle: {
        color: "#5470c6"
      }
    },
    {
      name: "Order Count",
      type: "bar",
      yAxisIndex: 1,
      encode: {
        x: "month",
        y: "order_count"
      },
      itemStyle: {
        color: "#91cc75",
        opacity: 0.6
      }
    },
    {
      name: "Avg Order Value",
      type: "line",
      encode: {
        x: "month",
        y: "avg_order_value"
      },
      itemStyle: {
        color: "#fac858"
      },
      lineStyle: {
        type: "dashed"
      }
    }
  ]
}
```

**सुझाव:**
- प्योर फ़ंक्शन स्टाइल बनाए रखें: `ctx.data` से ही `option` जनरेट करें और साइड इफ़ेक्ट से बचें।
- क्वेरी कॉलम नामों में बदलाव से इंडेक्सिंग प्रभावित होती है; कोड एडिट करने से पहले नामों को मानकीकृत करें और "डेटा देखें" में पुष्टि करें।
- बड़े डेटासेट के लिए, JS में जटिल सिंक्रोनस गणनाओं से बचें; आवश्यकता पड़ने पर क्वेरी चरण के दौरान एग्रीगेट करें।


## और उदाहरण

अधिक उपयोग के उदाहरणों के लिए, आप NocoBase [डेमो ऐप](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) देख सकते हैं।

आप ECharts के आधिकारिक [उदाहरण](https://echarts.apache.org/examples/en/index.html) भी देख सकते हैं ताकि आप अपनी पसंद का चार्ट इफ़ेक्ट ढूंढ सकें, फिर JS कॉन्फ़िगरेशन कोड को रेफ़रेंस और कॉपी कर सकें। 
 

## प्रीव्यू और सेव करें

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- JS कॉन्फ़िगरेशन को वैलिडेट करने के लिए दाईं ओर या नीचे "प्रीव्यू" पर क्लिक करके चार्ट को रीफ़्रेश करें।
- "सेव करें" पर क्लिक करने से वर्तमान JS कॉन्फ़िगरेशन डेटाबेस में सेव हो जाएगा।
- "कैंसिल करें" पर क्लिक करने से पिछली सेव की गई स्थिति पर वापस आ जाएँगे।