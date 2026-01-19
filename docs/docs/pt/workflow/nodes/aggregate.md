---
pkg: '@nocobase/plugin-workflow-aggregate'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Consulta de Agregação

## Introdução

Usado para realizar consultas de função de agregação em dados de uma coleção que atendem a certas condições, e retorna os resultados estatísticos correspondentes. É frequentemente utilizado para processar dados estatísticos para relatórios.

A implementação do nó é baseada em funções de agregação de banco de dados. Atualmente, ele suporta apenas estatísticas em um único campo de uma coleção. O resultado numérico das estatísticas será salvo na saída do nó para uso por nós subsequentes.

## Instalação

Plugin integrado, não requer instalação.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição ('+') no fluxo para adicionar um nó de "Consulta de Agregação":

![Criar nó de Consulta de Agregação](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Configuração do Nó

![Nó de Consulta de Agregação_Configuração do Nó](https://static-docs.nocobase.com/57362f747b9992230567c6bb5e986fd2.png)

### Função de Agregação

Suporta 5 funções de agregação do SQL: `COUNT`, `SUM`, `AVG`, `MIN` e `MAX`. Selecione uma delas para realizar uma consulta de agregação nos dados.

### Tipo de Alvo

O alvo da consulta de agregação pode ser selecionado de duas maneiras: uma é selecionar diretamente a coleção de destino e um de seus campos; a outra é selecionar sua coleção e campo relacionados de um para muitos através de um objeto de dados existente no contexto do fluxo de trabalho para realizar a consulta de agregação.

### Distinto

É o `DISTINCT` do SQL. O campo para remoção de duplicatas é o mesmo que o campo da coleção selecionada. Atualmente, não é possível selecionar campos diferentes para ambos.

### Condições de Filtro

Semelhante às condições de filtro em uma consulta de coleção normal, você pode usar variáveis de contexto do fluxo de trabalho.

## Exemplo

O alvo de agregação "dados da coleção" é relativamente fácil de entender. Aqui, usaremos "contar o número total de artigos em uma categoria após a adição de um novo artigo" como exemplo para apresentar o uso do alvo de agregação "dados de coleção associados".

Primeiro, crie duas coleções: "Artigos" e "Categorias". A coleção "Artigos" possui um campo de relacionamento muitos para um que aponta para a coleção "Categorias", e um campo de relacionamento inverso um para muitos também é criado de "Categorias" para "Artigos":

| Nome do Campo | Tipo           |
| ------------- | -------------- |
| Título        | Texto Curto    |
| Categoria     | Muitos para Um (Categorias) |

| Nome do Campo     | Tipo           |
| ----------------- | -------------- |
| Nome da Categoria | Texto Curto    |
| Artigos           | Um para Muitos (Artigos) |

Em seguida, crie um fluxo de trabalho acionado por um evento de coleção. Selecione para que ele seja acionado após a adição de novos dados à coleção "Artigos".

Depois, adicione um nó de consulta de agregação e configure-o da seguinte forma:

![Nó de Consulta de Agregação_Exemplo_Configuração do Nó](https://static-docs.nocobase.com/542272e6373d1b37ddda78.png)

Dessa forma, após o fluxo de trabalho ser acionado, o nó de consulta de agregação contará o número de todos os artigos na categoria do artigo recém-adicionado e o salvará como o resultado do nó.

:::info{title=Dica}
Se você precisar usar os dados de relacionamento do gatilho de evento da coleção, você deve configurar os campos relevantes na seção "Pré-carregar dados associados" do gatilho, caso contrário, eles não poderão ser selecionados.
:::