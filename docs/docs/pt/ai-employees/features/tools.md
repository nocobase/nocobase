---
pkg: '@nocobase/plugin-ai'
title: 'Funcionários de IA Usando Tools'
description: 'Tools definem as capacidades dos Funcionários de IA: General tools, Employee-specific tools, Custom tools, configuração de permissões Ask/Allow.'
keywords: 'Ferramentas de Funcionário de IA,Tools,Ask,Allow,permissões de habilidade,NocoBase'
---

# Usar Tools

Tools definem "o que os Funcionários de IA podem fazer".

## Estrutura de Tools

A página de Tools é dividida em três categorias:

1. `General tools`: compartilhadas por todos os Funcionários de IA, geralmente somente leitura.
2. `Employee-specific tools`: exclusivas do funcionário atual.
3. `Custom tools`: tools personalizadas acionadas pelo trigger "AI employee event" do Workflow, podem ser adicionadas, removidas e ter permissões padrão configuradas.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Permissões de Tools

As permissões de Tools são padronizadas como:

- `Ask`: pergunta antes de executar a chamada.
- `Allow`: permite a chamada direta.

Recomendação: tools que envolvem modificação de dados devem usar `Ask` por padrão.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Apresentação das Tools

### Tools Gerais

| Nome da Tool         | Descrição da Função                                                          |
| -------------------- | ---------------------------------------------------------------------------- |
| Form filler          | Preenche dados em um formulário especificado                                 |
| Chart generator      | Gera configuração JSON de gráficos ECharts                                   |
| Load specific SKILLS | Carrega Skills e as tools necessárias para os Skills                         |
| Suggestions          | Com base no conteúdo da conversa atual e no contexto, sugere o próximo passo |

### Tools Exclusivas

| Nome da Tool                 | Descrição da Função                                                       | Funcionário Proprietário |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------ |
| AI employee task dispatching | Tool de distribuição de trabalho, atribui tarefas com base no tipo de tarefa e nas capacidades do funcionário | Atlas                    |
| List AI employees            | Lista todos os funcionários disponíveis                                   | Atlas                    |
| Get AI employee              | Obtém informações detalhadas de um funcionário especificado, incluindo Skills e Tools | Atlas                    |

### Tools Personalizadas

No módulo de Workflow, crie um Workflow com o tipo de trigger `AI employee event`.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

Em `Custom tools`, clique em `Add tool` para adicionar o Workflow como uma tool e configure as permissões de acordo com o risco do negócio.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
