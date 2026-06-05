:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Configuração de Gráficos Personalizados

No modo personalizado, você configura gráficos escrevendo código JavaScript no editor. Com base em `ctx.data`, você retorna uma `option` completa do ECharts. Isso é ideal para combinar várias séries, criar dicas de ferramentas complexas e estilos dinâmicos. Em teoria, todas as funcionalidades e tipos de gráfico do ECharts são suportados.

![clipboard-image-1761524637](https://static-docs.nocobase.com/clipboard-image-1761524637.png)

## Contexto dos Dados
- `ctx.data.objects`: array de objetos (cada linha como um objeto)
- `ctx.data.rows`: array 2D (com cabeçalho)
- `ctx.data.columns`: array 2D agrupado por colunas

**Uso recomendado:**
Consolide os dados em `dataset.source`. Para detalhes sobre o uso, consulte a documentação do ECharts:

 [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

 [Eixos](https://echarts.apache.org/handbook/en/concepts/axis) 
 
 [Exemplos](https://echarts.apache.org/examples/en/index.html)


Vamos começar com um exemplo simples.

## Exemplo 1: Gráfico de Barras de Pedidos Mensais

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


## Exemplo 2: Gráfico de Tendência de Vendas

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

**Recomendações:**
- Mantenha um estilo de função pura: gere a `option` apenas a partir de `ctx.data` e evite efeitos colaterais.
- Alterações nos nomes das colunas da consulta afetam a indexação; padronize os nomes e confirme em "Ver dados" antes de editar o código.
- Para grandes volumes de dados, evite cálculos síncronos complexos em JavaScript; faça a agregação durante a fase de consulta, se necessário.


## Mais exemplos

Para mais exemplos de uso, você pode consultar o [aplicativo de demonstração](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) do NocoBase.

Você também pode navegar pelos [exemplos](https://echarts.apache.org/examples/en/index.html) oficiais do ECharts para encontrar o efeito de gráfico desejado e, em seguida, consultar e copiar o código de configuração JavaScript.
 

## Pré-visualizar e Salvar

![20251027083938](https://static-docs.nocobase.com/20251027083938.png)

- Clique em "Pré-visualizar" no lado direito ou na parte inferior para atualizar o gráfico e validar a configuração JavaScript.
- Clique em "Salvar" para persistir a configuração JavaScript atual no banco de dados.
- Clique em "Cancelar" para reverter ao último estado salvo.