:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Definir Escopo de Dados

## Introdução

Definir um escopo de dados significa estabelecer condições de filtro padrão para um bloco de dados. Você pode ajustar o escopo de dados conforme suas necessidades de negócio, mas, independentemente das operações de filtragem que realizar, o sistema aplicará automaticamente essa condição de filtro padrão, garantindo que os dados sempre permaneçam dentro dos limites do escopo especificado.

## Guia de Uso

![20251027110053](https://static-docs.nocobase.com/20251027110053.png)

O campo de filtro permite selecionar campos da coleção atual e de coleções relacionadas.

![20251027110140](https://static-docs.nocobase.com/20251027110140.png)

### Operadores

Diferentes tipos de campos suportam operadores distintos. Por exemplo, campos de texto aceitam operadores como "igual a", "diferente de" e "contém"; campos numéricos suportam "maior que" e "menor que"; enquanto campos de data permitem operadores como "está dentro do intervalo" e "é anterior a uma data específica".

![20251027111124](https://static-docs.nocobase.com/20251027111124.png)

### Valor Estático

Exemplo: Filtrar dados pelo "Status" do pedido.

![20251027111229](https://static-docs.nocobase.com/20251027111229.png)

### Valor de Variável

Exemplo: Filtrar dados de pedidos do usuário atual.

![20251027113349](https://static-docs.nocobase.com/20251027113349.png)

Para mais informações sobre variáveis, consulte [Variáveis](/interface-builder/variables)