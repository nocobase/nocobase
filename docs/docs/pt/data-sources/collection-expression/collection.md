---
title: "Tabela de expressões"
description: "A tabela de expressões é usada para realizar cálculos com expressões dinâmicas em fluxos de trabalho, armazenar regras de cálculo e fórmulas, oferecer suporte a campos de diferentes modelos de dados como variáveis e associá-los a dados de negócio."
keywords: "tabela de expressões, expressões dinâmicas, expressões de fluxo de trabalho, regras de cálculo, fórmulas, NocoBase"
---

# Tabela de expressões

## Criar uma tabela de modelo de "expressões"

Antes de usar o nó de cálculo de expressões dinâmicas em um fluxo de trabalho, é necessário criar uma tabela de modelo de "expressões" na ferramenta de gerenciamento de tabelas de dados para armazenar diferentes expressões:

![Criar uma tabela de modelo de expressões](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Inserir dados de expressões

Em seguida, crie um bloco de tabela para adicionar alguns dados de fórmulas a essa tabela de modelo. Cada linha da tabela de modelo de "expressões" pode ser entendida como uma regra de cálculo para um modelo de dados de tabela específico. Os dados de cada fórmula podem usar valores de campos de diferentes modelos de dados de tabelas como variáveis e definir diferentes expressões como regras de cálculo. Naturalmente, também é possível usar diferentes mecanismos de cálculo.

![Inserir dados de expressões](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Dica}
Depois de criar as fórmulas, ainda é necessário associar os dados de negócio às fórmulas. Como associar diretamente cada linha de dados de negócio a uma linha de dados de fórmula seria trabalhoso, normalmente usamos uma tabela de metadados semelhante a uma tabela de categorias para estabelecer uma associação muitos-para-um (ou um-para-um) com a tabela de fórmulas e, em seguida, associamos os dados de negócio aos metadados de categoria em uma relação muitos-para-um. Assim, ao criar os dados de negócio, basta especificar os metadados de categoria correspondentes para encontrar e usar posteriormente os dados de fórmula correspondentes por meio desse caminho de associação.
:::

## Carregar os dados correspondentes no fluxo de trabalho

Tomando como exemplo um evento de tabela de dados, crie um fluxo de trabalho que seja acionado quando um pedido for criado e que precise pré-carregar os dados dos produtos associados ao pedido e os dados das expressões relacionadas aos produtos:

![Configuração do acionador de evento da tabela de dados](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
