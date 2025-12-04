:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Özel Grafik Yapılandırması

Özel modda grafik yapılandırması yaparken, kod düzenleyicide JavaScript (JS) yazabilirsiniz. `ctx.data`'yı temel alarak eksiksiz bir ECharts `option` nesnesi döndürürsünüz. Bu yaklaşım, birden fazla seriyi birleştirmek, karmaşık ipuçları (tooltips) ve dinamik stiller oluşturmak için idealdir. Prensip olarak, tüm ECharts özelliklerini ve tüm grafik türlerini destekler.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Veri Bağlamı
- `ctx.data.objects`: nesne dizisi (her satır bir nesne olarak)
- `ctx.data.rows`: iki boyutlu dizi (başlık dahil)
- `ctx.data.columns`: sütunlara göre gruplandırılmış iki boyutlu dizi

**Önerilen Kullanım:**
Verileri `dataset.source` içinde birleştirmenizi öneririz. Ayrıntılı kullanım için lütfen ECharts belgelerine bakın:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Eksen](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Örnekler](https://echarts.apache.org/examples/en/index.html)


Şimdi en basit örneğe bakalım:

## Örnek 1: Aylık Sipariş Miktarı Çubuk Grafiği

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


## Örnek 2: Satış Eğilimi Grafiği

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

**Öneriler:**
- Saf fonksiyon stilini koruyun: `option`'ı yalnızca `ctx.data`'dan oluşturun ve yan etkilerden kaçının.
- Sorgu sütun adlarındaki değişiklikler indekslemeyi etkiler; adları standartlaştırın ve kodu değiştirmeden önce "Veriyi Görüntüle" bölümünde onaylayın.
- Büyük veri kümeleri için JS'de karmaşık senkron hesaplamalardan kaçının; gerektiğinde sorgu aşamasında verileri toplayın (aggregate).


## Daha Fazla Örnek

Daha fazla kullanım örneği için NocoBase [Demo uygulamasına](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) başvurabilirsiniz.

Ayrıca ECharts'ın resmi [Örneklerini](https://echarts.apache.org/examples/en/index.html) inceleyebilir, istediğiniz grafik efektini seçebilir ve JS yapılandırma kodunu referans alıp kopyalayabilirsiniz. 
 

## Önizleme ve Kaydetme

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- JS yapılandırmasını doğrulamak için sağdaki veya alttaki "Önizleme" düğmesine tıklayarak grafiği yenileyin.
- "Kaydet" düğmesine tıklamak, mevcut JS yapılandırmasını veritabanına kaydeder.
- "İptal" düğmesine tıklamak, son kaydedilen duruma geri döner.