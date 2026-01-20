---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Loop

## Introdução

Um loop é equivalente a estruturas de sintaxe como `for`/`while`/`forEach` em linguagens de programação. Você pode usar um nó de loop quando precisar repetir algumas operações um certo número de vezes ou para uma **coleção** de dados (array).

## Instalação

Este é um **plugin** integrado e não requer instalação.

## Criando um Nó

Na interface de configuração do **fluxo de trabalho**, clique no botão de adição ("+") no fluxo para adicionar um nó de "Loop":

![Criando um Nó de Loop](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Após criar um nó de loop, uma ramificação interna ao loop será gerada. Você pode adicionar quantos nós quiser dentro desta ramificação. Esses nós podem usar não apenas as variáveis do contexto do fluxo, mas também variáveis locais do contexto do loop, como o objeto de dados que está sendo iterado na **coleção** do loop, ou o índice da contagem do loop (o índice começa em `0`). O escopo das variáveis locais é limitado ao interior do loop. Se houver loops aninhados, você pode usar as variáveis locais do loop específico em cada nível.

## Configuração do Nó

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Objeto de Loop

O loop trata diferentes tipos de dados do objeto de loop de maneiras distintas:

1.  **Array**: Este é o caso mais comum. Geralmente, você pode selecionar uma variável do contexto do **fluxo de trabalho**, como os múltiplos resultados de dados de um nó de consulta, ou dados de relacionamento um-para-muitos pré-carregados. Se um array for selecionado, o nó de loop irá iterar por cada elemento no array, atribuindo o elemento atual a uma variável local no contexto do loop a cada iteração.

2.  **Número**: Quando a variável selecionada é um número, ele será usado como o número de iterações. O valor deve ser um número inteiro positivo; números negativos não entrarão no loop, e a parte decimal de um número será ignorada. O índice da contagem do loop na variável local é também o valor do objeto de loop. Este valor começa em **0**. Por exemplo, se o número do objeto de loop for 5, o objeto e o índice em cada loop serão: 0, 1, 2, 3, 4.

3.  **String**: Quando a variável selecionada é uma string, seu comprimento será usado como o número de iterações, processando cada caractere da string por índice.

4.  **Outros**: Outros tipos de valores (incluindo tipos de objeto) são tratados como um objeto de loop de item único e só farão um loop uma vez. Geralmente, esta situação não requer o uso de um loop.

Além de selecionar uma variável, você também pode inserir constantes diretamente para tipos numéricos e de string. Por exemplo, inserir `5` (tipo numérico) fará com que o nó de loop itere 5 vezes. Inserir `abc` (tipo string) fará com que o nó de loop itere 3 vezes, processando os caracteres `a`, `b` e `c` respectivamente. Na ferramenta de seleção de variáveis, escolha o tipo desejado para a constante.

### Condição do Loop

A partir da versão `v1.4.0-beta`, foram adicionadas opções relacionadas às condições de loop. Você pode habilitar as condições de loop na configuração do nó.

**Condição**

Similar à configuração de condição em um nó de condição, você pode combinar configurações e usar variáveis do loop atual, como o objeto de loop, índice do loop, etc.

**Momento da Verificação**

Similar às construções `while` e `do/while` em linguagens de programação, você pode escolher avaliar a condição configurada antes do início de cada loop ou após o término de cada loop. A avaliação de pós-condição permite que os outros nós dentro do corpo do loop sejam executados por uma rodada antes que a condição seja verificada.

**Quando a Condição Não For Atendida**

Similar às instruções `break` e `continue` em linguagens de programação, você pode escolher sair do loop ou continuar para a próxima iteração.

### Tratamento de Erros em Nós Internos do Loop

A partir da versão `v1.4.0-beta`, quando um nó dentro do loop falha na execução (devido a condições não atendidas, erros, etc.), você pode configurar o fluxo subsequente. Três métodos de tratamento são suportados:

*   Sair do **fluxo de trabalho** (como `throw` em programação)
*   Sair do loop e continuar o **fluxo de trabalho** (como `break` em programação)
*   Continuar para o próximo objeto de loop (como `continue` em programação)

O padrão é "Sair do **fluxo de trabalho**", mas você pode alterar conforme a sua necessidade.

## Exemplo

Por exemplo, ao fazer um pedido, você precisa verificar o estoque de cada produto no pedido. Se o estoque for suficiente, deduza-o; caso contrário, atualize o produto nos detalhes do pedido como inválido.

1.  Crie três **coleções**: Produtos <-(1:m)-- Detalhes do Pedido --(m:1)-> Pedidos. O modelo de dados é o seguinte:

    **Coleção de Pedidos**
    | Nome do Campo | Tipo de Campo |
    | ------------ | -------------- |
    | Detalhes do Pedido | Um-para-Muitos (Detalhes do Pedido) |
    | Preço Total do Pedido | Número |

    **Coleção de Detalhes do Pedido**
    | Nome do Campo | Tipo de Campo |
    | -------- | -------------- |
    | Produto | Muitos-para-Um (Produto) |
    | Quantidade | Número |

    **Coleção de Produtos**
    | Nome do Campo | Tipo de Campo |
    | -------- | -------- |
    | Nome do Produto | Texto de Linha Única |
    | Preço | Número |
    | Estoque | Inteiro |

2.  Crie um **fluxo de trabalho**. Para o gatilho, selecione "Evento de **Coleção**" e escolha a **coleção** "Pedidos" para acionar "Após o registro ser adicionado". Você também precisará configurar para pré-carregar os dados de relacionamento da **coleção** "Detalhes do Pedido" e da **coleção** de Produtos sob os detalhes:

    ![Nó de Loop_Exemplo_Configuração do Gatilho](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Crie um nó de loop e selecione o objeto de loop como "Dados do gatilho / Detalhes do Pedido", o que significa que ele processará cada registro na **coleção** Detalhes do Pedido:

    ![Nó de Loop_Exemplo_Configuração do Nó de Loop](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Dentro do nó de loop, crie um nó de "Condição" para verificar se o estoque do produto é suficiente:

    ![Nó de Loop_Exemplo_Configuração do Nó de Condição](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Se for suficiente, crie um "nó de Cálculo" e um nó de "Atualizar registro" na ramificação "Sim" para atualizar o registro do produto correspondente com o estoque deduzido calculado:

    ![Nó de Loop_Exemplo_Configuração do Nó de Cálculo](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Nó de Loop_Exemplo_Configuração do Nó de Atualização de Estoque](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Caso contrário, na ramificação "Não", crie um nó de "Atualizar registro" para atualizar o status do detalhe do pedido para "inválido":

    ![Nó de Loop_Exemplo_Configuração do Nó de Atualização de Detalhes do Pedido](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

A estrutura geral do **fluxo de trabalho** é a seguinte:

![Nó de Loop_Exemplo_Estrutura do Fluxo de Trabalho](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Após configurar e ativar este **fluxo de trabalho**, quando um novo pedido for criado, ele verificará automaticamente o estoque dos produtos nos detalhes do pedido. Se o estoque for suficiente, ele será deduzido; caso contrário, o produto no detalhe do pedido será atualizado para inválido (para que um total de pedido válido possa ser calculado).