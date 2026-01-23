:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Definir Escopo de Dados

## Introdução

A configuração do escopo de dados para um campo de relacionamento é similar à configuração do escopo de dados para um bloco. Ela define condições de filtro padrão para os dados relacionados.

## Instruções de Uso

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Valor Estático

Exemplo: Apenas produtos não excluídos podem ser selecionados para associação.

> A lista de campos contém campos da coleção de destino do campo de relacionamento.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Valor de Variável

Exemplo: Apenas produtos cuja data de serviço é posterior à data do pedido podem ser selecionados para associação.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Para mais informações sobre variáveis, consulte [Variáveis](/interface-builder/variables)

### Vinculação de Campos de Relacionamento

A vinculação entre campos de relacionamento é alcançada configurando o escopo de dados.

Exemplo: A coleção de Pedidos possui um campo de relacionamento Um-para-Muitos "Produto da Oportunidade" e um campo de relacionamento Muitos-para-Um "Oportunidade". A coleção de Produto da Oportunidade possui um campo de relacionamento Muitos-para-Um "Oportunidade". No bloco do formulário de pedido, os dados selecionáveis para "Produto da Oportunidade" são filtrados para mostrar apenas os produtos da oportunidade associados à "Oportunidade" atualmente selecionada no formulário.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)