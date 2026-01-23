---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Variável

## Introdução

Você pode declarar variáveis em um fluxo ou atribuir valores a variáveis já declaradas. Isso é geralmente usado para armazenar dados temporários dentro do fluxo.

## Criar Nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição ("+") no fluxo para adicionar um nó de "Variável":

![Adicionar Nó de Variável](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Configurar Nó

### Modo

O nó de variável é similar às variáveis em programação: ele precisa ser declarado antes de poder ser usado e ter um valor atribuído. Por isso, ao criar um nó de variável, você precisa selecionar o modo da variável. Existem dois modos para escolher:

![Selecionar Modo](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Declarar uma nova variável: Cria uma nova variável.
- Atribuir a uma variável existente: Atribui um valor a uma variável que já foi declarada anteriormente no fluxo, o que equivale a modificar o valor da variável.

Quando o nó que você está criando é o primeiro nó de variável no fluxo, você só pode selecionar o modo de declaração, pois ainda não há variáveis disponíveis para atribuição.

Ao escolher atribuir um valor a uma variável já declarada, você também precisará selecionar a variável de destino, que é o nó onde a variável foi declarada:

![Selecionar a variável para atribuir um valor](https://static-docs.nocobase.com/1ce88b71526ef3ee.png)

### Valor

O valor de uma variável pode ser de qualquer tipo. Pode ser uma constante, como uma string, número, valor booleano (lógico) ou data, ou pode ser outra variável do fluxo.

No modo de declaração, definir o valor da variável equivale a atribuir um valor inicial a ela.

![Declarar valor inicial](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

No modo de atribuição, definir o valor da variável equivale a modificar o valor da variável de destino declarada para um novo valor. Usos subsequentes obterão este novo valor.

![Atribuir uma variável de gatilho a uma variável declarada](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Usando o Valor da Variável

Nos nós subsequentes ao nó de variável, você pode usar o valor da variável selecionando a variável declarada no grupo "Variáveis do Nó". Por exemplo, em um nó de consulta, use o valor da variável como condição de consulta:

![Usar valor da variável como condição de filtro de consulta](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Exemplo

Um cenário mais útil para o nó de variável é em ramificações, onde novos valores são calculados ou mesclados com valores anteriores (similar a `reduce`/`concat` em programação), e então usados após o término da ramificação. A seguir, um exemplo de como usar uma ramificação de loop e um nó de variável para concatenar uma string de destinatários.

Primeiro, crie um **fluxo de trabalho** acionado por **coleção** que dispara quando os dados de "Artigo" são atualizados, e pré-carregue os dados de associação de "Autor" relacionados (para obter os destinatários):

![Configurar Gatilho](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Em seguida, crie um nó de variável para armazenar a string de destinatários:

![Nó de variável de destinatário](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Depois, crie um nó de ramificação de loop para iterar pelos autores do artigo e concatenar as informações dos destinatários na variável de destinatários:

![Iterar pelos autores no artigo](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Dentro da ramificação de loop, primeiro crie um nó de cálculo para concatenar o autor atual com a string de autores já armazenada:

![Concatenar string de destinatários](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Após o nó de cálculo, crie outro nó de variável. Selecione o modo de atribuição, escolha o nó de variável de destinatários como o alvo da atribuição e selecione o resultado do nó de cálculo como o valor:

![Atribuir a string de destinatários concatenada ao nó de destinatários](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Dessa forma, após a ramificação de loop terminar, a variável de destinatários armazenará a string de destinatários de todos os autores do artigo. Em seguida, após o loop, você pode usar um nó de Requisição HTTP para chamar uma API de envio de e-mail, passando o valor da variável de destinatários como parâmetro de destinatário para a API:

![Enviar e-mail para destinatários via nó de requisição](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

Pronto! Um recurso simples de envio de e-mail em massa foi implementado usando um loop e um nó de variável.