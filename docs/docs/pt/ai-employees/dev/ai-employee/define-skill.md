---
title: "Definir uma Skill"
description: "Apresenta o frontmatter, o corpo do prompt, o vínculo com Tools e a descoberta automática por diretório do SKILLS.md de funcionários de IA do NocoBase."
keywords: "NocoBase,Skill de funcionário de IA,SKILLS.md,vínculo entre Skill e Tool,business-analysis-report"
---

# Definir uma Skill

Uma Skill não executa código. Ela é um guia operacional fornecido ao modelo para definir o fluxo de processamento, as ferramentas disponíveis, as etapas de verificação e os requisitos de saída.

## Diretório da Skill

Cada Skill usa um diretório próprio:

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

Nele:

- `SKILLS.md` define os metadados e o corpo do prompt
- `tools/` armazena Tools usadas apenas em conjunto com essa Skill
- As Tools encontradas em `tools/` são adicionadas automaticamente à lista de ferramentas dessa Skill

## Frontmatter de `SKILLS.md`

Uma Skill mínima tem esta forma:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

Os campos comuns do frontmatter são:

| Campo | Função |
| --- | --- |
| `scope` | Escopo de uso da Skill; quando omitido, é `SPECIFIED` |
| `name` | Nome único da Skill |
| `description` | Ajuda o modelo a decidir quando carregar a Skill |
| `introduction.title` | Título exibido na interface de administração |
| `introduction.about` | Descrição exibida na interface de administração |
| `tools` | Lista de nomes de Tools adicionais que devem ser vinculadas |

O corpo da Skill é armazenado sem alterações e adicionado ao contexto do modelo quando a Skill é carregada. O texto deve se concentrar no fluxo de trabalho e nas restrições, sem repetir os detalhes de implementação das Tools.

## Vincular uma Tool à Skill

Há duas formas.

A primeira é declará-la explicitamente no frontmatter:

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

A segunda é colocar a Tool no diretório `tools/` da Skill atual:

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

O carregador encontra `greetDeveloper` automaticamente e a inclui na lista de ferramentas da Skill. Por padrão, recomenda-se manter uma Tool exclusiva no diretório da própria Skill, para que sua localização expresse a relação de vínculo.

## Como escrever uma boa Skill

Uma Skill útil geralmente inclui:

1. Papel e limites da tarefa
2. Ordem obrigatória de processamento
3. Tool que deve ser chamada em cada etapa
4. Situações que exigem confirmação do usuário
5. Tratamento de falhas das Tools
6. Estrutura da saída final e condições de validação

Se uma Tool altera dados, a Skill deve instruir explicitamente o modelo a aguardar um resultado bem-sucedido, sem afirmar antes da chamada que a operação foi concluída.

## Exemplo de Skill integrada: `business-analysis-report`

O arquivo `packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` divide a análise de negócios em um fluxo de trabalho claro:

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

O corpo não diz apenas “gere um relatório de negócios”. Ele também determina:

- Compreender primeiro o objetivo da decisão, o público, o período e os indicadores
- Quando houver dados de negócio, o primeiro ToolCall deve carregar a Skill `data-query`
- Não deduzir tabelas de dados, caminhos de associação nem resultados de consultas
- Chamar `businessReportGenerator` somente depois que os dados estiverem prontos
- Gerar os gráficos e o relatório Markdown no mesmo ToolCall
- Determinar o sucesso com base em `status`, `chartCount`, `errors` e `warnings` retornados pela Tool
- Se o gráfico falhar, tentar apenas mais uma vez e depois retornar para um relatório somente em Markdown

Esse tipo de regra é o principal valor de uma Skill: transformar “o que o modelo pode fazer” em um processo repetível e verificável.

## Links relacionados

- [Desenvolvimento de plugins para funcionários de IA](./index.md) — entenda onde a Skill se encaixa nas extensões de funcionários de IA
- [Definir uma Tool no servidor](./define-tool.md) — defina uma Tool que a Skill possa chamar
- [Definir um funcionário de IA integrado](./define-ai-employee.md) — vincule a Skill a um funcionário fixo
- [Exemplo completo: criar um funcionário de IA integrado](./complete-example.md) — veja um exemplo completo de vínculo entre Skill e Tool
