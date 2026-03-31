:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Componentes de Campo de Relacionamento

## Introdução

Os componentes de campo de relacionamento do NocoBase foram projetados para ajudar você a exibir e gerenciar dados relacionados de forma mais eficiente. Independentemente do tipo de relacionamento, esses componentes são flexíveis e versáteis, permitindo que você os selecione e configure de acordo com suas necessidades específicas.

### Dropdown

Para todos os campos de relacionamento, exceto quando a **coleção** de destino é uma **coleção** de arquivos, o componente padrão no modo de edição é o Dropdown. As opções do Dropdown exibem o valor do campo de título, tornando-o ideal para cenários onde dados relacionados podem ser rapidamente selecionados ao exibir informações de um campo chave.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Para mais detalhes, consulte [Dropdown](/interface-builder/fields/specific/select)

### Seletor de Dados

O Seletor de Dados apresenta as informações em um modal pop-up. Você pode configurar os campos a serem exibidos no seletor (incluindo campos de relacionamentos aninhados), permitindo uma seleção mais precisa dos dados relacionados.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Para mais detalhes, consulte [Seletor de Dados](/interface-builder/fields/specific/picker)

### Subformulário

Ao lidar com dados de relacionamento mais complexos, usar um Dropdown ou um Seletor de Dados pode ser inconveniente. Nesses casos, você precisaria abrir pop-ups com frequência. Para essas situações, o Subformulário é a solução ideal. Ele permite que você mantenha diretamente os campos da **coleção** associada na página atual ou no bloco pop-up atual, sem a necessidade de abrir novos pop-ups repetidamente, tornando o **fluxo de trabalho** mais fluido. Relacionamentos de múltiplos níveis são exibidos como formulários aninhados.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Para mais detalhes, consulte [Subformulário](/interface-builder/fields/specific/sub-form)

### Subtabela

A Subtabela exibe registros de relacionamentos um-para-muitos ou muitos-para-muitos em formato de tabela. Ela oferece uma maneira clara e estruturada de exibir e gerenciar dados relacionados, e permite criar novos dados em massa ou selecionar dados existentes para associar.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Para mais detalhes, consulte [Subtabela](/interface-builder/fields/specific/sub-table)

### Subdetalhe

O Subdetalhe é o componente correspondente ao Subformulário no modo de leitura. Ele suporta a exibição de dados com relacionamentos aninhados de múltiplos níveis.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Para mais detalhes, consulte [Subdetalhe](/interface-builder/fields/specific/sub-detail)

### Gerenciador de Arquivos

O Gerenciador de Arquivos é um componente de campo de relacionamento usado especificamente quando a **coleção** de destino do relacionamento é uma **coleção** de arquivos.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Para mais detalhes, consulte [Gerenciador de Arquivos](/interface-builder/fields/specific/file-manager)

### Título

O componente de campo Título é um componente de campo de relacionamento usado no modo de leitura. Ao configurar o campo de título, você pode configurar o componente de campo correspondente.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Para mais detalhes, consulte [Título](/interface-builder/fields/specific/title)