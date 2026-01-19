:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Encerrar Fluxo de Trabalho

Quando este nó é executado, ele encerra imediatamente o fluxo de trabalho atual, usando o status que você configurou para ele. É uma ferramenta útil para controlar o fluxo com base em lógicas específicas: se certas condições forem atendidas, o fluxo de trabalho é interrompido e os processos seguintes não são executados. Pense nele como a instrução `return` em linguagens de programação, que serve para sair de uma função em execução.

## Adicionar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de mais ('+') no fluxo para adicionar o nó 'Encerrar Fluxo de Trabalho':

![Encerrar Fluxo de Trabalho_Adicionar](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Configuração do Nó

![Encerrar Fluxo de Trabalho_Configuração do Nó](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Status de Encerramento

O status de encerramento influencia o resultado final da execução do fluxo de trabalho. Você pode configurá-lo como 'Sucesso' ou 'Falha'. Assim que o fluxo de trabalho chega a este nó, ele é encerrado imediatamente com o status que você definiu.

:::info{title=Dica}
Quando você usa este nó em um fluxo de trabalho do tipo 'Evento antes da ação', ele intercepta a requisição que deu início à ação. Para mais detalhes, consulte [Uso de 'Evento antes da ação'](../triggers/pre-action).

Além disso, a configuração do status de encerramento não só intercepta a requisição que iniciou a ação, mas também afeta o status do feedback na 'mensagem de resposta' para este tipo de fluxo de trabalho.
:::