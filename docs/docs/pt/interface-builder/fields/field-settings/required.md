:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Obrigatório

## Introdução

Obrigatório é uma regra comum para validação de formulários. Você pode ativá-la diretamente na configuração do campo ou definir um campo como obrigatório dinamicamente através das regras de interação do formulário.

## Onde definir um campo como obrigatório

### Configurações de campo da coleção

Quando um campo da **coleção** é definido como obrigatório, isso aciona a validação no backend, e o frontend também o exibe como obrigatório por padrão (não pode ser modificado).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Configurações do campo

Defina um campo diretamente como obrigatório. Isso é adequado para campos que sempre precisam ser preenchidos pelo usuário, como nome de usuário, senha, etc.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Regras de interação

Defina um campo como obrigatório com base em condições, usando as regras de interação de campo do bloco do formulário.

Exemplo: O número do pedido é obrigatório quando a data do pedido não estiver vazia.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Fluxo de trabalho