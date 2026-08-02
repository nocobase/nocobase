---
title: "Use NocoBase para construir um painel operacional vinculável"
description: "Tomando o painel de operação da ordem de serviço como exemplo, o bloco de gráfico, o bloco de filtro e o bloco JS são combinados para obter filtragem unificada, KPI, detalhamento de gráfico e estilos personalizados."
keywords: "NocoBase, painel operacional, visualização de dados, bloco de gráfico, bloco de filtro, bloco JS, detalhamento de gráfico"
---

# Use NocoBase para construir um painel operacional vinculável

Este artigo toma o painel de operação do "sistema de ordem de serviço" como exemplo para apresentar como usar o bloco de gráfico, bloco de filtro e bloco JS do NocoBase em combinação para construir um painel de dados que suporta ligação de filtro, detalhamento de gráfico e estilos personalizados.

Embora os exemplos sejam de cenários de ordens de serviço, esses métodos também são aplicáveis ​​a sistemas de negócios como CRM, operações de equipamentos, gerenciamento de projetos, fluxo de aprovação, sucesso do cliente, etc.

:::tip
O que este artigo deseja apresentar não é "como usar blocos JS para escrever uma tela grande", mas como combinar os recursos de bloco nativo do NocoBase e os blocos JS: deixe os blocos nativos serem responsáveis ​​​​pelos recursos padrão e deixe os blocos JS complementarem a experiência personalizada.
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## alvo da cena

Esperamos construir um painel de operações para ajudar a equipe de operação ou serviço a determinar rapidamente a carga de trabalho atual:

- Quantas ordens de serviço abertas existem atualmente?
- Quais ordens de serviço correm risco de SLA?
- Qual é a tendência em novas ordens de serviço?
- Qual é o status e a distribuição de prioridades das ordens de serviço?
- Depois de clicar em um gráfico, você pode visualizar os detalhes correspondentes

A página pode ser dividida aproximadamente em quatro camadas:

1. Área de filtro superior: horário, grupo de serviço, tipo de solicitação, prioridade, status do SLA
2. Área de estatísticas de KPI: Backlog aberto, Não atribuído, aviso de SLA, etc.
3. Área de análise do gráfico: tendência, status, SLA, distribuição de prioridades
4. Área de detalhes de detalhamento: clique no gráfico para exibir os registros correspondentes

## Primeiro, esclareça uma ideia de construção

Quando muitas pessoas criam painéis de dados, elas tendem a pensar no problema como uma de duas opções:

Use todos os blocos nativos do NocoBase, que são simples de configurar, mas preocupe-se que o estilo e a interação não sejam flexíveis o suficiente; ou simplesmente escreva um grande bloco JS e controle você mesmo a consulta, o gráfico, a filtragem e o detalhamento, mas isso perderá a conveniência trazida pela configuração de baixo código.

Na verdade, a forma mais recomendada é combinar os dois.

Neste painel de Operações, não escrevemos a página inteira como uma grande tela JS, mas a dividimos de acordo com as responsabilidades:

- A filtragem superior usa o bloco de filtragem que acompanha o sistema NocoBase;
- Gráficos de tendências, distribuição de status e distribuição de SLA usam blocos de gráficos nativos;
- Cartões KPI e detalhes detalhados usam blocos JS;
- Os blocos de filtro afetam os blocos de gráfico e os blocos JS;
- Depois que o gráfico é clicado, as condições de detalhamento são passadas para o bloco de detalhes JS abaixo.

A vantagem disso é que as estatísticas e a filtragem padrão ainda mantêm os recursos de configuração do NocoBase, enquanto a exibição personalizada e as interações complexas são completadas por blocos JS. A página não é "somente configurável" nem "todo o código", mas a configuração e o código desempenham suas próprias funções.

---

## 1. Como personalizar o estilo do bloco gráfico

![](https://static-docs.nocobase.com/202607121920941.png)

O bloco gráfico do NocoBase pode primeiro usar o construtor de consultas para definir o calibre estatístico e, em seguida, usar a opção ECharts personalizada para ajustar o estilo.

Tomando como exemplo as "estatísticas de status da ordem de serviço", o construtor de consultas pode ser configurado como:

- Ficha técnica: ingressos
- Métricas: contagem de IDs, alias ticketCount
- Dimensões: status

A chave é que ao personalizar o estilo, você não precisa reescrever a consulta, você só precisa processar a exibição do gráfico com base em `ctx.data.objects`.

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

Esta linha de código lê os resultados da consulta do gráfico. Em seguida, defina rótulos e cores de status:

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

Recomenda-se que todos os direitos autorais visíveis usem `ctx.t()` para facilitar o suporte multilíngue subsequente.

Ao gerar dados do gráfico, você pode anexar informações detalhadas a cada ponto de dados do gráfico:

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

A coisa mais crítica aqui é `ticketingDrilldown`. Não é um campo padrão dos ECharts, mas sim um contexto de negócio que colocamos em nós mesmos, que será utilizado ao clicar no gráfico posteriormente.

Finalmente retorne à opção ECharts:

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

A ideia central desta parte é:

- O construtor de consultas é responsável pelas estatísticas;
- A opção customizada é responsável pela expressão visual;
- Os campos personalizados são responsáveis ​​por transportar o contexto de detalhamento.

---

## 2. Deixe o bloco de filtro do sistema se tornar o escopo de observação de toda a página

![](https://static-docs.nocobase.com/202607121920687.png)

A área de filtro no painel operacional não deve ser apenas uma forma isolada. Representa o diâmetro de observação atual de toda a página.

Por exemplo, se o usuário selecionar um grupo de serviços, um tipo de solicitação e um horário de criação, os KPIs, os gráficos de tendências, a distribuição de status e os detalhes de detalhamento deverão ser exibidos com base no mesmo conjunto de condições. Caso contrário, os números em diferentes blocos da página brigarão entre si e será difícil para os usuários avaliar quais dados são o resultado dentro do intervalo atual.

Aqui usamos diretamente o bloco de filtragem que vem com o sistema NocoBase, em vez de escrevermos nós mesmos um componente de filtragem. Os blocos de filtro nativos podem ser vinculados naturalmente aos blocos de gráfico, permitindo que o bloco de gráfico continue a usar o construtor de consultas, permissões, mecanismos de atualização e filtro.

Top `Dashboard scope` pode configurar estes itens de filtro:

- Created at
- Service group
- Request type
- Priority
- SLA status

Para blocos JS, você só precisa ler o mesmo conjunto de condições de filtro no código e depois convertê-los em filtros de consulta. Dessa forma, os KPIs e os detalhes detalhados também podem ser consistentes com o gráfico nativo.

A combinação de condições de filtro pode ser encapsulada em uma pequena função:

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

Contagem por filtro:

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

Os pontos principais aqui são:

```javascript
resource.setFilter(filter);
await resource.refresh();
```

O bloco JS consulta dados de negócios por meio de recursos em vez de escrever SQL diretamente. Isso torna mais fácil manter a consistência com as permissões, fontes de dados e tempos de execução de página do NocoBase.

---

## 3. Use blocos JS para exibir cartões KPI

![](https://static-docs.nocobase.com/202607121920374.png)

KPIs são mais adequados para usar blocos JS. Porque o KPI geralmente não é uma consulta única, mas uma combinação de vários calibres de negócios: inacabado, não atribuído, aviso de SLA, SLA violado, novo, resolvido, etc.

O bloco JS pode consultar dados com base no intervalo de filtragem atual e renderizá-los em um cartão estatístico.

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

Os pontos principais dos blocos JS são:

- Use `ctx.makeResource()` para consultar dados;
- Use `ctx.libs.antd` para renderizar a interface;
- Use `ctx.render()` para gerar conteúdo;
- Rerenderize pedaços JS após filtrar as alterações.

Em uma página real, o botão de filtro e o botão de redefinição podem configurar o fluxo de eventos para que atualizem o bloco JS de KPI e o bloco JS de detalhamento ao mesmo tempo após concluir a ação de filtro nativo. Dessa forma, o usuário clica uma vez para filtrar, e tanto os gráficos quanto o conteúdo customizado serão atualizados com base no mesmo intervalo.

---

## 4. Bloco JS de vinculação de gráfico para detalhamento

![](https://static-docs.nocobase.com/202607121921577.png)

Clicar no gráfico para detalhar é uma interação muito prática no painel.

No cenário de ordem de serviço, o usuário clica na coluna “Status: Aberta”, e todas as ordens de serviço abertas são exibidas na área de detalhe abaixo; quando o usuário clica em “SLA violado”, todas as ordens de serviço de horas extras são exibidas abaixo.

A ideia de implementação é:

1. Os pontos de dados do gráfico carregam `ticketingDrilldown`;
2. O evento gráfico lê essas informações de detalhamento;
3. Escreva informações detalhadas no contexto do bloco JS de destino;
4. Acione o bloco JS de destino para renderização novamente.

O código-chave no evento gráfico é o seguinte. Primeiro encontre o bloco JS detalhado:

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

Em seguida, escreva as condições de detalhamento obtidas clicando no gráfico no bloco de destino:

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

As mais críticas são estas duas linhas:

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

A primeira linha passa a condição de detalhamento para o bloco JS e a segunda linha aciona a atualização do bloco JS.

Por fim, vincule o evento de clique do gráfico:

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

É recomendado aqui que você retorne a limpeza:

```javascript
return () => chart.off('click', clickHandler);
```

Dessa forma, quando o gráfico é reconfigurado ou renderizado novamente, os eventos antigos podem ser limpos para evitar vinculações repetidas.

O código relacionado ao evento de clique acima é aplicável a versões [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) e superiores. Referência ao código da versão antiga:

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. Como exibir detalhes em blocos JS detalhados

![](https://static-docs.nocobase.com/202607121921601.png)

Faça uma busca detalhada no bloco JS para ler o `ticketingDashboardDrilldown` que acabou de ser escrito e, em seguida, consulte os dados de acordo com o filtro nele contido.

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

Se o usuário não clicou no gráfico, exiba um prompt. Após clicar, consulte a ordem de serviço com base em `drilldown.filter`:

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

Em seguida, renderize a tabela:

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

Se precisar limpar as condições de detalhamento, você pode consultar

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

Os pontos-chave nesta parte são:

- O gráfico é responsável apenas por passar no filtro;
- O bloco JS é responsável por consultar e exibir detalhes;
- Clique em gráficos diferentes para compartilhar o mesmo bloco de detalhamento.

---

## Sugestões práticas

### 1. Não se apresse em codificar a página complexa como um todo

A lição mais importante desta página é: não compare os recursos nativos com os recursos JS.

Se um recurso já for nativo do NocoBase, como filtragem, consulta de gráfico, exibição de tabela e controle de permissão, o bloco nativo será usado primeiro. Desta forma, quando os campos, condições de filtro e calibre do gráfico forem ajustados posteriormente, eles ainda poderão ser configurados na interface.

Os blocos JS são mais adequados para processar partes nas quais os blocos nativos não são bons, como combinar vários indicadores em um conjunto de KPIs, estilos de cartão especiais, exibir um conjunto de detalhes personalizados após clicar no gráfico ou passar o contexto de negócios entre diferentes blocos.

Em outras palavras, o bloco nativo é responsável pelos “recursos padrão configuráveis”, e o bloco JS é responsável pela “experiência personalizada voltada para os negócios”. Esta também é a ideia de construção mais reutilizável para este painel.

### 2. Para estatísticas simples, use primeiro o construtor de consultas do bloco gráfico.

Isso preserva os recursos padrão de consulta, permissões, filtragem e atualização do NocoBase. Somente quando o estilo de gráfico padrão não puder expressar o foco do negócio, use a opção ECharts customizada para otimização visual.

### 3. Os cartões KPI dão prioridade ao uso de blocos JS

Os KPIs geralmente exigem múltiplas consultas, combinações de condições e layouts personalizados, e os blocos JS são mais flexíveis. Especialmente quando os KPIs precisam responder ao mesmo conjunto de condições de filtro do sistema, será mais claro usar blocos JS para tratá-los de maneira uniforme.

### 4. Os eventos do gráfico devem retornar a limpeza

Método de escrita recomendado:

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

Não utilize `chart.off('click')` diretamente para limpar todos os eventos de clique, pois isso pode excluir acidentalmente o bloco do gráfico ou configurar o monitoramento do próprio painel.

---

## Deixe a IA ajudá-lo a construí-lo

Esse tipo de painel é muito adequado para geração assistida por IA porque envolve modelos de dados, calibres estatísticos, estilos de gráfico e interações de páginas ao mesmo tempo. Você pode entregar o conteúdo deste artigo e fazer perguntas usando as palavras abaixo.

Você pode fazer perguntas como esta:

```markdown
Estou usando o NocoBase para construir um painel operacional para um sistema de ordens de serviço.
Tome o cenário da ordem de serviço como exemplo e me ajude a projetar um painel de operações.

Os tickets da tabela de dados contêm:
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

A página requer:

1. Filtro superior: Criado em, Grupo de serviço, Tipo de solicitação, Prioridade, Status do SLA.
2. Cartões de KPI: pendências abertas, não atribuídos, aviso de SLA, SLA violado, novos tickets, tickets resolvidos.
3. Gráfico: tendência de tickets criados, status de tickets, status de SLA, mix de prioridades.
4. Após clicar no gráfico, o bloco JS abaixo exibe a tabela detalhada do Ticket correspondente.
5. O estilo do gráfico deve ser adequado ao mercado de atuação, com cores claras e layout compacto.
6. Use ctx.t() para todas as cópias JS.
7. Os eventos do gráfico usam chart.on e retornam a função de limpeza.
8. Priorize o uso de blocos de filtro e blocos de gráfico nativos do NocoBase. Use blocos JS apenas para KPIs, detalhes detalhados, estilos especiais e interações entre blocos. Não escreva a página inteira como um grande bloco JS.

Forneça ideias de configuração para cada bloco e marque o código JS chave.
```

Se você já tem uma página, também pode deixar a IA ajudá-lo a otimizá-la:

```markdown
Este é o design atual do meu painel NocoBase:
No topo está a área de filtro, no meio estão 4 gráficos e abaixo está o bloco JS de detalhamento.
Por favor, ajude-me a otimizar do ponto de vista da experiência do operador:

1. Quais indicadores o KPI deve exibir?
2. Se há necessidade de ligação entre gráficos;
3. Quais colunas devem ser exibidas nos detalhes do detalhamento;
4. Como devem ser organizados os eventos de bloco e gráfico JS;
5. Qual código deve ser colocado na opção customizada do gráfico e qual deve ser colocado no bloco JS.
```

Dessa forma, o conteúdo gerado pela IA ficará mais próximo do negócio real, ao invés de apenas fornecer código isolado.

:::warning
Se você optar por deixar a IA ajudá-lo a construí-lo, use o gerenciador de backup para fazer backup do projeto antes de iniciá-lo.
:::

## Documentação de referência

- [Configuração do gráfico ](/data-visualization/guide/chart-options)
- [Execução de front-endJS](/runjs/)
- [Formulário de filtro ](/interface-builder/blocks/filter-blocks/form)
- [Construção de IA - Construção de Interface ](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)
