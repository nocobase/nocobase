:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Permissões de Operação

## Introdução

No NocoBase 2.0, as permissões de operação são controladas principalmente pelas permissões de recurso da **coleção**:

- **Permissão de Recurso da Coleção**: Usada para controlar de forma unificada as permissões de operação básicas de diferentes papéis para uma **coleção**, como criar (Create), visualizar (View), atualizar (Update) e excluir (Delete). Essa permissão se aplica a toda a **coleção** sob a **fonte de dados**, garantindo que as permissões de operação correspondentes de um papel para essa **coleção** permaneçam consistentes em diferentes páginas, pop-ups e blocos.

### Permissão de Recurso da Coleção

No sistema de permissões do NocoBase, as permissões de operação da **coleção** são basicamente divididas pelas dimensões CRUD para garantir consistência e padronização no gerenciamento de permissões. Por exemplo:

- **Permissão de Criação (Create)**: Controla todas as operações relacionadas à criação para a **coleção**, incluindo operações de adição, duplicação, etc. Enquanto um papel tiver a permissão de criação para esta **coleção**, as operações de adição, duplicação e outras operações de criação relacionadas a ela serão visíveis em todas as páginas e pop-ups.
- **Permissão de Exclusão (Delete)**: Controla a operação de exclusão para esta **coleção**. A permissão permanece consistente, seja uma operação de exclusão em massa em um bloco de tabela ou uma operação de exclusão de um único registro em um bloco de detalhes.
- **Permissão de Atualização (Update)**: Controla as operações do tipo atualização para esta **coleção**, como operações de edição e atualização de registro.
- **Permissão de Visualização (View)**: Controla a visibilidade dos dados desta **coleção**. Somente quando o papel tiver permissão de visualização para esta **coleção**, os blocos de dados relacionados (Tabela, Lista, Detalhes, etc.) serão visíveis.

Este método de gerenciamento de permissões universal é adequado para o controle padronizado de permissões de dados, garantindo que, em `diferentes páginas, pop-ups e blocos`, para a `mesma coleção`, a `mesma operação` tenha regras de permissão `consistentes`, proporcionando uniformidade e manutenibilidade.

#### Permissões Globais

As permissões de operação globais aplicam-se a todas as **coleções** sob a **fonte de dados** e são categorizadas por tipo de recurso da seguinte forma

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Permissões de Operação de Coleção Específica

As permissões de operação de **coleção** específica se sobrepõem às permissões gerais da **fonte de dados**, refinando ainda mais as permissões de operação e permitindo configurações de permissão personalizadas para o acesso a recursos de uma **coleção** específica. Essas permissões são divididas em dois aspectos:

1. Permissões de Operação: As permissões de operação incluem adicionar, visualizar, editar, excluir, exportar e importar. Essas permissões são configuradas com base na dimensão do escopo dos dados:

   - Todos os dados: Permite que os usuários realizem operações em todos os registros da **coleção**.
   - Seus próprios dados: Restringe os usuários a realizar operações apenas nos registros de dados que eles criaram.

2. Permissões de Campo: As permissões de campo permitem configurar permissões para cada campo em diferentes operações. Por exemplo, alguns campos podem ser configurados para serem apenas visíveis e não editáveis.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

## Documentação Relacionada

[Configurar Permissões]