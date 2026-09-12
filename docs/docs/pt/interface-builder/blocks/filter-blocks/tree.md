---
title: "Block de filtro em árvore"
description: "Block de filtro em árvore: exibe condições de filtro em estrutura hierárquica e filtra Blocks de dados de forma encadeada — ideal para dados em árvore."
keywords: "filtro em árvore, TreeFilter, filtro hierárquico, linkagem, interface, NocoBase"
---

# Filtro em árvore

## Introdução

O Block de filtro em árvore oferece filtragem em estrutura de árvore, adequado para dados com relacionamento hierárquico, como categorias de produto, hierarquia organizacional etc.  
O usuário seleciona nós de diferentes níveis para filtrar de forma encadeada o Block de dados associado.

## Como usar

O Block de filtro em árvore precisa ser usado em conjunto com um Block de dados, fornecendo a ele a capacidade de filtragem.

Passos de configuração:

1. Ative o modo de configuração e adicione à página o Block "Filtro em árvore" e um Block de dados (por exemplo, um Block de tabela).
2. Configure o Block de filtro em árvore escolhendo a tabela em formato de árvore (por exemplo, a tabela de categorias de produtos).
3. Configure a relação de conexão entre o Block de filtro em árvore e o Block de dados.
4. Concluída a configuração, basta clicar em um nó da árvore para filtrar o Block de dados.

## Adicionar o Block

No modo de configuração, clique no botão "Adicionar Block" da página, vá até a categoria "Blocks de filtro" e selecione "Árvore" para concluir a inclusão.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_02_35_PM.png)

## Configurações do Block

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_12_PM%20(1).png)

### Conectar Blocks de dados

O Block de filtro em árvore só funciona quando está conectado a um Block de dados.  
Pela configuração "Conectar Blocks de dados", é possível estabelecer a linkagem entre o filtro em árvore e Blocks de tabela, lista, gráfico etc. existentes na página, possibilitando a filtragem.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_14_PM.png)

### Campo de título

Define qual campo é exibido como nome do nó na árvore.

### Busca

Quando ativada, permite localizar nós da árvore rapidamente por palavra-chave, melhorando a eficiência da busca.

### Expandir todos

Controla se todos os nós da árvore são expandidos por padrão no carregamento inicial da página.

### Filtrar nós filhos

Quando ativado, ao selecionar um nó também são incluídos nos filtros os dados de todos os nós filhos.  
Ideal para cenários em que se deseja ver, sob uma categoria pai, todos os dados das subcategorias.
