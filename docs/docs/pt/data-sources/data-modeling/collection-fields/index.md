:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Campos da Coleção

## Tipos de Interface dos Campos

O NocoBase classifica os campos nas seguintes categorias, sob a perspectiva da Interface:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipos de Dados dos Campos

Cada Interface de Campo possui um tipo de dado padrão. Por exemplo, para campos com a Interface de Número, o tipo de dado padrão é `double`, mas também pode ser `float`, `decimal`, etc. Os tipos de dados atualmente suportados são:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mapeamento de Tipos de Campo

O processo para adicionar novos campos ao banco de dados principal é o seguinte:

1. Selecione o tipo de Interface
2. Configure o tipo de dado opcional para a Interface atual

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

O processo para mapeamento de campos de fontes de dados externas é:

1. Mapeie automaticamente o tipo de dado correspondente (Tipo de Campo) e o tipo de UI (Interface de Campo) com base no tipo de campo do banco de dados externo.
2. Modifique para um tipo de dado e tipo de Interface mais adequados, conforme necessário.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)