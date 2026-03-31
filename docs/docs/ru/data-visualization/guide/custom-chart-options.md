:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Настройка диаграмм в пользовательском режиме

В пользовательском режиме вы можете настраивать диаграммы, написав JavaScript-код в редакторе. На основе `ctx.data` вы возвращаете полный объект `option` ECharts. Это подходит для объединения нескольких серий данных, создания сложных всплывающих подсказок и динамических стилей. Теоретически поддерживаются все функции и типы диаграмм ECharts.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Контекст данных
- `ctx.data.objects`: массив объектов (каждая строка как объект)
- `ctx.data.rows`: двумерный массив (с заголовком)
- `ctx.data.columns`: двумерный массив, сгруппированный по столбцам

**Рекомендуемое использование:**
Объединяйте данные в `dataset.source`. Подробное описание использования вы найдете в документации ECharts:

 [Набор данных (Dataset)](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Оси координат](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Примеры](https://echarts.apache.org/examples/en/index.html)

Давайте рассмотрим самый простой пример:

## Пример 1: Столбчатая диаграмма количества заказов по месяцам

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

## Пример 2: Диаграмма тренда продаж

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
- Соблюдайте стиль чистых функций: генерируйте `option` только на основе `ctx.data` и избегайте побочных эффектов.
- Изменения в именах столбцов запроса влияют на индексацию; стандартизируйте имена и подтвердите их в разделе «Просмотр данных» перед изменением кода.
- При больших объемах данных избегайте сложных синхронных вычислений в JS; при необходимости выполняйте агрегацию на этапе запроса.

## Дополнительные примеры

Для получения дополнительных примеров использования вы можете обратиться к [демонстрационному приложению](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

Вы также можете просмотреть официальные [примеры](https://echarts.apache.org/examples/en/index.html) ECharts, чтобы найти желаемый эффект диаграммы, а затем использовать и скопировать соответствующий JS-код конфигурации. 

## Предварительный просмотр и сохранение

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Нажмите «Предварительный просмотр» справа или внизу, чтобы обновить диаграмму и проверить конфигурацию JS.
- Нажмите «Сохранить», чтобы сохранить текущую конфигурацию JS в базу данных.
- Нажмите «Отмена», чтобы вернуться к последнему сохраненному состоянию.