---
title: "Desenvolvimento de plugins para funcionários de IA"
description: "Apresenta a relação entre Tools, Skills, funcionários de IA integrados e a UI de Tools no frontend dos plugins NocoBase, além das convenções de diretório e da trilha de aprendizado."
keywords: "NocoBase,desenvolvimento de plugins para funcionários de IA,Tool,Skill,defineAIEmployee,src/ai"
---

# Desenvolvimento de plugins para funcionários de IA

No NocoBase, um plugin pode disponibilizar suas próprias capacidades de negócio aos funcionários de IA. Três pontos de extensão cuidam de camadas diferentes:

- **Tool (ferramenta)** — executa operações específicas, como consultar dados, chamar APIs e alterar registros
- **Skill (habilidade)** — informa ao modelo quando usar as ferramentas e quais etapas seguir para concluir uma tarefa
- **Funcionário de IA integrado (Built-in AI Employee)** — reúne perfil, prompt de sistema, habilidades e ferramentas em um funcionário pronto para uso

Normalmente, não é necessário chamar manualmente uma API de registro. Depois que os arquivos são colocados nos diretórios convencionais de `src/ai` do plugin, o NocoBase faz a varredura e o registro durante o carregamento. Somente quando uma Tool precisa de cartão personalizado, modal ou lógica de execução no navegador é necessário registrar o componente ou a lógica correspondente em `src/client-v2/plugin.tsx`.

Antes de começar, verifique se o aplicativo tem o `@nocobase/plugin-ai` instalado e habilitado. O código do plugin pode usar os tipos e as funções de definição fornecidos por `@nocobase/ai` e `@nocobase/actions`.

:::tip Leitura prévia

- [Escrever seu primeiro plugin](../../../plugin-development/write-your-first-plugin.md) — se você ainda não tem experiência com plugins, conheça primeiro a estrutura de diretórios e o processo de build e ativação
- [Funcionários de IA](../../index.md) — familiarize-se primeiro com a configuração e o uso básico dos funcionários de IA

:::


## Índice rápido

| Quero... | Onde consultar |
| --- | --- |
| Permitir que a IA chame uma operação no servidor | [Definir uma Tool no servidor](./define-tool.md) |
| Definir o fluxo de chamada de várias Tools | [Definir uma Skill](./define-skill.md) |
| Fornecer um papel fixo de IA junto com o plugin | [Definir um funcionário de IA integrado](./define-ai-employee.md) |
| Ver como combinar Tool, Skill e funcionário em um exemplo completo | [Exemplo completo: criar um funcionário de IA integrado](./complete-example.md) |
| Adicionar confirmação, seleção ou edição a uma Tool | [Adicionar interação no frontend a uma Tool](./frontend-tool-ui.md) |
| Traduzir a interface de administração de Tools e Skills | [Internacionalização de plugins para funcionários de IA](./internationalization.md) |
| Solucionar problemas de registro, vínculo e execução | [Problemas comuns](./troubleshooting.md) |

## Primeiro, decida qual camada será ampliada

Tool, Skill e funcionário de IA integrado não são três recursos independentes. Eles formam capacidades combinadas, camada por camada, de baixo para cima. Nem todo plugin precisa implementar as três camadas.

```text
Tool: permite que a IA execute uma ação específica
  ↓
Skill: orienta a IA a concluir um tipo de tarefa seguindo um método definido
  ↓
Funcionário de IA integrado: reúne essas capacidades em um papel fixo e um ponto de acesso
```

Escolha a camada inicial de acordo com a necessidade:

- Se a IA só precisa consultar dados, chamar uma API ou alterar registros, basta definir uma Tool
- Se for necessário definir a ordem de chamada das ferramentas, as etapas de confirmação e o formato de saída, crie também uma Skill para essas Tools
- Se o plugin deve oferecer diretamente um papel fixo quando for habilitado, crie também um funcionário de IA integrado e vincule a Skill e as Tools correspondentes

Quando as três camadas são usadas, uma tarefa é executada nesta ordem:

1. O usuário envia uma tarefa ao funcionário de IA
2. O funcionário de IA determina qual Skill usar com base no prompt de sistema
3. A Skill informa ao modelo quais Tools chamar e em que ordem
4. A Tool executa uma consulta, gravação ou solicitação externa e retorna o resultado
5. O funcionário de IA organiza a resposta final com base no resultado da Tool

O cartão de uma Tool no frontend não é uma quarta camada. Ele apenas adiciona uma interface de interação ao ToolCall quando a Tool precisa que o usuário confirme, selecione uma opção ou edite parâmetros.

## Coloque os recursos de IA em `src/ai`

O NocoBase encontra os recursos de IA de um plugin conforme a convenção de diretórios. Em uma estrutura padrão de plugin, basta colocar Tools, Skills e funcionários de IA integrados em `src/ai`; não é preciso registrá-los um a um em `src/server/plugin.ts`, dentro de `load()`.

Uma estrutura completa pode ser organizada assim:

```text
src/ai/
├── tools/
│   └── searchDocs.ts
├── skills/
│   └── document-search/
│       ├── SKILLS.md
│       └── tools/
│           └── readDocument.ts
└── ai-employees/
    ├── translator.ts
    └── developer/
        ├── index.ts
        ├── prompt.md
        ├── skills/
        └── tools/
```

Cada local corresponde a uma forma de registro:

| Arquivo ou diretório | Como o NocoBase processa |
| --- | --- |
| `src/ai/tools/<name>.ts` | Registra uma Tool independente |
| `src/ai/skills/<name>/SKILLS.md` | Registra uma Skill |
| `tools/` dentro do diretório da Skill | Registra a Tool e a vincula automaticamente à Skill atual |
| `src/ai/ai-employees/<name>.ts` | Registra um funcionário de IA integrado em um único arquivo |
| `src/ai/ai-employees/<name>/index.ts` | Registra um funcionário de IA integrado em formato de diretório |
| `prompt.md` dentro do diretório do funcionário de IA | É usado como prompt de sistema padrão do funcionário |
| `skills/` e `tools/` dentro do diretório do funcionário de IA | Registra os recursos e os vincula automaticamente ao funcionário atual |

Ao carregar o plugin, o NocoBase conclui as seguintes etapas, nesta ordem, antes de executar o método `load()` do próprio plugin:

1. Faz a varredura e registra as Tools
2. Analisa `SKILLS.md` e vincula as Tools do diretório da Skill à Skill correspondente
3. Carrega o funcionário de IA integrado e combina o `prompt.md`, as Skills e as Tools presentes no diretório do funcionário

`src/client-v2` não faz parte desses diretórios de varredura automática. Um registro adicional em `src/client-v2/plugin.tsx` só é necessário quando a Tool precisa de cartão, modal ou lógica de execução no navegador.

## Referência rápida de pontos de extensão e diretórios

| Ponto de extensão | Responsabilidade | Local padrão |
| --- | --- | --- |
| Tool | Executar operações específicas, como consultas, gravações ou solicitações externas | `src/ai/**/tools/` |
| Skill | Definir o fluxo de processamento, a ordem de chamada das Tools e as restrições da saída | `src/ai/**/skills/<name>/SKILLS.md` |
| Funcionário de IA integrado | Definir um papel fixo e reunir prompt de sistema, Skills e Tools | `src/ai/ai-employees/` |
| Cartão de Tool no frontend | Exibir o ToolCall e coletar ações de confirmação, edição ou rejeição | `src/client-v2/` |

Por padrão, implemente primeiro a Tool. Adicione uma Skill quando precisar de um fluxo de trabalho fixo e crie um funcionário de IA integrado quando precisar de um papel fixo; adicione um cartão no frontend somente se a Tool exigir interação no navegador.

## Links relacionados

- [Escrever seu primeiro plugin](../../../plugin-development/write-your-first-plugin.md) — crie e execute um plugin NocoBase do zero
- [Visão geral dos funcionários de IA](../../index.md) — conheça os pontos de acesso dos funcionários de IA
- [Guia de engenharia de prompts](../../configuration/prompt-engineering-guide.md) — escreva prompts de sistema e restrições de tarefas
