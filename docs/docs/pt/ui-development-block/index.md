:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral das Extensões de Bloco

Na NocoBase 2.0, o mecanismo de extensão de bloco foi bastante simplificado. Desenvolvedores só precisam herdar a **classe base** `FlowModel` correspondente e implementar os métodos de interface relacionados (principalmente o método `renderComponent()`) para personalizar blocos rapidamente.

## Categorias de Blocos

NocoBase categoriza os blocos em três tipos, exibidos em grupos na interface de configuração:

- **Blocos de Dados**: Blocos que herdam de `DataBlockModel` ou `CollectionBlockModel`
- **Blocos de Filtro**: Blocos que herdam de `FilterBlockModel`
- **Outros Blocos**: Blocos que herdam diretamente de `BlockModel`

> O agrupamento dos blocos é determinado pela classe base correspondente. A lógica de classificação é baseada nas relações de herança e não requer configuração adicional.

## Descrição das Classes Base

O sistema oferece quatro classes base para extensões:

### BlockModel

**Modelo de Bloco Básico**, a classe base de bloco mais versátil.

- Ideal para blocos de exibição pura que não dependem de dados.
- É categorizado no grupo **Outros Blocos**.
- Aplicável a cenários personalizados.

### DataBlockModel

**Modelo de Bloco de Dados (não vinculado a uma tabela de dados)**, para blocos com fontes de dados personalizadas.

- Não é diretamente vinculado a uma tabela de dados, permitindo personalizar a lógica de busca de dados.
- É categorizado no grupo **Blocos de Dados**.
- Aplicável a: chamadas de APIs externas, processamento de dados personalizado, gráficos estatísticos, entre outros cenários.

### CollectionBlockModel

**Modelo de Bloco de Coleção**, para blocos que precisam ser vinculados a uma tabela de dados.

- Requer vinculação a uma classe base de modelo de tabela de dados.
- É categorizado no grupo **Blocos de Dados**.
- Aplicável a: listas, formulários, quadros Kanban e outros blocos que dependem claramente de uma tabela de dados específica.

### FilterBlockModel

**Modelo de Bloco de Filtro**, para construir blocos de condição de filtro.

- Classe base de modelo para construir condições de filtro.
- É categorizado no grupo **Blocos de Filtro**.
- Geralmente funciona em conjunto com blocos de dados.

## Como Escolher uma Classe Base

Ao selecionar uma classe base, você pode seguir estes princípios:

- **Precisa vincular a uma tabela de dados**: Priorize `CollectionBlockModel`.
- **Fonte de dados personalizada**: Escolha `DataBlockModel`.
- **Para definir condições de filtro e trabalhar com blocos de dados**: Escolha `FilterBlockModel`.
- **Não tem certeza de como categorizar**: Escolha `BlockModel`.

## Início Rápido

Criar um bloco personalizado requer apenas três passos:

1. Herdar a classe base correspondente (por exemplo, `BlockModel`).
2. Implementar o método `renderComponent()` para retornar um componente React.
3. Registrar o modelo de bloco no **plugin**.

Para exemplos detalhados, consulte [Escrever um Plugin de Bloco](./write-a-block-plugin).