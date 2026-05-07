:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/blocks/block-settings/drag-sort).
:::

# Ordenação por Arrastar e Soltar

## Introdução

A ordenação por arrastar e soltar depende de um campo de ordenação para reordenar manualmente os registros dentro de um bloco.

:::info{title=Dica}
* Quando o mesmo campo de ordenação é usado para ordenação por arrastar e soltar em vários blocos, isso pode interromper a ordem existente.
* Ao usar a ordenação por arrastar e soltar em uma tabela, o campo de ordenação não pode ter regras de agrupamento configuradas.
* Tabelas em árvore suportam apenas a ordenação de nós dentro do mesmo nível.
:::

## Configuração

Adicione um campo do tipo "Ordenação" (Sort). Os campos de ordenação não são mais gerados automaticamente ao criar uma coleção; você deve criá-los manualmente.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Ao ativar a ordenação por arrastar e soltar para uma tabela, você precisa selecionar um campo de ordenação.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)

## Ordenação por Arrastar e Soltar para Linhas de Tabela

![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)

## Explicação das Regras de Ordenação

Suponha que a ordem atual seja:

```
[1,2,3,4,5,6,7,8,9]
```

Quando um elemento (por exemplo, 5) é movido para a frente para a posição do 3, apenas os valores de ordenação de 3, 4 e 5 mudarão: o 5 assume a posição do 3, e o 3 e o 4 movem-se uma posição para trás cada.

```
[1,2,5,3,4,6,7,8,9]
```

Se você então mover o 6 para trás para a posição do 8, o 6 assume a posição do 8, e o 7 e o 8 movem-se uma posição para a frente cada.

```
[1,2,5,3,4,7,8,6,9]
```