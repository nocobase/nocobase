:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Opções de Gráfico

Configure como os gráficos são exibidos. Duas modalidades são suportadas: Basic (visual) e Custom (JS). A modalidade Basic é ideal para mapeamentos rápidos e propriedades comuns, enquanto a Custom se encaixa em cenários complexos e personalizações avançadas.

## Estrutura do Painel

![clipboard-image-1761473695](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> [!TIP]
> Para configurar o conteúdo atual com mais facilidade, você pode primeiro recolher os outros painéis.

Na parte superior, você encontra a barra de ações.
Seleção de Modalidade:
- Basic: Configuração visual. Escolha um tipo e complete o mapeamento de campos; ajuste propriedades comuns diretamente com os seletores.
- Custom: Escreva o código JS no editor e retorne um `option` do ECharts.

## Modalidade Basic

![20251026190615](https://static-docs.nocobase.com/20251026190615.png)

### Escolha o Tipo de Gráfico
- Suportados: gráfico de linha, gráfico de área, gráfico de coluna, gráfico de barras, gráfico de pizza, gráfico de rosca, gráfico de funil, gráfico de dispersão, etc.
- Os campos necessários podem variar de acordo com o tipo de gráfico. Primeiro, confirme os nomes e tipos das colunas em “Consulta de dados → Visualizar dados”.

### Mapeamento de Campos
- Linha/Área/Coluna/Barras:
  - `xField`: dimensão (ex: data, categoria, região)
  - `yField`: medida (valor numérico agregado)
  - `seriesField` (opcional): agrupamento de séries (para múltiplas linhas/grupos de colunas)
- Pizza/Rosca:
  - `Category`: dimensão categórica
  - `Value`: medida
- Funil:
  - `Category`: estágio/categoria
  - `Value`: valor (geralmente contagem ou porcentagem)
- Dispersão:
  - `xField`, `yField`: duas medidas ou dimensões para os eixos

> Para mais opções de configuração de gráfico, consulte a documentação do ECharts: [Eixos](https://echarts.apache.org/handbook/en/concepts/axis) e [Exemplos](https://echarts.apache.org/examples/en/index.html)

**Atenção:**
- Após alterar dimensões ou medidas, reconfirme o mapeamento para evitar gráficos vazios ou desalinhados.
- Gráficos de pizza/rosca e funil devem fornecer uma combinação de “categoria + valor”.

### Propriedades Comuns

![20251026191332](https://static-docs.nocobase.com/20251026191332.png)

- Empilhamento, suavização (linha/área)
- Exibição de rótulos, dicas de ferramentas (tooltip), legenda
- Rotação de rótulos do eixo, linhas de grade
- Raio e raio interno de pizza/rosca, ordem de classificação do funil

**Recomendações:**
- Para séries temporais, use gráficos de linha/área e ative a suavização moderadamente; para comparação de grandes categorias, use gráficos de coluna/barras.
- Com dados densos, evite exibir todos os rótulos para prevenir sobreposição.

## Modalidade Custom

Utilizada para retornar um `option` completo do ECharts. É adequada para personalizações avançadas, como a fusão de múltiplas séries, dicas de ferramentas complexas e estilos dinâmicos.
Abordagem recomendada: consolide os dados em `dataset.source`. Para detalhes, consulte a documentação do ECharts: [Dataset](https://echarts.apache.org/handbook/en/concepts/dataset/#map-row-or-column-of-dataset-to-series)

![20251026191728](https://static-docs.nocobase.com/20251026191728.png)

### Contexto de Dados
- `ctx.data.objects`: array de objetos (cada linha como um objeto, recomendado)
- `ctx.data.rows`: array 2D (com cabeçalho)
- `ctx.data.columns`: array 2D agrupado por colunas

### Exemplo: Gráfico de Linha de Pedidos Mensais
```js
return {
  dataset: { source: ctx.data.objects || [] },
  xAxis: { type: 'category' },
  yAxis: {},
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
    },
  ],
}
```

### Pré-visualizar e Salvar

- Na modalidade Custom, após fazer as edições, você pode clicar no botão **Pré-visualizar** à direita para atualizar a pré-visualização do gráfico.
- Na parte inferior, clique em **Salvar** para aplicar e persistir as configurações; clique em **Cancelar** para reverter todas as alterações feitas.

![20251026192816](https://static-docs.nocobase.com/clipboard-image-1761473695.png)

> [!TIP]
> Para mais informações sobre as opções de gráfico, consulte Uso Avançado — Configuração de gráfico personalizado.