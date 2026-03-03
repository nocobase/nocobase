:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/fields/specific/sub-table-popup).
:::

# Subtabela (Edição em pop-up)

## Introdução

A Subtabela (Edição em pop-up) é usada para gerenciar múltiplos dados de associação (como Um-para-Muitos ou Muitos-para-Muitos) dentro de um formulário. A tabela exibe apenas os registros associados no momento. A adição ou edição de registros é realizada em um pop-up, e os dados são enviados ao banco de dados coletivamente quando o formulário principal é enviado.

## Instruções de uso

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Cenários aplicáveis:**

- Campos de associação: O2M / M2M / MBM
- Usos típicos: Detalhes de pedidos, listas de subitens, tags/membros associados, etc.

## Configurações do campo

### Permitir selecionar dados existentes (Padrão: Ativado)

Suporta a seleção de associações a partir de registros existentes.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Componente de campo

[Componente de campo](/interface-builder/fields/association-field): Alterne para outros componentes de campo de relacionamento, como Seleção única, Seletor de coleção, etc.

### Permitir desvincular dados existentes (Padrão: Ativado)

> Controla se os dados associados existentes no formulário de edição podem ser desvinculados. Dados recém-adicionados sempre podem ser removidos.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Permitir adição (Padrão: Ativado)

Controla se o botão "Adicionar" é exibido. Se o usuário não tiver permissões de `create` (criação) para a coleção de destino, o botão será desativado com um aviso de "sem permissão".

### Permitir edição rápida (Padrão: Desativado)

Quando ativado, passar o mouse sobre uma célula revelará um ícone de edição, permitindo a modificação rápida do conteúdo da célula.

Você pode ativar a edição rápida para todos os campos através das configurações do componente de campo de associação.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Também pode ser ativado para campos de colunas individuais.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Tamanho da página (Padrão: 10)

Define o número de registros exibidos por página na subtabela.

## Notas de comportamento

- Ao selecionar registros existentes, a desduplicação é realizada com base na chave primária para evitar associações duplicadas do mesmo registro.
- Os registros recém-adicionados são preenchidos de volta na subtabela, e a visualização pula automaticamente para a página que contém o novo registro.
- A edição em linha modifica apenas os dados da linha atual.
- Remover um registro apenas desvincula a associação dentro do formulário atual; não exclui os dados de origem do banco de dados.
- Os dados são salvos no banco de dados apenas quando o formulário principal é enviado.