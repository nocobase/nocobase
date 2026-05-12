---
title: 'Configurar modelos de funcionários de IA'
description: 'Configurar modelos de funcionários de IA.'
keywords: 'AI Employee model settings,dedicated model,model scope,LLM service,NocoBase AI'
---

# Configurar modelos de funcionários de IA

Por padrão, funcionários de IA podem usar todos os serviços LLM e modelos habilitados. Administradores podem ativar modelos dedicados para um funcionário e limitar seu escopo.

## Pré-requisitos

- O plugin **AI Employees** está habilitado.
- Há pelo menos um serviço LLM configurado.
- O funcionário de IA de destino está habilitado.

Para configurar o serviço LLM, consulte [Configurar serviço LLM](/ai-employees/features/llm-service).

## Pontos de entrada

Acesse `System Settings -> AI Employees -> AI employees`, abra o funcionário a configurar e mude para `Model settings`.

![](https://static-docs.nocobase.com/202605121216415.png)

## Ativar configurações de modelo dedicado

Depois de ativar `Enable dedicated model configuration`, selecione em `Models` os modelos permitidos.

- O seletor de modelo no chat mostra apenas modelos selecionados.
- Tarefas rápidas e nós de workflow só podem usar modelos selecionados.

:::info{title=Dica}
Se a configuração dedicada estiver ativa sem modelo selecionado, nenhum modelo disponível será resolvido.
:::

## Desativar configurações de modelo dedicado

Depois de desativar, as regras padrão voltam a valer:

- Pode usar todos os modelos LLM habilitados.
- Sem seleção manual, o sistema usa o modelo global padrão.

## Regras de resolução de modelo

Ao executar uma tarefa, o modelo final é resolvido nesta ordem:

1. Se as configurações de modelo dedicado estiverem ativadas, resolver primeiro dentro do escopo de modelos selecionados.
2. Se a solicitação especificar um modelo permitido, usar esse modelo.
3. Se o modelo especificado não for permitido, usar o primeiro modelo permitido.
4. Se as configurações dedicadas não estiverem ativadas, preferir o modelo especificado pela solicitação.
5. Se nenhum modelo for especificado, usar o modelo global padrão.

## Recomendações

- Se não for possível implantar localmente, escolha um modelo especializado em tradução em vez de um modelo de chat geral.
- A concorrência pode ser ajustada conforme a capacidade do modelo para controlar vazão, tempo de resposta e custo.

## FAQ

### Por que a lista de modelos está vazia?

Geralmente não há serviço LLM configurado ou modelo habilitado. Verifique `Enabled Models`.

### Por que usuários não podem trocar para outros modelos?

Com configuração dedicada ativa, apenas o escopo de modelos selecionado fica disponível.

### Quais entradas são afetadas?

Afeta novos chats, tarefas rápidas, nós AI Employee de workflow e tarefas integradas do plugin. Mensagens históricas não são regeneradas.
