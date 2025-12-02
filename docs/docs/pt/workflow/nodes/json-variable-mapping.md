---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Mapeamento de Variáveis JSON

> v1.6.0

## Introdução

Usado para mapear estruturas JSON complexas dos resultados de nós anteriores em variáveis, que podem ser utilizadas em nós subsequentes. Por exemplo, depois de mapear os resultados de nós de Ação SQL e Requisição HTTP, você pode usar os valores de suas propriedades em nós posteriores.

:::info{title=Dica}
Ao contrário do nó de Cálculo JSON, o nó de Mapeamento de Variáveis JSON não suporta expressões personalizadas e não é baseado em um motor de terceiros. Ele é usado apenas para mapear valores de propriedades em uma estrutura JSON, mas é mais simples de usar.
:::

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição (“+”) no fluxo para adicionar um nó de "Mapeamento de Variáveis JSON":

![Criar Nó](https://static-docs.nocobase.com/20250113173635.png)

## Configuração do Nó

### Fonte de Dados

A fonte de dados pode ser o resultado de um nó anterior ou um objeto de dados no contexto do processo. Geralmente, é um objeto de dados não estruturado, como o resultado de um nó SQL ou de um nó de Requisição HTTP.

![Fonte de Dados](https://static-docs.nocobase.com/20250113173720.png)

### Inserir Dados de Exemplo

Cole os dados de exemplo e clique no botão de análise para gerar automaticamente uma lista de variáveis:

![Inserir Dados de Exemplo](https://static-docs.nocobase.com/20250113182327.png)

Se houver variáveis na lista gerada automaticamente que você não precisa, você pode clicar no botão de exclusão para removê-las.

:::info{title=Dica}
Os dados de exemplo não são o resultado final da execução; eles são usados apenas para auxiliar na geração da lista de variáveis.
:::

### Caminho Inclui Índice do Array

Se não estiver marcado, o conteúdo do array será mapeado de acordo com o método padrão de tratamento de variáveis dos fluxos de trabalho do NocoBase. Por exemplo, insira o seguinte exemplo:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Nas variáveis geradas, `b.c` representará o array `[2, 3]`.

Se esta opção estiver marcada, o caminho da variável incluirá o índice do array, por exemplo, `b.0.c` e `b.1.c`.

![Exemplo de Caminho com Índice de Array](https://static-docs.nocobase.com/20250113184056.png)

Ao incluir índices de array, você precisa garantir que os índices de array nos dados de entrada sejam consistentes; caso contrário, isso causará um erro de análise.

## Usar em Nós Subsequentes

Na configuração dos nós subsequentes, você pode usar as variáveis geradas pelo nó de Mapeamento de Variáveis JSON:

![Uso em Nós Subsequentes](https://static-docs.nocobase.com/20250113203658.png)

Embora a estrutura JSON possa ser complexa, após o mapeamento, você só precisa selecionar a variável para o caminho correspondente.