:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/require-async).
:::

# ctx.requireAsync()

Carrega assincronamente scripts **UMD/AMD** ou montados globalmente via URL, bem como **CSS**. É adequado para cenários de RunJS que exigem bibliotecas UMD/AMD como ECharts, Chart.js, FullCalendar (versão UMD) ou plugins jQuery; passar um endereço `.css` carregará e injetará o estilo. Se uma biblioteca também fornecer uma versão ESM, priorize o uso de [ctx.importAsync()](./import-async.md).

## Casos de Uso

Pode ser usado em qualquer cenário de RunJS onde scripts UMD/AMD/globais ou CSS precisem ser carregados sob demanda, como JSBlock, JSField, JSItem, JSColumn, fluxo de trabalho, JSAction, etc. Usos típicos: gráficos ECharts, Chart.js, FullCalendar (UMD), dayjs (UMD), plugins jQuery, etc.

## Definição de Tipo

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-------------|
| `url` | `string` | O endereço do script ou CSS. Suporta **abreviação** `<nome-do-pacote>@<versão>/<caminho-do-arquivo>` (adiciona `?raw` para o arquivo UMD original quando resolvido via CDN ESM) ou uma **URL completa**. Carrega e injeta estilos se um arquivo `.css` for passado. |

## Valor de Retorno

- O objeto da biblioteca carregada (o primeiro valor do módulo do callback UMD/AMD). Muitas bibliotecas UMD se anexam ao `window` (ex: `window.echarts`), portanto, o valor de retorno pode ser `undefined`. Nesses casos, acesse a variável global conforme a documentação da biblioteca.
- Retorna o resultado de `loadCSS` quando um arquivo `.css` é passado.

## Descrição do Formato de URL

- **Caminho abreviado**: ex: `echarts@5/dist/echarts.min.js`. Sob o CDN ESM padrão (esm.sh), ele solicitará `https://esm.sh/echarts@5/dist/echarts.min.js?raw`. O parâmetro `?raw` é usado para obter o arquivo UMD original em vez de um wrapper ESM.
- **URL completa**: Qualquer endereço de CDN pode ser usado diretamente, como `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`.
- **CSS**: Uma URL terminada em `.css` será carregada e injetada na página.

## Diferença para o ctx.importAsync()

- **ctx.requireAsync()**: Carrega scripts **UMD/AMD/globais**. Adequado para ECharts, Chart.js, FullCalendar (UMD), plugins jQuery, etc. As bibliotecas geralmente se anexam ao `window` após o carregamento; o valor de retorno pode ser o objeto da biblioteca ou `undefined`.
- **ctx.importAsync()**: Carrega **módulos ESM** e retorna o namespace do módulo. Se uma biblioteca fornecer ESM, use `ctx.importAsync()` para melhor semântica de módulo e Tree-shaking.

## Exemplos

### Uso Básico

```javascript
// Caminho abreviado (resolvido via CDN ESM como ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// URL completa
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Carrega CSS e injeta na página
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### Gráfico ECharts

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('Biblioteca ECharts não carregada');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('Visão Geral de Vendas') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Gráfico de Barras Chart.js

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js não carregado');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('Quantidade'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## Observações

- **Formato do valor de retorno**: Os métodos de exportação UMD variam; o valor de retorno pode ser o objeto da biblioteca ou `undefined`. Se for `undefined`, acesse-o via `window` de acordo com a documentação da biblioteca.
- **Dependência de rede**: Requer acesso a um CDN. Em ambientes de rede interna, você pode apontar para um serviço próprio através de **ESM_CDN_BASE_URL**.
- **Escolha entre importAsync**: Se uma biblioteca fornecer tanto ESM quanto UMD, priorize o `ctx.importAsync()`.

## Relacionados

- [ctx.importAsync()](./import-async.md) - Carrega módulos ESM, adequado para Vue, dayjs (ESM), etc.
- [ctx.render()](./render.md) - Renderiza gráficos e outros componentes em um contêiner.
- [ctx.libs](./libs.md) - React, antd, dayjs integrados, etc., sem necessidade de carregamento assíncrono.