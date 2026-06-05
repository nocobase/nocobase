---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Visão Geral

O plugin de visualização de dados do NocoBase oferece consultas de dados visuais e um conjunto rico de componentes de gráfico. Com uma configuração simples, você pode criar rapidamente painéis de visualização, apresentar insights e dar suporte à análise e exibição de dados multidimensionais.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Conceitos Básicos
- Bloco de gráfico: Um componente de gráfico configurável em uma página que suporta consulta de dados, opções de gráfico e eventos de interação.
- Consulta de dados (Builder / SQL): Configure visualmente com o Builder ou escreva SQL para buscar dados.
- Medidas (Measures) e Dimensões (Dimensions): Medidas são usadas para agregação numérica; Dimensões agrupam dados (por exemplo, data, categoria, região).
- Mapeamento de campos: Mapeie as colunas do resultado da consulta para os campos principais do gráfico, como `xField`, `yField`, `seriesField` ou `Category / Value`.
- Opções de gráfico (Básico / Personalizado): O Básico configura propriedades comuns visualmente; o Personalizado retorna uma `option` completa do ECharts via JS.
- Executar consulta: Execute a consulta e busque dados no painel de configuração; você pode alternar para Tabela / JSON para inspecionar os dados retornados.
- Pré-visualizar e Salvar: A pré-visualização é temporária; clicar em Salvar grava a configuração no banco de dados e a aplica oficialmente.
- Variáveis de contexto: Reutilize informações de contexto da página, usuário e filtro (por exemplo, `{{ ctx.user.id }}`) em consultas e na configuração do gráfico.
- Filtros e interligação: Blocos de filtro em nível de página coletam condições unificadas, mesclam-nas automaticamente nas consultas do gráfico e atualizam os gráficos interligados.
- Eventos de interação: Registre eventos via `chart.on` para habilitar comportamentos como destaque, navegação e detalhamento (drill-down).

## Instalação
A visualização de dados é um plugin integrado do NocoBase; ele funciona pronto para uso, sem a necessidade de instalação separada.