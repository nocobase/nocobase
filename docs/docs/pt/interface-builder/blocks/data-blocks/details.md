:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Bloco de Detalhes

## Introdução

O bloco de Detalhes é usado para exibir os valores de cada campo de um registro de dados. Ele oferece layouts de campo flexíveis e possui funções de ação de dados integradas, facilitando a visualização e o gerenciamento de informações pelos usuários.

## Configurações do Bloco

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Regras de Vinculação do Bloco

Controle o comportamento do bloco (por exemplo, se ele deve ser exibido ou executar JavaScript) através das regras de vinculação.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)

Para mais detalhes, consulte [Regras de Vinculação](/interface-builder/linkage-rule)

### Definir Escopo de Dados

Exemplo: Exibir apenas pedidos pagos

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Para mais detalhes, consulte [Definir Escopo de Dados](/interface-builder/blocks/block-settings/data-scope)

### Regras de Vinculação de Campo

As regras de vinculação no bloco de Detalhes permitem definir dinamicamente se os campos serão exibidos ou ocultados.

Exemplo: Não exibir o valor quando o status do pedido for "Cancelado".

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Para mais detalhes, consulte [Regras de Vinculação](/interface-builder/linkage-rule)

## Configurar Campos

### Campos desta coleção

> **Observação**: Os campos de **coleções** herdadas (ou seja, campos da **coleção** pai) são automaticamente mesclados e exibidos na lista de campos atual.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Campos de coleções associadas

> **Observação**: A exibição de campos de **coleções** associadas é suportada (atualmente, apenas para relacionamentos um-para-um).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Outros Campos
- Campo JS
- Item JS
- Divisor
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Dica**: Você pode escrever JavaScript para implementar conteúdo de exibição personalizado, permitindo que você mostre informações mais complexas.  
> Por exemplo, você pode renderizar diferentes efeitos de exibição com base em diferentes tipos de dados, condições ou lógicas.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Configurar Ações

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Editar](/interface-builder/actions/types/edit)
- [Excluir](/interface-builder/actions/types/delete)
- [Linkar](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Atualizar Registro](/interface-builder/actions/types/update-record)
- [Acionar **Fluxo de Trabalho**](/interface-builder/actions/types/trigger-workflow)
- [Ação JS](/interface-builder/actions/types/js-action)
- [Funcionário IA](/interface-builder/actions/types/ai-employee)