:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Конфігурація діаграм у довільному режимі

У довільному режимі ви можете налаштовувати діаграми, пишучи JS-код в редакторі. На основі `ctx.data` повертається повний об'єкт `option` ECharts. Це ідеально підходить для об'єднання кількох серій даних, складних підказок та динамічних стилів. Теоретично, підтримуються всі функції ECharts та всі типи діаграм.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Контекст даних
- `ctx.data.objects`: масив об'єктів (кожен рядок як об'єкт)
- `ctx.data.rows`: двовимірний масив (з заголовком)
- `ctx.data.columns`: двовимірний масив, згрупований за стовпцями

**Рекомендоване використання:**
Об'єднуйте дані в `dataset.source`. Детальну інформацію про використання дивіться в документації ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Осі](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Приклади](https://echarts.apache.org/examples/en/index.html)


Давайте розглянемо найпростіший приклад.

## Приклад 1: Стовпчаста діаграма кількості замовлень за місяцями

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


## Приклад 2: Діаграма тренду продажів

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

**Рекомендації:**
- Дотримуйтеся стилю чистих функцій: генеруйте `option` лише на основі `ctx.data`, уникаючи побічних ефектів.
- Зміни назв стовпців запиту впливають на індексацію; стандартизуйте назви та підтверджуйте їх у розділі "Переглянути дані" перед внесенням змін до коду.
- Для великих наборів даних уникайте складних синхронних обчислень у JS; за потреби агрегуйте дані на етапі запиту.


## Більше прикладів

Щоб переглянути більше прикладів використання, ви можете звернутися до [демо-додатку](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

Також ви можете переглянути офіційні [приклади](https://echarts.apache.org/examples/en/index.html) ECharts, щоб знайти бажаний ефект діаграми, а потім скопіювати та використати відповідний JS-код конфігурації. 
 

## Попередній перегляд та збереження

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Натисніть "Попередній перегляд" праворуч або внизу, щоб оновити діаграму та перевірити вміст JS-конфігурації.
- Натисніть "Зберегти", щоб зберегти поточну JS-конфігурацію в базу даних.
- Натисніть "Скасувати", щоб повернутися до останнього збереженого стану.