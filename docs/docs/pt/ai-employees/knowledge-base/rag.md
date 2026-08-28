---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Geração aumentada por recuperação (RAG)"
description: "Ative o RAG para funcionários de IA, configure Knowledge Base, Retrieval strategy, Top K e Score e controle o acesso às bases de conhecimento por meio dos papéis dos usuários."
keywords: "RAG,geração aumentada por recuperação,recuperação de base de conhecimento,Retrieval strategy,permissões de base de conhecimento,Top K,NocoBase"
---

# Busca RAG

## Introdução

No NocoBase, o **RAG (geração aumentada por recuperação)** permite que um funcionário de IA recupere conteúdo relevante das bases de conhecimento antes de responder a uma pergunta.

As bases de conhecimento que o funcionário de IA pode usar são determinadas tanto pela configuração de `Knowledge Base` do funcionário quanto pelas permissões de base de conhecimento dos papéis do usuário atual. Somente as bases incluídas nos dois escopos participam da busca.

## Configurar as bases de conhecimento de um funcionário de IA

Acesse a página de configuração `AI employees`, selecione o funcionário de IA para o qual deseja ativar o RAG e clique em `Edit`. No painel de edição, abra a aba `Knowledge Base` e ative `Enable`.

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

As configurações disponíveis são:

- `Knowledge Base` — Opcional. Se ficar em branco, o funcionário de IA pesquisará em todas as bases de conhecimento ativadas que os papéis do usuário atual podem acessar. Se você selecionar bases de conhecimento, a pesquisa usará somente as bases selecionadas para as quais o usuário tem permissão
- `Retrieval strategy` — Controla quando a recuperação da base de conhecimento é executada:
  - `Retrieve on demand` — O funcionário de IA recupera conteúdo apenas quando determina que a pergunta atual precisa dele. Novos funcionários de IA usam essa estratégia por padrão, e ela é recomendada para a maioria dos casos
  - `Automatically retrieve for every question` — A recuperação é executada antes de cada pergunta do usuário ser enviada ao funcionário de IA. Use esta opção quando toda interação depender do conteúdo da base de conhecimento
- `Knowledge Base Prompt` — Define como o conteúdo recuperado é fornecido ao funcionário de IA. `{knowledgeBaseData}` é um placeholder fixo; não o remova nem modifique
- `Top K` — O número máximo de resultados retornados em cada recuperação. O intervalo é de 1 a 100, e o padrão é 3
- `Score` — A pontuação mínima de similaridade exigida para um resultado. O intervalo é de 0 a 1, e o padrão é 0,6. Um valor mais alto retorna conteúdo mais relevante, mas pode reduzir a quantidade de resultados

Clique em `Submit` para salvar a configuração.

## Configurar as permissões das bases de conhecimento

Selecionar bases de conhecimento para um funcionário de IA não concede acesso a todos os usuários. Acesse `Users & Permissions / Roles & Permissions`, selecione o papel atribuído ao usuário e abra `Permissions / Knowledge bases`.

Selecione `Available` para cada base de conhecimento que o papel deve poder acessar. Para conceder automaticamente a esse papel acesso às bases de conhecimento criadas no futuro, selecione `New knowledge bases are allowed by default`.

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning Observação

O escopo de bases de conhecimento disponível para um funcionário de IA é a interseção entre sua configuração de `Knowledge Base` e as permissões dos papéis do usuário atual. Bases de conhecimento não autorizadas são excluídas automaticamente.

:::

## Quando o usuário não tem acesso a bases de conhecimento

Se as bases de conhecimento estiverem ativadas para um funcionário de IA, mas o escopo configurado não tiver sobreposição com as permissões dos papéis do usuário atual, o funcionário de IA responderá primeiro com informações que não dependem de uma base de conhecimento. Em seguida, adicionará um aviso destacado informando que nenhum conteúdo da base de conhecimento foi usado porque o usuário não tem acesso e recomendando que ele entre em contato com um administrador.

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

Se o usuário puder acessar pelo menos uma base de conhecimento, mas a pergunta atual não retornar conteúdo relevante, o aviso de falta de permissão não será exibido.

## Links relacionados

- [Base de conhecimento](./knowledge-base/index.md) — Criar e manter bases de conhecimento usadas pela recuperação RAG
- [Papéis e permissões](../../users-permissions/acl/permissions.md) — Configurar o acesso ao sistema, aos menus e aos dados para cada papel
