# Пользовательская настройка графика

В пользовательском режиме настройка графика выполняется написанием JS в редакторе. На основе `ctx.data` возвращается полный `option` ECharts. Это подходит для объединения нескольких серий, сложных подсказок и динамических стилей. В целом поддерживаются все возможности и типы графиков ECharts.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Контекст данных
- `ctx.data.objects`: массив объектов (каждая строка как объект)
- `ctx.data.rows`: двумерный массив (с заголовком)
- `ctx.data.columns`: двумерный массив, сгруппированный по столбцам

**Рекомендуемое использование:**
Консолидируйте данные в `dataset.source`. Подробности см. в документации ECharts:

 [Набор данных](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Оси координат](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Примеры](https://echarts.apache.org/examples/en/index.html)

Начнём с простого примера.

## Пример 1: столбчатый график заказов по месяцам

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

## Пример 2: график тренда продаж

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

**Рекомендации:**
- Поддерживайте стиль «чистой функции»: формируйте `option` только из `ctx.data` и избегайте побочных эффектов.
- Изменение имён колонок в запросе влияет на индексацию; стандартизируйте названия и проверяйте их в «Просмотр данных» перед редактированием кода.
- Для больших датасетов избегайте сложных синхронных вычислений в JS; при необходимости агрегируйте данные на этапе запроса.

## Дополнительные примеры

Больше примеров использования можно посмотреть в [Demo app](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

Также можно изучить официальные [Examples](https://echarts.apache.org/examples/en/index.html) ECharts, найти нужный визуальный эффект и затем использовать/копировать JS-код конфигурации.
 
## Предпросмотр и сохранение

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Нажмите «Предпросмотр» справа или внизу, чтобы обновить график и проверить JS-конфигурацию.
- Нажмите «Сохранить», чтобы сохранить текущую JS-конфигурацию в базу данных.
- Нажмите «Отмена», чтобы вернуться к последнему сохранённому состоянию.