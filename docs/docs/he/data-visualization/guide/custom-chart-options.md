:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# הגדרת תרשימים מותאמים אישית

במצב מותאם אישית, תוכלו להגדיר תרשימים על ידי כתיבת קוד JavaScript בעורך. בהתבסס על `ctx.data`, הקוד יחזיר אובייקט `option` מלא של ECharts. גישה זו מתאימה למיזוג סדרות נתונים מרובות, טיפים מורכבים (tooltips) ועיצובים דינמיים. באופן עקרוני, כל התכונות וסוגי התרשימים של ECharts נתמכים.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## הקשר הנתונים
- `ctx.data.objects`: מערך של אובייקטים (כל שורה כרשומה)
- `ctx.data.rows`: מערך דו-ממדי (כולל כותרות עמודות)
- `ctx.data.columns`: מערך דו-ממדי מקובץ לפי עמודות

**שימוש מומלץ:**
יש לאחד את הנתונים בתוך `dataset.source`. לשימוש מפורט, אנא עיינו בתיעוד של ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [צירים](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [דוגמאות](https://echarts.apache.org/examples/en/index.html)


בואו נתחיל עם דוגמה פשוטה.

## דוגמה 1: תרשים עמודות של כמות הזמנות חודשית

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


## דוגמה 2: תרשים מגמת מכירות

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

**המלצות:**
- שמרו על סגנון של פונקציה טהורה: צרו את ה-`option` רק מתוך `ctx.data` והימנעו מתופעות לוואי.
- שינויים בשמות עמודות השאילתה משפיעים על האינדקסים; תקננו את השמות ואשרו אותם ב"הצג נתונים" לפני עריכת הקוד.
- עבור מערכי נתונים גדולים, הימנעו מחישובים סינכרוניים מורכבים ב-JS; בצעו אגרגציה בשלב השאילתה בעת הצורך.


## דוגמאות נוספות

לדוגמאות שימוש נוספות, תוכלו לעיין ב[אפליקציית הדמו](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) של NocoBase.

תוכלו גם לעיין ב[דוגמאות](https://echarts.apache.org/examples/en/index.html) הרשמיות של ECharts כדי למצוא את אפקט התרשים הרצוי לכם, ולאחר מכן להשתמש בקוד תצורת ה-JS כהפניה ולהעתיק אותו. 
 

## תצוגה מקדימה ושמירה

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- לחצו על "תצוגה מקדימה" בצד ימין או בתחתית כדי לרענן את התרשים ולאמת את תצורת ה-JS.
- לחיצה על "שמור" תשמור את תצורת ה-JS הנוכחית במסד הנתונים.
- לחיצה על "ביטול" תחזיר אתכם למצב השמור האחרון.