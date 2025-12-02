---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Mensagem de Resposta

## Introdução

O nó de mensagem de resposta é utilizado para enviar mensagens personalizadas do fluxo de trabalho de volta ao cliente que iniciou a ação, em tipos específicos de fluxos de trabalho.

:::info{title=Nota}
Atualmente, é suportado para uso em fluxos de trabalho do tipo "Evento antes da ação" e "Evento de ação personalizada" no modo síncrono.
:::

## Criando um Nó

Em tipos de fluxo de trabalho suportados, você pode adicionar um nó de "Mensagem de resposta" em qualquer lugar do fluxo de trabalho. Basta clicar no botão de mais ('+') no fluxo de trabalho para adicioná-lo:

![Adicionando um nó](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

A mensagem de resposta é mantida como um array ao longo de todo o processo da requisição. Sempre que um nó de mensagem de resposta é executado no fluxo de trabalho, o novo conteúdo da mensagem é adicionado a esse array. Quando o servidor envia a resposta, todas as mensagens são enviadas ao cliente de uma só vez.

## Configuração do Nó

O conteúdo da mensagem é uma string de modelo (template string) na qual você pode inserir variáveis. Na configuração do nó, você pode organizar esse conteúdo de modelo como desejar:

![Configuração do nó](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Quando o fluxo de trabalho chega a este nó, o modelo é analisado e o conteúdo da mensagem resultante é gerado. Na configuração acima, a variável "Variável local / Iterar todos os produtos / Objeto de iteração / Produto / Título" será substituída por um valor específico durante a execução do fluxo de trabalho, por exemplo:

```
Produto "iPhone 14 pro" com estoque insuficiente
```

![Conteúdo da mensagem](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

## Configuração do Fluxo de Trabalho

O status da mensagem de resposta é determinado pelo sucesso ou falha da execução do fluxo de trabalho. A falha na execução de qualquer nó causará a falha de todo o fluxo de trabalho. Nesse caso, o conteúdo da mensagem será retornado ao cliente com um status de falha e uma notificação será exibida.

Se você precisar definir ativamente um estado de falha no fluxo de trabalho, você pode usar um "Nó de término" e configurá-lo para um estado de falha. Quando este nó é executado, o fluxo de trabalho é encerrado com um status de falha, e a mensagem é retornada ao cliente também com um status de falha.

Se o fluxo de trabalho não apresentar nenhum estado de falha e for executado com sucesso até o fim, o conteúdo da mensagem será retornado ao cliente com um status de sucesso.

:::info{title=Nota}
Se você definir vários nós de mensagem de resposta no fluxo de trabalho, os nós que forem executados adicionarão o conteúdo da mensagem a um array. Quando finalmente retornarem ao cliente, todo o conteúdo da mensagem será retornado e exibido em conjunto.
:::

## Casos de Uso

### Fluxo de trabalho "Evento antes da ação"

Ao usar uma mensagem de resposta em um fluxo de trabalho "Evento antes da ação", você pode enviar um feedback de mensagem correspondente ao cliente após o término do fluxo de trabalho. Para detalhes, consulte [Evento antes da ação](../triggers/pre-action.md).

### Fluxo de trabalho "Evento de ação personalizada"

Ao usar uma mensagem de resposta em um "Evento de ação personalizada" no modo síncrono, você pode enviar um feedback de mensagem correspondente ao cliente após o término do fluxo de trabalho. Para detalhes, consulte [Evento de ação personalizada](../triggers/custom-action.md).