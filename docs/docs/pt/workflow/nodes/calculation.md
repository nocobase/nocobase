:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Cálculo

O nó de Cálculo pode avaliar uma expressão, e o resultado é salvo no nó correspondente para ser usado por nós subsequentes. É uma ferramenta para calcular, processar e transformar dados. Em certa medida, ele pode substituir a funcionalidade de chamar uma função e atribuir seu resultado a uma variável, como em linguagens de programação.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição (“+”) no fluxo para adicionar um nó de Cálculo:

![Nó de Cálculo_Adicionar](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Configuração do Nó

![Nó de Cálculo_Configuração](https://static-docs.nocobase.com/6a155de3c81881b2d9c33874.png)

### Mecanismo de Cálculo

O mecanismo de cálculo define a sintaxe suportada pela expressão. Os mecanismos de cálculo atualmente suportados são [Math.js](https://mathjs.org/) e [Formula.js](https://formulajs.info/). Cada mecanismo possui um grande número de funções comuns e métodos de operação de dados integrados. Para uso específico, você pode consultar a documentação oficial deles.

:::info{title=Dica}
É importante notar que diferentes mecanismos diferem no acesso ao índice de array. Os índices do Math.js começam em `1`, enquanto os do Formula.js começam em `0`.
:::

Além disso, se você precisar de uma concatenação de strings simples, você pode usar diretamente o “String Template”. Este mecanismo substituirá as variáveis na expressão pelos seus valores correspondentes e então retornará a string concatenada.

### Expressão

Uma expressão é uma representação em string de uma fórmula de cálculo, que pode ser composta por variáveis, constantes, operadores e funções suportadas. Você pode usar variáveis do contexto do fluxo, como o resultado de um nó precedente ao nó de Cálculo, ou variáveis locais de um loop.

Se a entrada da expressão não estiver em conformidade com a sintaxe, um erro será exibido na configuração do nó. Se uma variável não existir ou o tipo não corresponder durante a execução, ou se uma função inexistente for usada, o nó de Cálculo será encerrado prematuramente com um status de erro.

## Exemplo

### Calcular Preço Total do Pedido

Geralmente, um pedido pode conter vários itens, e cada item tem um preço e uma quantidade diferentes. O preço total do pedido precisa ser a soma dos produtos do preço e da quantidade de todos os itens. Após carregar a lista de detalhes do pedido (um conjunto de dados de relacionamento um-para-muitos), você pode usar um nó de Cálculo para calcular o preço total do pedido:

![Nó de Cálculo_Exemplo_Configuração](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Aqui, a função `SUMPRODUCT` do Formula.js pode calcular a soma dos produtos para dois arrays do mesmo comprimento, o que resulta no preço total do pedido.