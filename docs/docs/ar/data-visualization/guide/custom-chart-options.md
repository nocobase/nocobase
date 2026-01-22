:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# إعدادات المخطط المخصصة

في الوضع المخصص، يمكنك إعداد المخططات بكتابة JavaScript في محرر الأكواد. بناءً على `ctx.data`، يمكنك إرجاع كائن `option` كامل من ECharts. هذا الأسلوب مناسب لدمج سلاسل بيانات متعددة، وتوفير تلميحات معقدة، وتطبيق أنماط ديناميكية. من الناحية النظرية، يدعم هذا الوضع جميع ميزات ECharts وأنواع المخططات.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## سياق البيانات
- `ctx.data.objects`: مصفوفة كائنات (كل صف كسجل)
- `ctx.data.rows`: مصفوفة ثنائية الأبعاد (مع ترويسة)
- `ctx.data.columns`: مصفوفة ثنائية الأبعاد مجمعة حسب الأعمدة

**الاستخدام الموصى به:**
قم بتوحيد البيانات في `dataset.source`. للاطلاع على الاستخدام المفصل، يرجى الرجوع إلى وثائق ECharts:

 [مجموعة البيانات (Dataset)](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [المحاور (Axis)](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [أمثلة (Examples)](https://echarts.apache.org/examples/en/index.html)


لنبدأ بمثال بسيط:

## المثال الأول: مخطط الأعمدة لكمية الطلبات الشهرية

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


## المثال الثاني: مخطط اتجاه المبيعات

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

**توصيات:**
- حافظ على أسلوب الدالة النقية: قم بإنشاء `option` فقط من `ctx.data` وتجنب الآثار الجانبية.
- تؤثر التغييرات في أسماء أعمدة الاستعلام على الفهرسة؛ قم بتوحيد الأسماء وتأكيدها في "عرض البيانات" قبل تعديل الكود.
- بالنسبة لمجموعات البيانات الكبيرة، تجنب إجراء حسابات متزامنة معقدة في JavaScript؛ قم بالتجميع خلال مرحلة الاستعلام عند الضرورة.


## المزيد من الأمثلة

للمزيد من أمثلة الاستخدام، يمكنك الرجوع إلى [تطبيق NocoBase التجريبي](https://demo3.sg.nocobase.com/admin/5xrop8s0bui).

يمكنك أيضًا تصفح [أمثلة ECharts الرسمية](https://echarts.apache.org/examples/en/index.html) لاختيار تأثير المخطط الذي تريده، ثم الرجوع إلى كود إعدادات JavaScript ونسخه. 
 

## المعاينة والحفظ

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- انقر على "معاينة" في الجانب الأيمن أو في الأسفل لتحديث المخطط والتحقق من إعدادات JavaScript.
- انقر على "حفظ" لحفظ إعدادات JavaScript الحالية في قاعدة البيانات.
- انقر على "إلغاء" للعودة إلى الحالة المحفوظة الأخيرة.