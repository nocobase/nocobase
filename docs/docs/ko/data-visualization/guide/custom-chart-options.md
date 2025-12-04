:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 사용자 정의 차트 구성

사용자 정의 모드에서는 코드 편집기에서 JS를 작성하여 차트를 구성합니다. `ctx.data`를 기반으로 완전한 ECharts `option`을 반환하며, 여러 시리즈를 병합하고 복잡한 툴팁과 동적인 스타일을 적용하는 데 적합합니다. 이론적으로 모든 ECharts 기능과 모든 차트 유형을 지원할 수 있습니다.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## 데이터 컨텍스트
- `ctx.data.objects`: 객체 배열 (각 행을 객체로 표현)
- `ctx.data.rows`: 2차원 배열 (헤더 포함)
- `ctx.data.columns`: 열별로 그룹화된 2차원 배열

**권장 사용법:**
데이터를 `dataset.source`에 통합하여 사용하시기를 권장합니다. 자세한 사용법은 ECharts 문서를 참조해 주세요.

 [데이터셋](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [축](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [예시](https://echarts.apache.org/examples/en/index.html)


가장 간단한 예시부터 살펴보겠습니다.

## 예시 1: 월별 주문량 막대 차트

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


## 예시 2: 판매 추세 차트

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

**권장 사항:**
- 순수 함수 스타일을 유지하고, `ctx.data`만을 기반으로 `option`을 생성하여 부작용을 피하세요.
- 쿼리 열 이름 변경은 인덱싱에 영향을 미치므로, 이름을 표준화하고 '데이터 보기'에서 확인한 후 코드를 수정하세요.
- 데이터 양이 많을 때는 JS에서 복잡한 동기 계산을 피하고, 필요한 경우 쿼리 단계에서 집계하세요.


## 더 많은 예시

더 많은 사용 예시는 NocoBase [데모 앱](https://demo3.sg.nocobase.com/admin/5xrop8s0bui)을 참조하실 수 있습니다.

또한 ECharts 공식 [예시](https://echarts.apache.org/examples/en/index.html)를 확인하여 원하는 차트 효과를 선택하고, JS 구성 코드를 참조 및 복사할 수 있습니다.
 

## 미리 보기 및 저장

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- 오른쪽 또는 하단의 '미리 보기'를 클릭하여 차트를 새로 고치고 JS 구성 내용을 확인하세요.
- '저장'을 클릭하면 현재 JS 구성 내용이 데이터베이스에 저장됩니다.
- '취소'를 클릭하면 마지막 저장 상태로 되돌아갑니다.