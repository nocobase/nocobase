:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Usando Variáveis

## Conceitos Essenciais

Assim como as variáveis em uma linguagem de programação, as **variáveis** em um **fluxo de trabalho** são uma ferramenta importante para conectar e organizar processos.

Quando cada nó é executado após um **fluxo de trabalho** ser acionado, algumas configurações podem usar variáveis. A origem dessas variáveis são os dados dos nós anteriores ao nó atual, e elas incluem as seguintes categorias:

- Dados de contexto do acionador: Em casos como acionadores de ação ou acionadores de **coleção**, um objeto de dados de uma única linha pode ser usado como variável por todos os nós. Os detalhes variam dependendo da implementação de cada acionador.
- Dados de nós anteriores: Quando o processo atinge qualquer nó, são os dados de resultado dos nós que foram concluídos anteriormente.
- Variáveis locais: Quando um nó está dentro de estruturas de ramificação especiais, ele pode usar variáveis locais específicas dessa ramificação. Por exemplo, em uma estrutura de loop, o objeto de dados de cada iteração pode ser usado.
- Variáveis de sistema: Alguns parâmetros de sistema integrados, como a hora atual.

Já usamos o recurso de variáveis várias vezes em [Introdução](../getting-started.md). Por exemplo, em um nó de cálculo, podemos usar variáveis para referenciar dados de contexto do acionador para realizar cálculos:

![Nó de cálculo usando funções e variáveis](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

Em um nó de atualização, use os dados de contexto do acionador como uma variável para a condição de filtro e referencie o resultado do nó de cálculo como uma variável para o valor do campo a ser atualizado:

![Variáveis do nó de atualização de dados](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Estrutura de Dados

Internamente, uma variável é uma estrutura JSON, e você geralmente pode usar uma parte específica dos dados através do seu caminho JSON. Como muitas variáveis são baseadas na estrutura de **coleção** do NocoBase, os dados de associação serão estruturados hierarquicamente como propriedades de objeto, formando uma estrutura semelhante a uma árvore. Por exemplo, podemos selecionar o valor de um campo específico dos dados de associação dos dados consultados. Além disso, quando os dados de associação têm uma estrutura de "um para muitos", a variável pode ser um array.

Ao selecionar uma variável, na maioria das vezes você precisará selecionar o atributo de valor do último nível, que geralmente é um tipo de dado simples, como um número ou uma string. No entanto, quando há um array na hierarquia da variável, o atributo de último nível também será mapeado para um array. Somente se o nó correspondente suportar arrays, os dados do array poderão ser processados corretamente. Por exemplo, em um nó de cálculo, alguns motores de cálculo possuem funções específicas para lidar com arrays. Outro exemplo é em um nó de loop, onde o objeto de loop também pode ser diretamente um array.

Por exemplo, quando um nó de consulta consulta múltiplos dados, o resultado do nó será um array contendo múltiplas linhas de dados homogêneos:

```json
[
  {
    "id": 1,
    "title": "Título 1"
  },
  {
    "id": 2,
    "title": "Título 2"
  }
]
```

No entanto, ao usá-lo como variável em nós subsequentes, se a variável selecionada estiver no formato `Dados do nó/Nó de consulta/Título`, você obterá um array mapeado para os valores dos campos correspondentes:

```json
["Título 1", "Título 2"]
```

Se for um array multidimensional (como um campo de relacionamento de muitos para muitos), você obterá um array unidimensional com o campo correspondente "achatado".

## Variáveis de Sistema Integradas

### Hora do Sistema

Obtém a hora do sistema no momento em que o nó é executado. O fuso horário dessa hora é o configurado no servidor.

### Parâmetros de Intervalo de Datas

Pode ser usado ao configurar condições de filtro de campo de data em nós de consulta, atualização e exclusão. É suportado apenas para comparações de "igual a". Tanto o início quanto o fim do intervalo de datas são baseados no fuso horário configurado no servidor.

![Parâmetros de intervalo de datas](https://static-docs.nocobase.com/20240817175354.png)