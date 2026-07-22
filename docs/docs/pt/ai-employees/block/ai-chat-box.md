---
pkg: '@nocobase/plugin-ai'
title: 'Bloco AI Chat box'
description: 'Guia para administradores e criadores de páginas do NocoBase sobre como adicionar um bloco AI Chat box, configurar recursos de conversa, definir Work context, gerenciar conversas e adicionar Actions.'
keywords: 'AI Chat box,Funcionário de IA,bloco de página,Work context,Scope,Actions,NocoBase'
---

# Bloco AI Chat box

No NocoBase, o **AI Chat box** é um bloco de conversa com IA que pode ser adicionado diretamente a uma página. Você pode colocá-lo em uma página de negócio para oferecer um ponto de acesso fixo a um assistente de IA dedicado àquela página.

Cada bloco AI Chat box mantém seu próprio estado de conversa atual e de entrada. Os criadores de páginas também podem limitar os funcionários de IA, modelos, upload de arquivos, pesquisa na web e contexto de trabalho disponíveis para adequar o bloco ao cenário de negócio.

:::tip Antes de começar

Primeiro [configure um serviço de LLM](../features/llm-service.md) e [ative pelo menos um funcionário de IA](../features/enable-ai-employee.md).

:::

## Adicionar um bloco AI Chat box

1. Abra a página que deseja configurar.
2. Clique em `UI Editor` no canto superior direito para entrar no modo de edição da página.
3. Clique em `Add block`.
4. Em `Other blocks`, selecione `AI chat box`.

![Selecionar AI chat box no menu Add block](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## Estrutura do bloco

![Bloco AI Chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

O AI Chat box é dividido em três áreas, de cima para baixo:

- **Área de ações superior** — acesso à lista de conversas, Actions, ações personalizadas e nova conversa; quando a área de mensagens é ocultada, também aparece o botão de mensagens
- **Área de mensagens** — exibe as mensagens do rascunho ou da conversa atual
- **Área de envio** — caixa de entrada, seleção de contexto, upload de arquivos, pesquisa na web, seleção de funcionário de IA, seleção de modelo, botão de envio e aviso legal

### Adicionar conteúdo ao body do bloco

No modo de edição da página, clique em `Add block` dentro do AI Chat box para adicionar um dos blocos abaixo acima da área de chat:

- JS block
- Iframe
- Markdown

Esses blocos são úteis para exibir instruções, páginas externas ou informações complementares. O menu interno oferece apenas esses três tipos de bloco e não permite aninhar outro AI Chat box.

## Configurar o AI Chat box

Mova o ponteiro sobre o bloco e abra o menu de configurações. Clique em `Edit chat box` para configurar o escopo das conversas, a mensagem padrão, Work context, funcionários de IA e modelos.

![Janela de configurações Edit chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Configurações de Edit chat box

| Configuração | Descrição |
| --- | --- |
| `Scope` | Controla quais AI Chat boxes compartilham uma lista de conversas. Um novo bloco usa seu próprio UID por padrão para manter as conversas separadas. |
| `Background` | Adiciona um prompt de sistema após a definição do funcionário de IA para informar a função, o objetivo ou os requisitos de resposta da página atual. |
| `Default user message` | Preenche a área de envio com uma mensagem de usuário padrão ao iniciar uma nova conversa. |
| `Work context` | Seleciona os blocos de página que serão adicionados por padrão a um novo rascunho. |
| `AI employees` | Limita os funcionários de IA de negócio que podem ser selecionados neste bloco. Deixe vazio para permitir todos os funcionários de IA de negócio disponíveis. |
| `Models` | Limita os modelos que podem ser selecionados neste bloco. Deixe vazio para permitir todos os modelos disponíveis. |

### Outras configurações do bloco

| Configuração | Descrição |
| --- | --- |
| `Show messages` | Controla se a área de mensagens é exibida diretamente no bloco. Quando desativado, use o botão de mensagens na parte superior para abrir o painel direito. |
| `Sender placeholder` | Altera o texto de placeholder da área de envio. |
| `Enable add context` | Exibe ou oculta a entrada de seleção de contexto na área de envio. |
| `Enable upload files` | Exibe ou oculta a entrada de upload de arquivos. Quando desativado, colar um arquivo também não inicia o upload. |
| `Enable web search` | Exibe ou oculta o seletor de pesquisa na web. Desativá-lo também desliga a pesquisa na web do rascunho atual. |
| `Enable employee select` | Exibe ou oculta o seletor de funcionários de IA. |
| `Enable model select` | Exibe ou oculta o seletor de modelos. |
| `Show disclaimer` | Exibe ou oculta o aviso de IA abaixo da área de envio. |

## Configurar Work context

Em `Work context`, dentro de `Edit chat box`, clique no botão de adicionar contexto, selecione `Pick block` e escolha o bloco da página que deseja fornecer à IA. Depois de salvar, o bloco selecionado será usado como contexto de trabalho padrão para novas conversas e poderá ser removido da área de envio antes do envio.

## Ocultar as mensagens e usar o painel direito

Depois de desativar `Show messages`, o corpo do bloco mantém apenas a área de envio. Um botão de mensagens aparece na parte superior; clique nele para abrir o painel de mensagens pela direita.

![Painel direito com a área de mensagens oculta](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

Quando o painel está aberto, o restante do bloco fica coberto por uma sobreposição. Clique na sobreposição ou novamente no botão de mensagens para fechar o painel.

Esse layout funciona bem quando o AI Chat box é usado como uma entrada leve na página: normalmente apenas a área de envio fica visível, e o painel é aberto quando for necessário consultar as mensagens.

## Gerenciar o histórico de conversas

Clique no botão da lista de conversas no canto superior esquerdo do bloco para ver o histórico no Scope atual.

Observe estas regras:

- Vários AI Chat boxes com o mesmo Scope podem ver a mesma lista de conversas
- Cada bloco mantém de forma independente a conversa atual, o rascunho da área de envio, o funcionário de IA, o modelo, os anexos e o estado do contexto
- O chatbox flutuante global não filtra pelo Scope do bloco, portanto não oculta conversas que possuem Scope
- Ao limpar o Scope, o bloco deixa de filtrar a lista por Scope e exibe conversas sem Scope e conversas que usam outros Scopes

Normalmente, manter o Scope gerado para um novo bloco é suficiente para separar o histórico de cada assistente de página. Configure o mesmo Scope somente quando vários blocos precisarem compartilhar a mesma lista de conversas.

## Adicionar Actions

No modo de edição da página, clique em `Actions` na parte superior do bloco para adicionar uma das seguintes ações:

- JS Action
- AI employee

Depois de adicionar um AI employee, você pode configurar tarefas de atalho para esse funcionário.

A configuração `Chat box uid` em uma tarefa de atalho especifica em qual AI Chat box a tarefa será executada. Um AI employee adicionado diretamente dentro de um AI Chat box aponta por padrão para o UID do bloco atual.

Se o AI Chat box especificado não estiver montado, o NocoBase informa que o bloco de destino não foi encontrado e não usa o chatbox flutuante global como alternativa. Consulte [Tarefas de atalho dos funcionários de IA](../features/task.md) para obter a configuração detalhada.

## Configurar um assistente específico para uma página

As etapas abaixo criam um assistente de IA leve para uma página:

1. Adicione um bloco AI Chat box e mova-o para a posição adequada na página.
2. Insira um Background específico para a página em `Edit chat box`.
3. Selecione um ou mais Work contexts.
4. Limite os funcionários e modelos disponíveis em `AI employees` e `Models`.
5. Saia do modo de edição, insira uma pergunta e envie.

## Observações

- O bloco AI Chat box e o chatbox flutuante global no canto inferior direito são pontos de entrada separados; a conversa atual e o estado de entrada não são sincronizados automaticamente
- Dentro de um AI Chat box, `Add block` permite adicionar apenas JS block, Iframe e Markdown
- Alterar o Scope afeta o alcance da consulta da lista de conversas e não copia a conversa ou o rascunho aberto atualmente em outro bloco
