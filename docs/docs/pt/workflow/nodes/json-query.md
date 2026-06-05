---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Cálculo JSON

## Introdução

Com base em diferentes motores de cálculo JSON, este nó permite calcular ou transformar dados JSON complexos gerados por nós anteriores, para que possam ser utilizados pelos nós subsequentes. Por exemplo, os resultados de operações SQL e nós de requisição HTTP podem ser transformados nos valores e formatos de variáveis necessários através deste nó, para uso posterior.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição ('+') no fluxo para adicionar um nó de 'Cálculo JSON':

![Criar Nó](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Dica}
Geralmente, o nó de Cálculo JSON é criado abaixo de outros nós de dados para que você possa analisá-los.
:::

## Configuração do Nó

### Motor de Análise

O nó de Cálculo JSON suporta diferentes sintaxes através de diferentes motores de análise. Você pode escolher com base nas suas preferências e nas características de cada motor. Atualmente, três motores de análise são suportados:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Seleção do Motor](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Fonte de Dados

A fonte de dados pode ser o resultado de um nó anterior ou um objeto de dados no contexto do fluxo de trabalho. Geralmente, é um objeto de dados sem uma estrutura interna, como o resultado de um nó SQL ou de um nó de requisição HTTP.

![Fonte de Dados](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Dica}
Geralmente, os objetos de dados de nós relacionados a coleções são estruturados através das informações de configuração da coleção e, portanto, não precisam ser analisados pelo nó de Cálculo JSON.
:::

### Expressão de Análise

Expressões de análise personalizadas com base nos requisitos de análise e no motor de análise escolhido.

![Expressão de Análise](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Dica}
Diferentes motores oferecem diferentes sintaxes de análise. Para mais detalhes, consulte a documentação nos links.
:::

A partir da versão `v1.0.0-alpha.15`, as expressões suportam variáveis. As variáveis são pré-analisadas antes da execução do motor específico, substituindo-as por valores de string específicos de acordo com as regras de template de string, e concatenando-as com outras strings estáticas na expressão para formar a expressão final. Este recurso é muito útil quando você precisa construir expressões dinamicamente, por exemplo, quando algum conteúdo JSON precisa de uma chave dinâmica para análise.

### Mapeamento de Propriedades

Quando o resultado do cálculo é um objeto (ou um array de objetos), você pode mapear as propriedades necessárias para variáveis filhas através do mapeamento de propriedades, para que possam ser usadas pelos nós subsequentes.

![Mapeamento de Propriedades](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Dica}
Para um resultado de objeto (ou array de objetos), se o mapeamento de propriedades não for realizado, o objeto inteiro (ou array de objetos) será salvo como uma única variável no resultado do nó, e os valores das propriedades do objeto não poderão ser usados diretamente como variáveis.
:::

## Exemplo

Suponha que os dados a serem analisados vêm de um nó SQL anterior usado para consultar dados, e seu resultado é um conjunto de dados de pedidos:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Se precisarmos analisar e calcular o preço total dos dois pedidos nos dados, e montá-lo com o ID do pedido correspondente em um objeto para atualizar o preço total do pedido, podemos configurá-lo da seguinte forma:

![Exemplo - Configuração de Análise SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Selecione o motor de análise JSONata;
2. Selecione o resultado do nó SQL como a fonte de dados;
3. Use a expressão JSONata `$[0].{"id": id, "total": products.(price * quantity)}` para analisar;
4. Selecione o mapeamento de propriedades para mapear `id` e `total` para variáveis filhas;

O resultado final da análise é o seguinte:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Em seguida, itere pelo array de pedidos resultante para atualizar o preço total dos pedidos.

![Atualizar o preço total do pedido correspondente](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)