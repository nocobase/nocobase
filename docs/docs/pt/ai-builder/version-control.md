---
title: "Controle de Versão"
description: "O Skill de Controle de Versão (nocobase-revision) cria versões restauráveis da aplicação depois que o AI Builder conclui marcos."
keywords: "AI Builder,controle de versão,nocobase-revision,nb revision create,restaurar versão"
---

# Controle de Versão

:::tip Pré-requisitos

- Antes de ler esta página, instale o NocoBase CLI e conclua a inicialização conforme o [Início Rápido do AI Builder](./index.md)
- Ative os plugins Backup Management e Version Control
- As edições Community e Standard não incluem o plugin Version Control. Se você só precisa manter um ponto de retorno antes de mudanças importantes, use [Backup Management](../ops-management/backup-manager/index.mdx)

:::

## Introdução

O Skill de Controle de Versão (`nocobase-revision`) cria uma versão restaurável da aplicação depois que o AI Builder conclui um marco significativo. Por exemplo, depois de construir uma página, criar um conjunto de collections ou configurar um workflow, a IA pode executar `nb revision create` para salvar o estado atual.

Ele não cria uma versão para cada alteração de campo. Por padrão, salva apenas depois que um marco claro é concluído e verificado, para que a lista de versões continue fácil de ler e os pontos de restauração sejam mais simples de escolher.

Para lista de versões, criação manual, restauração e política de retenção, consulte o [guia do plugin Version Control](../ops-management/version-control/index.md).

## Capacidades

Pode fazer:

- Criar uma versão depois que um marco de construção for concluído e verificado
- Escrever uma descrição breve explicando o que foi salvo
- Criar versões usando o ambiente CLI atual

Não pode fazer:

- Substituir as capacidades base de salvar e restaurar do plugin Backup Management
- Criar versões quando o plugin Version Control não estiver ativado
- Restaurar automaticamente para uma versão. Use o [plugin Version Control](../ops-management/version-control/index.md) para restaurar versões

## Exemplos de Prompt

### Cenário A: Salvar uma configuração de página concluída

```text
Salve a construção atual como versão: página de gerenciamento de clientes, área de filtros e formulário de edição concluídos
```

O Skill transforma a descrição em uma nota curta de versão e cria a versão.

Modo de comando:

```bash
nb revision create "Página de gerenciamento de clientes, área de filtros e formulário de edição concluídos"
```

### Cenário B: Salvar modelo de dados e workflow

```text
As collections de fornecedores e o workflow de aprovação de compras já foram verificados. Crie uma versão.
```

É adequado para trabalhos que combinam várias capacidades. Por exemplo, criar collections com [Modelagem de Dados](./data-modeling), configurar um processo de aprovação com [Gerenciamento de Workflow](./workflow), verificar o resultado e então salvar uma versão.

### Cenário C: Criar uma versão em um ambiente específico

```text
No ambiente dev, salve uma versão: página de gerenciamento de tickets e campos SLA concluídos
```

Se o ambiente especificado não for o ambiente CLI atual, o Skill confirma primeiro o destino para evitar salvar a versão na aplicação errada.

Modo de comando:

```bash
nb revision create --env dev --yes "Página de gerenciamento de tickets e campos SLA concluídos"
```

## Como Escrever Descrições de Versão

A descrição da versão deve dizer o que foi concluído, em vez de usar apenas um rótulo vago.

Recomendado:

- `Cadastro de clientes, página de detalhes e fluxo de aprovação concluídos`
- `Collections de fornecedores, formulário de solicitação de compra e workflow de aprovação concluídos`
- `Completed customer detail page, edit form, and submission workflow wiring`

Não recomendado:

- `snapshot`
- `backup`
- `test`
- `version 2`
- Apenas data ou timestamp

Além disso, não inclua tokens, URLs, senhas ou outras informações sensíveis na descrição. Ela aparece na lista de versões e deve permanecer clara, legível e auditável.

## FAQ

**Quando devo criar uma versão?**

Depois de um marco que possa ser revisado de forma independente. Por exemplo, uma página abre e permite edição corretamente, as relações entre collections foram verificadas, ou um workflow foi salvo e sua cadeia de nodes foi revisada.

**Por que não criar uma versão após cada ajuste da IA?**

Muitas versões pequenas tornam a lista difícil de ler rapidamente. Normalmente, uma versão deve representar um ponto para o qual você pode voltar e continuar trabalhando, não apenas uma renomeação de campo ou mudança de posição de botão.

**O resultado precisa ser verificado antes de criar a versão?**

Sim. O Skill de Controle de Versão serve para salvar resultados concluídos e verificados. Se uma página ainda apresenta erro ou um workflow ainda não foi confirmado, peça para a IA corrigir e verificar primeiro.

**Onde restauro uma versão?**

Na lista de versões do plugin Version Control. A restauração sobrescreve a configuração atual da aplicação e os dados incluídos nessa versão. Antes de operar, leia o [guia do plugin Version Control](../ops-management/version-control/index.md).

## Links Relacionados

- [Guia do plugin Version Control](../ops-management/version-control/index.md) — criar versões manualmente, restaurá-las e configurar regras
- [Backup Management](../ops-management/backup-manager/index.mdx) — capacidade base exigida pelo Version Control
- [Visão geral do AI Builder](./index.md) — visão geral e instalação de todos os Skills do AI Builder
- [Gerenciamento de Publicação](./publish.md) — publicação entre ambientes, backup, restauração e migração
