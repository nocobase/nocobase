---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Resposta HTTP

## Introdução

Este nó é suportado apenas em **fluxos de trabalho** Webhook síncronos e serve para retornar uma resposta a um sistema de terceiros. Por exemplo, durante o processamento de um callback de pagamento, se o processo de negócio apresentar um resultado inesperado (como um erro ou falha), você pode usar o nó de resposta para retornar uma resposta de erro ao sistema de terceiros, permitindo que alguns sistemas de terceiros tentem novamente mais tarde com base no status.

Além disso, a execução do nó de resposta irá encerrar a execução do **fluxo de trabalho**, e os nós subsequentes não serão executados. Se nenhum nó de resposta for configurado em todo o **fluxo de trabalho**, o sistema responderá automaticamente com base no status de execução do fluxo: retornando `200` para uma execução bem-sucedida e `500` para uma execução com falha.

## Criando um Nó de Resposta

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição (“+”) no fluxo para adicionar um nó de “Resposta”:

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Configuração da Resposta

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Você pode usar variáveis do contexto do **fluxo de trabalho** no corpo da resposta.