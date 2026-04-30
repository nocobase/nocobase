---
title: "Introdução ao sistema e dashboards"
description: "Visão geral do CRM 2.0: estrutura de menus, multilíngue e temas, dashboard de análise (Analytics) e painel de trabalho (Overview)."
keywords: "Introdução ao CRM,dashboard,análise de dados,KPI,NocoBase CRM"
---

# Introdução ao sistema e dashboards

> Este capítulo apresenta dois dashboards — Analytics (análise de dados) e Overview (painel de trabalho do dia a dia).

## Visão geral do sistema

O CRM 2.0 é um sistema completo de gestão de vendas que cobre todo o fluxo, do recebimento do Lead à entrega do Pedido. Após o login, a barra de menu superior é o ponto principal de navegação.


### Multilíngue e temas

O sistema suporta troca de idiomas (canto superior direito); todos os JS Blocks e gráficos foram adaptados para múltiplos idiomas.

Quanto a temas, suporta tanto o modo claro quanto o escuro, mas atualmente **recomenda-se o modo claro + compacto**, com maior densidade de informação. Alguns problemas de exibição em tema escuro serão corrigidos posteriormente.

![00-overview-2026-04-01-23-38-28](https://static-docs.nocobase.com/00-overview-2026-04-01-23-38-28.png)

---

## Analytics — Centro de análise de dados

Analytics é a primeira página da barra de menus e também a primeira tela que você vê todo dia ao abrir o sistema.

### Filtros globais

No topo da página há uma barra de filtros, com **intervalo de datas** e **responsável (Owner)**. Após filtrar, todos os cartões de KPI e gráficos da página são atualizados em conjunto.

![00-overview-2026-04-01-23-40-45](https://static-docs.nocobase.com/00-overview-2026-04-01-23-40-45.png)


### Cartões de KPI

Abaixo da barra de filtros há 4 cartões de KPI:

| Cartão | Significado | Ação ao clicar |
|------|------|---------|
| **Receita total** | Valor total de receita acumulada | Modal: gráfico de pizza de status de pagamento + tendência mensal de receita |
| **Novos Leads** | Quantidade de Leads novos no período | Vai para a página de Leads, filtrando automaticamente o status "New" |
| **Taxa de conversão** | Proporção de Leads que se tornam fechamentos | Modal: gráfico de pizza por etapa + gráfico de barras por valor |
| **Ciclo médio de fechamento** | Dias médios da criação ao fechamento | Modal: distribuição de ciclos + tendência mensal de Oportunidades ganhas |

Cada cartão é **clicável** — o modal apresenta gráficos de análise mais detalhados. Se houver capacidade de personalização, é possível continuar drilling down (empresa → departamento → indivíduo).

![00-overview-2026-04-01-23-42-33](https://static-docs.nocobase.com/00-overview-2026-04-01-23-42-33.gif)

:::tip[Dados ficaram menores depois de navegar?]
Ao clicar num KPI e ir para a página de listagem, a URL leva o parâmetro de filtro (como `?status=new`). Se você notar que os dados ficaram reduzidos, é porque esse parâmetro continua aplicado. Volte ao dashboard e acesse novamente a lista para restaurar os dados completos.
:::

![00-overview-2026-04-01-23-44-19](https://static-docs.nocobase.com/00-overview-2026-04-01-23-44-19.png)


### Área de gráficos

Abaixo dos KPIs há 5 gráficos centrais:

| Gráfico | Tipo | Descrição | Ação ao clicar |
|------|------|------|---------|
| **Distribuição por etapa de Oportunidade** | Barra | Quantidade, valor e probabilidade ponderada por etapa | Modal: drill por Cliente/responsável/mês |
| **Funil de vendas** | Funil | Conversão Lead → Opportunity → Quotation → Order | Vai para a página da entidade correspondente |
| **Tendência mensal de vendas** | Barra + linha | Receita mensal, número de Pedidos, ticket médio | Vai para Orders (com parâmetro de mês) |
| **Tendência de crescimento de Clientes** | Barra + linha | Novos Clientes mensais e total acumulado | Vai para Customers |
| **Distribuição por setor** | Pizza | Distribuição de Clientes por setor | Vai para Customers |

![00-overview-2026-04-01-23-46-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-46-36.png)

#### Funil de vendas

Mostra a taxa de conversão completa do pipeline Lead → Opportunity → Quotation → Order. Cada nível é clicável e vai para a lista da entidade correspondente (por exemplo, clicar no nível Opportunity → vai para a lista de Oportunidades).

#### Tendência mensal de vendas

O gráfico de barras exibe a receita mensal; a linha sobreposta mostra a quantidade de Pedidos e o ticket médio. Ao clicar em uma barra de mês → vai para a página de Orders com o filtro de tempo desse mês aplicado (como `?month=2026-02`), exibindo diretamente os Pedidos do mês.

#### Tendência de crescimento de Clientes

O gráfico de barras exibe os novos Clientes por mês; a linha mostra o total acumulado de Clientes. Ao clicar em uma barra → vai para a página de Customers, filtrando os novos Clientes daquele mês.

#### Distribuição por setor

O gráfico de pizza mostra a distribuição de Clientes por setor e o valor associado dos Pedidos. Ao clicar em um setor → vai para a página de Customers, filtrando os Clientes desse setor.

### Drill na etapa de Oportunidade

Ao clicar em uma barra de etapa no gráfico de distribuição de Oportunidades, abre uma análise aprofundada dessa etapa:

- **Tendência mensal**: variação mensal das Oportunidades nessa etapa
- **Por responsável**: quem está acompanhando essas Oportunidades
- **Por Cliente**: Clientes com Oportunidades nessa etapa
- **Total no rodapé**: ao selecionar Clientes, é possível ver o valor acumulado

![00-overview-2026-04-01-23-49-04](https://static-docs.nocobase.com/00-overview-2026-04-01-23-49-04.png)


O conteúdo de drill de cada etapa (Prospecting / Analysis / Proposal / Negotiation / Won / Lost) é diferente, refletindo o foco de cada uma.

A pergunta central que esse gráfico responde é: **em qual etapa o funil mais perde Oportunidades?** Se a etapa Proposal acumula muitas Oportunidades, mas poucas avançam para Negotiation, é sinal de que a etapa de cotação pode ter algum problema.

![00-overview-2026-04-01-23-48-21](https://static-docs.nocobase.com/00-overview-2026-04-01-23-48-21.gif)

### Configuração dos gráficos (avançado)

Cada gráfico tem três dimensões de configuração nos bastidores:

1. **Fonte de dados SQL**: define o que o gráfico exibe; pode ser validada no construtor de SQL
2. **Estilo do gráfico**: configuração JSON na área customizada, controlando o visual
3. **Eventos**: comportamento ao clicar (modal OpenView / navegação)

![00-overview-2026-04-01-23-51-00](https://static-docs.nocobase.com/00-overview-2026-04-01-23-51-00.png)


### Filtros sincronizados

Quando você altera qualquer condição na barra de filtros do topo, **todos os cartões de KPI e gráficos da página são atualizados ao mesmo tempo**, sem precisar configurar um a um. Usos típicos:

- **Ver desempenho de uma pessoa**: Owner = "João" → toda a página passa a mostrar Leads, Oportunidades e Pedidos sob responsabilidade do João
- **Comparar períodos**: data muda de "Este mês" para "Este trimestre" → o intervalo dos gráficos de tendência se ajusta

A integração entre a barra de filtros e os gráficos é feita pelo **fluxo de eventos da página** — antes da renderização, as variáveis do formulário são injetadas e o SQL dos gráficos referencia esses valores de filtro.

![00-overview-2026-04-01-23-52-29](https://static-docs.nocobase.com/00-overview-2026-04-01-23-52-29.png)

![00-overview-2026-04-01-23-53-57](https://static-docs.nocobase.com/00-overview-2026-04-01-23-53-57.png)
:::note
Atualmente os templates SQL suportam apenas a sintaxe `if` para condicionais. Recomenda-se basear-se nos templates já existentes no sistema ou pedir ajuda à AI para fazer ajustes.
:::

---

## Overview — Painel de trabalho do dia a dia

Overview é o segundo dashboard, voltado às operações do dia a dia, e não à análise de dados. Ele responde à pergunta: **o que devo fazer hoje? Quais Leads merecem acompanhamento?**

![00-overview-2026-04-01-23-56-07](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-07.png)


### Leads de alta pontuação

Filtra automaticamente Leads com pontuação de AI ≥ 75 e status New / Working (Top 5); cada item exibe:

- **Medidor de pontuação por AI**: medidor circular com a qualidade do Lead (verde = alta = priorize o acompanhamento)
- **Próxima ação recomendada por AI**: ação sugerida pelo sistema com base nas características do Lead (como "Schedule a demo")
- **Informações básicas do Lead**: nome, empresa, origem, data de criação

Clique no nome do Lead para abrir os detalhes; clique em "Ver tudo" para ir à lista de Leads. Bater o olho nessa lista todo dia já é suficiente para saber com quem você deve falar primeiro.

![00-overview-2026-04-01-23-56-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-36.png)

### Tarefas de hoje

Lista de atividades do dia (reuniões, ligações, tarefas etc.), com suporte a:

- **Concluir com um clique**: clique em "Done" para marcar como concluída; ela fica acinzentada
- **Lembrete de atraso**: tarefas vencidas e não concluídas ficam destacadas em vermelho
- **Ver detalhes**: clique no nome da tarefa para abrir os detalhes
- **Criar tarefa**: crie um novo registro de atividade direto aqui

![00-overview-2026-04-01-23-57-09](https://static-docs.nocobase.com/00-overview-2026-04-01-23-57-09.png)

### Calendário de atividades

Calendário FullCalendar, com cores por tipo de atividade (reunião / ligação / tarefa / e-mail / nota). Suporta visualizações mês/semana/dia, arrastar para reagendar e clicar para ver detalhes.

![00-overview-2026-04-01-23-58-02](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-02.gif)

---

## Outros dashboards (More Charts)

No menu há ainda três dashboards para diferentes Perfis, apenas como referência; podem ser mantidos ou ocultados conforme a necessidade:

| Dashboard | Público-alvo | Características |
|--------|---------|------|
| **SalesManager** | Gerente de vendas | Ranking da equipe, gráfico de dispersão de risco, metas mensais |
| **SalesRep** | Representante de vendas | Dados filtrados automaticamente pelo usuário atual; mostra apenas o desempenho próprio |
| **Executive** | Executivo | Previsão de receita, saúde do Cliente, tendência de Win/Loss |

![00-overview-2026-04-01-23-58-39](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-39.png)

Dashboards desnecessários podem ser ocultados no menu, sem afetar as funcionalidades do sistema.

![00-overview-2026-04-02-00-02-39](https://static-docs.nocobase.com/00-overview-2026-04-02-00-02-39.png)

---

## Drill-through de KPIs

Você já deve ter percebido que quase todos os números e gráficos apresentados acima são "clicáveis". Esse é o padrão de interação central do CRM — **drill-through de KPIs**: clicar em um número agregado → ver os dados detalhados por trás dele.

Há duas formas de drill-through:

| Forma | Cenário | Exemplo |
|------|---------|------|
| **Drill em modal** | Análise comparativa multidimensional | Clicar em "Receita total" → modal com pizza + tendência |
| **Navegação para página** | Ver e operar registros detalhados | Clicar em "Novos Leads" → vai para a lista de Leads |

**Exemplo de uso**: no gráfico "Tendência mensal de vendas" do Analytics, você nota que a barra de receita de fevereiro está bem abaixo → clica nessa barra → o sistema vai para a página de Orders com `mês = 2026-02` aplicado → você vê todos os Pedidos de fevereiro e pode investigar a causa.

> O dashboard não é só para "olhar", ele é o eixo de navegação de todo o sistema. Cada número é uma porta de entrada que leva você do macro ao micro, encontrando a raiz do problema camada por camada.

---

Depois de conhecer a visão geral do sistema e os dashboards, é hora de entrar no fluxo principal de negócio — começando pela [Gestão de Leads](./guide-leads).

## Páginas relacionadas

- [Guia de operação do CRM](./index.md)
- [Gestão de Leads](./guide-leads)
- [Funcionários de AI](./guide-ai)
