:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/fields/specific/sub-table).
:::

# Sub-tabela (edição em linha)

## Introdução

A sub-tabela é adequada para lidar com campos de relacionamento para-muitos, suportando a criação em massa de dados na coleção de destino para associação ou a seleção de dados existentes para associação.

## Instruções de uso

![20251027223350](https://static-docs.nocobase.com/20251027223350.png)

Diferentes tipos de campos na sub-tabela exibem diferentes componentes de campo; campos grandes (como Rich Text, JSON, texto multilinha, etc.) são editados por meio de uma janela pop-up flutuante.

![20251027223426](https://static-docs.nocobase.com/20251027223426.png)

Campos de relacionamento na sub-tabela.

Pedido (Um-para-Muitos) > Order Products (Um-para-Um) > Opportunity

![20251027223530](https://static-docs.nocobase.com/20251027223530.png)

O componente padrão do campo de relacionamento é o seletor suspenso (suporta seletor suspenso/seletor de dados).

![20251027223754](https://static-docs.nocobase.com/20251027223754.png)

## Itens de configuração do campo

### Permitir selecionar dados existentes (ativado por padrão)

Suporta a seleção de associações a partir de dados existentes.
![20251027224008](https://static-docs.nocobase.com/20251027224008.png)

![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)

### Componente de campo

[Componente de campo](/interface-builder/fields/association-field): Alterne para outros componentes de campo de relacionamento, como seletor suspenso, seletor de dados, etc.;

### Permitir desvincular a associação de dados existentes

> Define se os dados do campo de relacionamento no formulário de edição têm permissão para desvincular a associação de dados existentes.

![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)