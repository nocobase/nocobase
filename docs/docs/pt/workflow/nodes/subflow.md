---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Invocar um Fluxo de Trabalho

## Introdução

Este recurso permite que você chame outros fluxos de trabalho a partir de um fluxo de trabalho. Você pode usar as variáveis do fluxo de trabalho atual como entrada para o sub-fluxo de trabalho e, em seguida, utilizar a saída do sub-fluxo de trabalho como variáveis no fluxo de trabalho principal para uso em nós subsequentes.

O processo de invocar um fluxo de trabalho é mostrado na figura abaixo:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Ao invocar fluxos de trabalho, você pode reutilizar lógicas de processo comuns, como envio de e-mails, SMS, etc., ou dividir um fluxo de trabalho complexo em vários sub-fluxos de trabalho para facilitar o gerenciamento e a manutenção.

Essencialmente, um fluxo de trabalho não distingue se um processo é um sub-fluxo de trabalho. Qualquer fluxo de trabalho pode ser invocado como um sub-fluxo de trabalho por outros fluxos de trabalho, e também pode invocar outros fluxos de trabalho. Todos os fluxos de trabalho são iguais; existe apenas a relação de quem invoca e quem é invocado.

Da mesma forma, a utilização de um fluxo de trabalho invocado ocorre em dois locais:

1.  No fluxo de trabalho principal: Como o invocador, ele chama outros fluxos de trabalho através do nó "Invocar Fluxo de Trabalho".
2.  No sub-fluxo de trabalho: Como o fluxo de trabalho invocado, ele salva as variáveis que precisam ser geradas pelo fluxo de trabalho atual através do nó "Saída do Fluxo de Trabalho", as quais podem ser usadas por nós subsequentes no fluxo de trabalho que o invocou.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição ("+") no fluxo de trabalho para adicionar um nó "Invocar Fluxo de Trabalho":

![Adicionar Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Configurar Nó

### Selecionar Fluxo de Trabalho

Selecione o fluxo de trabalho a ser invocado. Você pode usar a caixa de pesquisa para uma busca rápida:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Dica}
*   Fluxos de trabalho desativados também podem ser invocados como sub-fluxos de trabalho.
*   Quando o fluxo de trabalho atual está no modo síncrono, ele só pode invocar sub-fluxos de trabalho que também estejam no modo síncrono.
:::

### Configurar Variáveis do Gatilho do Fluxo de Trabalho

Após selecionar um fluxo de trabalho, você também precisa configurar as variáveis do gatilho como dados de entrada para acionar o sub-fluxo de trabalho. Você pode selecionar diretamente dados estáticos ou escolher variáveis do fluxo de trabalho atual:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Diferentes tipos de gatilhos exigem variáveis diferentes, que podem ser configuradas no formulário conforme necessário.

## Nó de Saída do Fluxo de Trabalho

Consulte o conteúdo do nó [Saída do Fluxo de Trabalho](./output.md) para configurar as variáveis de saída do sub-fluxo de trabalho.

## Usando a Saída do Fluxo de Trabalho

De volta ao fluxo de trabalho principal, em outros nós abaixo do nó "Invocar Fluxo de Trabalho", quando você quiser usar o valor de saída do sub-fluxo de trabalho, você pode selecionar o resultado do nó "Invocar Fluxo de Trabalho". Se o sub-fluxo de trabalho gerar um valor simples, como uma string, número, valor lógico (booleano), data (a data é uma string no formato UTC), etc., ele pode ser usado diretamente. Se for um objeto complexo (como um objeto de uma coleção), ele precisa ser mapeado primeiro através de um nó de Análise JSON para que suas propriedades possam ser usadas; caso contrário, ele só poderá ser usado como um objeto completo.

Se o sub-fluxo de trabalho não tiver um nó de Saída do Fluxo de Trabalho configurado, ou se não houver valor de saída, então, ao usar o resultado do nó "Invocar Fluxo de Trabalho" no fluxo de trabalho principal, você obterá apenas um valor nulo (`null`).