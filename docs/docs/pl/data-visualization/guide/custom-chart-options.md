:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Niestandardowa konfiguracja wykresów

W trybie niestandardowym mogą Państwo konfigurować wykresy, pisząc kod JS w edytorze. Na podstawie `ctx.data` zwracana jest kompletna opcja ECharts (`option`). Jest to idealne rozwiązanie do łączenia wielu serii, tworzenia złożonych podpowiedzi i dynamicznych stylów. Teoretycznie obsługiwane są wszystkie funkcje ECharts i wszystkie typy wykresów.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Kontekst danych
- `ctx.data.objects`: tablica obiektów (każdy wiersz jako obiekt)
- `ctx.data.rows`: tablica dwuwymiarowa (zawierająca nagłówki)
- `ctx.data.columns`: tablica dwuwymiarowa pogrupowana według kolumn

**Zalecane użycie:**
Proszę ujednolicić dane w `dataset.source`. Szczegółowe informacje na temat użycia znajdą Państwo w dokumentacji ECharts:

 [Zbiór danych (Dataset)](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Osie (Axis)](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Przykłady (Examples)](https://echarts.apache.org/examples/en/index.html)


Zacznijmy od prostego przykładu:

## Przykład 1: Słupkowy wykres miesięcznej liczby zamówień

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


## Przykład 2: Wykres trendu sprzedaży

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

**Zalecenia:**
- Proszę zachować styl czystej funkcji: generować `option` wyłącznie na podstawie `ctx.data` i unikać efektów ubocznych.
- Zmiany nazw kolumn w zapytaniu wpływają na indeksowanie; proszę ujednolicić nazwy i potwierdzić je w sekcji „Podgląd danych” przed modyfikacją kodu.
- W przypadku dużych zbiorów danych proszę unikać złożonych obliczeń synchronicznych w JS; w razie potrzeby proszę agregować dane na etapie zapytania.


## Więcej przykładów

Więcej przykładów użycia znajdą Państwo w [aplikacji demonstracyjnej NocoBase](https://demo3.sg.nocobase.com/admin/5xrop8s0bui).

Mogą Państwo również przeglądać oficjalne [przykłady ECharts](https://echarts.apache.org/examples/en/index.html), aby znaleźć pożądany efekt wykresu, a następnie odwołać się do kodu konfiguracji JS i go skopiować.
 

## Podgląd i zapis

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Proszę kliknąć „Podgląd” po prawej stronie lub na dole, aby odświeżyć wykres i zweryfikować konfigurację JS.
- Kliknięcie „Zapisz” spowoduje zapisanie bieżącej konfiguracji JS w bazie danych.
- Kliknięcie „Anuluj” spowoduje powrót do ostatnio zapisanego stanu.