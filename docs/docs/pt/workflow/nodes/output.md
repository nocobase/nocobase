---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Saída do Fluxo de Trabalho

## Introdução

O nó "Saída do Fluxo de Trabalho" é usado em um fluxo de trabalho chamado para definir seu valor de saída. Quando um fluxo de trabalho é chamado por outro, você pode usar o nó "Saída do Fluxo de Trabalho" para passar um valor de volta para o chamador.

## Criar Nó

Em um fluxo de trabalho chamado, adicione um nó "Saída do Fluxo de Trabalho":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Configurar Nó

### Valor de Saída

Insira ou selecione uma variável como valor de saída. O valor de saída pode ser de qualquer tipo, pode ser uma constante, como string, número, valor lógico (booleano), data ou JSON personalizado, ou outra variável do fluxo de trabalho.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Dica}
Se você adicionar vários nós "Saída do Fluxo de Trabalho" a um fluxo de trabalho chamado, ao chamar esse fluxo de trabalho, o valor do último nó "Saída do Fluxo de Trabalho" executado será o valor de saída.
:::