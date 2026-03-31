---
pkg: "@nocobase/plugin-field-sort"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Campo de Ordenação

## Introdução

Campos de ordenação são usados para ordenar registros em uma coleção, suportando a ordenação dentro de grupos.

:::warning
Como o campo de ordenação faz parte da mesma coleção, um registro não pode ser atribuído a múltiplos grupos ao usar a ordenação por grupo.
:::

## Instalação

Plugin integrado, não requer instalação separada.

## Manual do Usuário

### Criar um Campo de Ordenação

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Ao criar campos de ordenação, os valores de ordenação serão inicializados:

- Se a ordenação por grupo não for selecionada, a inicialização será baseada no campo de chave primária e no campo de data de criação.
- Se a ordenação por grupo for selecionada, os dados serão agrupados primeiro, e então a inicialização será baseada no campo de chave primária e no campo de data de criação.

:::warning{title="Explicação da Consistência de Transações"}
- Ao criar um campo, se a inicialização do valor de ordenação falhar, o campo de ordenação não será criado;
- Dentro de um determinado intervalo, se um registro se mover da posição A para a posição B, os valores de ordenação de todos os registros entre A e B serão alterados. Se qualquer parte desta atualização falhar, a operação de movimentação será revertida, e os valores de ordenação dos registros relacionados não serão alterados.
:::

#### Exemplo 1: Criar o campo sort1

O campo sort1 não é agrupado.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Os campos de ordenação de cada registro serão inicializados com base no campo de chave primária e no campo de data de criação.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Exemplo 2: Criar um campo sort2 baseado no agrupamento por ID da Classe

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

Neste momento, todos os registros na coleção serão agrupados primeiro (agrupados por ID da Classe), e então o campo de ordenação (sort2) será inicializado. Os valores iniciais de cada registro são:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Ordenação por Arrastar e Soltar

Campos de ordenação são principalmente usados para a ordenação por arrastar e soltar de registros em vários blocos. Os blocos que atualmente suportam a ordenação por arrastar e soltar incluem tabelas e quadros.

:::warning
- Quando o mesmo campo de ordenação é usado para ordenação por arrastar e soltar, usá-lo em múltiplos blocos pode interromper a ordem existente;
- O campo para ordenação de tabelas por arrastar e soltar não pode ser um campo de ordenação com uma regra de agrupamento;
  - Exceção: Em um bloco de tabela de relacionamento um-para-muitos, a chave estrangeira pode servir como um grupo;
- Atualmente, apenas o bloco de quadro suporta a ordenação por arrastar e soltar dentro de grupos.
:::

#### Ordenação por Arrastar e Soltar de Linhas da Tabela

Bloco de tabela

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Bloco de tabela de relacionamento

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
Em um bloco de relacionamento um-para-muitos:

- Se um campo de ordenação não agrupado for selecionado, todos os registros podem participar da ordenação.
- Se os registros forem primeiro agrupados pela chave estrangeira e depois ordenados, a regra de ordenação afetará apenas os dados dentro do grupo atual.

O efeito final é consistente, mas o número de registros que participam da ordenação é diferente. Para mais detalhes, consulte [Explicação da Regra de Ordenação](#explicação-da-regra-de-ordenação).
:::

#### Ordenação por Arrastar e Soltar de Cartões do Quadro

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Explicação da Regra de Ordenação

#### Deslocamento entre elementos não agrupados (ou do mesmo grupo)

Suponha que haja um conjunto de dados:

```
[1,2,3,4,5,6,7,8,9]
```

Quando um elemento, digamos 5, se move para a posição de 3, apenas as posições dos itens 3, 4 e 5 mudam. O item 5 ocupa a posição de 3, e os itens 3 e 4 se deslocam uma posição para trás.

```
[1,2,5,3,4,6,7,8,9]
```

Se então movermos o item 6 para trás para a posição de 8, o item 6 ocupa a posição de 8, e os itens 7 e 8 se deslocam uma posição para frente.

```
[1,2,5,3,4,7,8,6,9]
```

#### Movimentação de elementos entre diferentes grupos

Ao ordenar por grupo, se um registro for movido para outro grupo, sua atribuição de grupo também mudará. Por exemplo:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Quando o item 1 é movido após o item 6 (o comportamento padrão), seu grupo também mudará de A para B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Alterações na ordenação são independentes dos dados exibidos na interface

Por exemplo, considere um conjunto de dados:

```
[1,2,3,4,5,6,7,8,9]
```

A interface exibe apenas uma visualização filtrada:

```
[1,5,9]
```

Quando o item 1 é movido para a posição do item 9, as posições de todos os itens intermediários (2, 3, 4, 5, 6, 7, 8) também mudarão, mesmo que não estejam visíveis.

```
[2,3,4,5,6,7,8,9,1]
```

A interface agora exibe a nova ordem com base nos itens filtrados:

```
[5,9,1]
```