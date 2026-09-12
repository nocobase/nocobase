---
pkg: "@nocobase/plugin-data-source-main"
title: "Visualizações de banco de dados"
description: "Conecte visualizações já existentes no banco de dados como fontes de dados e configure campos e exibição no NocoBase, adequado para o gerenciamento visual de resultados de consultas complexas."
keywords: "Visualizações de banco de dados,Collection View,visualização"
---
# Conectar uma visualização de banco de dados

## Introdução

Conecte visualizações existentes no banco de dados, como visualizações de relatórios financeiros mantidas pelo DBA, visualizações de clientes filtradas e visualizações agregadas sincronizadas entre sistemas. Elas são adequadas para reutilizar lógicas de consulta já definidas no banco de dados.

:::tip Dica

São compatíveis as visualizações comuns dentro do escopo do proprietário da conta de conexão do banco de dados principal; visualizações materializadas não são compatíveis. Mesmo que essa conta tenha permissão de consulta para visualizações de outros proprietários, elas não aparecerão na lista de visualizações disponíveis para conexão. Antes da conexão, confirme que os campos da visualização têm nomes de coluna estáveis e que os tipos de dados podem ser reconhecidos pelo NocoBase.

:::

## Conectar uma visualização de banco de dados

1. Clique no menu de fontes de dados em funções do sistema para acessar a página inicial das fontes de dados.
2. Selecione a fonte de dados **Main** na lista de fontes de dados e clique na ação «Configure» para acessar o banco de dados principal.
3. No gerenciamento do banco de dados principal, clique em «Create collection» e selecione «Connect to database view»

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido para a visualização de banco de dados na interface, como «Visualização de relatório financeiro» ou «Visualização de estatísticas de clientes». Recomenda-se usar um nome que descreva a finalidade da visualização. |
| Collection name | Nome de identificação da visualização de banco de dados no NocoBase, usado em referências internas como API, campos de relacionamento, permissões e fluxos de trabalho. Ele é gerado automaticamente, mas também pode ser alterado manualmente; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Database view | Selecione a visualização de banco de dados à qual deseja se conectar. A estrutura dos campos e os resultados da consulta são lidos da visualização. Durante a edição, é possível consultar a view atualmente conectada, mas não mudar para outra view. |
| Categories | Categoria da tabela de dados. Afeta apenas a organização da interface de gerenciamento de tabelas de dados, sem alterar a própria visualização de banco de dados. |
| Description | Descrição da tabela de dados. Recomenda-se informar claramente quem mantém essa view, quais dados são consultados e em quais páginas ou relatórios ela é utilizada. |
| Use simple pagination mode | Modo de paginação simples. Quando ativado, a paginação dos blocos de tabela ignora a contagem do total de registros, sendo adequada para visualizações com grande volume de dados e reduzindo a pressão sobre as consultas. |
| Record unique key | Identificador exclusivo do registro. As visualizações de banco de dados normalmente não têm chave primária; é necessário selecionar um campo que identifique exclusivamente cada registro, caso contrário, talvez não seja possível visualizar ou editar os registros corretamente nos blocos. |
| Source collections | Origem dos campos da visualização de banco de dados. Usada para relacionar os campos da visualização aos campos de tabelas de dados existentes, ajudando o NocoBase a reconhecer os tipos e as interfaces dos campos. |
| Fields | Configuração do mapeamento de campos. Usada para confirmar o nome, o título, o tipo de dados e a interface de cada campo da visualização. |
| Preview | Visualização prévia dos resultados da visualização de banco de dados. Antes do envio, é possível confirmar se o mapeamento dos campos e o efeito da exibição correspondem ao esperado. |
| Allow add new, update and delete actions | Define se é permitido adicionar, atualizar e excluir dados na visualização de banco de dados. Quando ativado, o NocoBase disponibiliza as entradas das operações correspondentes na página; o sucesso da gravação ainda depende de a view ser gravável e de a conta do banco de dados ter permissões de insert, update e delete. |

:::tip Dica

`Source collections` são as tabelas de dados de origem inferidas com base na visualização de banco de dados. Elas identificam de quais tabelas de dados existentes vêm principalmente os campos da view e restringem as opções disponíveis de `Field source` durante o mapeamento dos campos.

Os resultados da inferência servem para auxiliar na configuração rápida. Se a view tiver renomeações de campos, cálculos, agregações ou joins complexos, o resultado poderá não ser totalmente preciso ou não ser inferido. Nesse caso, é necessário confirmar manualmente em `Fields`.

:::

### Mapeamento de campos

O mapeamento de campos é uma configuração que deve ser confirmada após a conexão com uma visualização de banco de dados. Depois de conectar a view, o NocoBase infere primeiro a origem e o tipo de banco de dados de cada campo da visualização. Quando o campo de origem pode ser inferido, o Field type, o Field interface e o Field display name do campo existente são preenchidos automaticamente; quando isso não é possível, o Field type inicial é definido com base no tipo do campo no banco de dados, sendo necessário confirmar manualmente o tipo e a configuração da interface.
[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| Configuração | Descrição |
| --- | --- |
| Field source | Selecione de qual tabela e campo existentes vem o campo da visualização. Depois de selecionar a origem, o NocoBase pode reutilizar o Field type e o Field interface do campo original. |
| Field type | Se o campo da visualização não tiver uma origem clara, confirme manualmente o tipo de dados do campo. |
| Field interface | Confirme como o campo será exibido e preenchido na página, por exemplo, texto de linha única, número, data ou opções suspensas. |
| Field display name | Nome exibido para o campo na interface. Recomenda-se usar um nome que possa ser compreendido pelos usuários de negócio. |

Por exemplo, se a visualização retornar `customer_name` e esse valor vier do campo «Nome do cliente» da tabela de clientes, ele poderá ser mapeado para o campo correspondente da tabela de clientes. Dessa forma, o NocoBase poderá reutilizar o título, o tipo e a configuração da interface do campo original.

Se o campo da visualização vier de um resultado agregado ou calculado, como `count(*) as total` e `sum(amount) as amount_total`, normalmente será necessário selecionar manualmente o Field type e um Field interface adequado.

:::tip Dica

`Field source` vem da inferência do NocoBase sobre a visualização de banco de dados e indica a qual campo existente um determinado campo da visualização pode corresponder. Quando um campo contém `Field source`, o NocoBase prioriza a reutilização do Field type e do Field interface do campo de origem.

Se não for possível inferir o campo de origem ou se o resultado não corresponder ao significado do negócio, exclua `Field source` e selecione manualmente `Field type` e `Field interface`、`Field display name`.

:::

### Identificador exclusivo do registro

As visualizações de banco de dados precisam configurar o Record unique key; caso contrário, não será possível criar blocos na página nem visualizar ou editar registros corretamente. É possível selecionar um campo ou uma combinação de vários campos como identificador exclusivo. Os campos adequados para servir como Record unique key normalmente atendem às seguintes condições:

- O valor do campo é exclusivo
- O valor do campo é estável e não muda devido à ordenação, paginação ou alteração do critério estatístico
- O campo não é nulo
- O campo é sempre retornado na view

Se a view vier de uma consulta em uma única tabela, dê preferência ao retorno da chave primária da tabela original. Se a view vier de um join entre várias tabelas ou de uma agregação, mantenha na visualização de banco de dados um ID de negócio estável ou gere um campo exclusivo estável no lado do banco de dados.

### Permitir operações de inclusão, atualização e exclusão

Se a view do banco de dados permitir gravações, ative «Allow add new, update and delete actions». O NocoBase permitirá executar operações de inclusão, atualização e exclusão nessa visualização pela página.

As visualizações de banco de dados são mais adequadas para uso como resultados de consultas e, por padrão, são tratadas como tabelas de dados somente leitura. Ative essa opção apenas depois de confirmar que a view oferece suporte às operações de gravação correspondentes e que as permissões do banco de dados também permitem essas gravações.

### Visualizar resultados da visualização

Antes do envio, use Preview para consultar os resultados da visualização. Durante a pré-visualização, confirme principalmente:

- se a view pode ser consultada normalmente
- se os campos estão completos
- se os tipos de campo e de interface correspondem ao significado do negócio
- se o Record unique key existe e os dados são exclusivos
- se os tipos de campo não compatíveis precisam ser ajustados no banco de dados

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## Configurar campos

Depois de criar a visualização de banco de dados, clique em «Configure fields» à direita da visualização na lista de tabelas de dados para acessar a página de configuração de campos. A configuração de campos é usada para manter os campos existentes na visualização, definir como eles serão exibidos na interface e mapear os campos da view para o Field type e o Field interface do NocoBase.

Os campos comuns de uma visualização de banco de dados vêm da view do banco de dados. O NocoBase não adiciona, modifica nem exclui diretamente colunas reais na view. Na página de configuração de campos, só é possível adicionar campos de relacionamento muitos-para-um, usados para complementar os relacionamentos de negócio no NocoBase. As visualizações de banco de dados não podem ser usadas como tabela de dados de destino de campos de relacionamento, e normalmente não é necessário configurar um campo de título.

[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### Adicionar campo de relacionamento

As visualizações de banco de dados só permitem adicionar campos de relacionamento muitos-para-um. Esses campos podem mapear campos existentes na view para a chave primária ou para um campo exclusivo da tabela de dados de destino, permitindo exibir registros relacionados na página, mas não criam campos reais nem restrições de chave estrangeira na view do banco de dados.

Clique em «Add field» para adicionar um campo de relacionamento muitos-para-um.

[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| Configuração | Descrição |
| --- | --- |
| Field display name | Nome exibido para o campo de relacionamento muitos-para-um na interface. Recomenda-se usar um nome que possa ser compreendido pelos usuários de negócio, como «Cliente associado» ou «Pedido relacionado». |
| Field name | Nome de identificação usado para salvar o campo de relacionamento muitos-para-um no NocoBase, utilizado em referências internas como API, permissões e fluxos de trabalho. |
| Source collection | Tabela de dados de origem, ou seja, a tabela de dados da visualização de banco de dados atual. Usada para determinar `Foreign key` a partir de qual campo da tabela de dados será selecionado; ao adicionar um campo de relacionamento muitos-para-um a uma visualização de banco de dados, normalmente deve ser mantida como a view atual. |
| Target collection | Tabela de dados de destino a ser relacionada. Normalmente são selecionadas tabelas de dados reais, como tabelas comuns ou tabelas de bancos de dados externos; não é possível selecionar uma visualização de banco de dados. |
| Foreign key | Campo da visualização de banco de dados atual usado para armazenar o identificador do registro de destino. Esse campo precisa ser retornado de forma estável nos resultados da consulta da view. |
| Target key | Campo da tabela de dados de destino que será correspondido por `Foreign key`; normalmente é selecionada a chave primária ou um campo exclusivo. |
| Description | Descrição do campo. Pode incluir o significado do relacionamento, a origem dos dados, a forma de manutenção ou observações importantes. |

### Mapeamento de campos

Depois de conectar a visualização de banco de dados, o NocoBase infere o Field type com base nos campos da view e nos campos de origem e associa uma Field interface padrão. Se a origem, a forma de exibição ou o significado do campo não corresponderem ao esperado, o mapeamento poderá ser ajustado na configuração do campo.

[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip Dica

- Field interface (tipo de interface / tipo de UI): determina como o campo será exibido e como o usuário interagirá com ele no frontend. Exemplos incluem «texto de linha única», «número», «menu suspenso» e «data e hora». É a classificação do campo na perspectiva do usuário.
- Field type (tipo de dados): determina como o NocoBase reconhece o tipo de dados do campo. Os campos da view sem um campo de origem normalmente são inferidos com base no tipo do campo no banco de dados, como `string`、`integer`、`decimal`、`boolean`、`datetime` e outros.

:::

:::warning Atenção

Ajustar Field source, Field type ou Field interface não equivale a modificar o tipo do campo na view do banco de dados. Essas opções afetam principalmente a forma de exibição na página, as regras de validação e a maneira como o NocoBase reconhece o campo.

:::

### S sincronizar do banco de dados

Se a estrutura dos campos da view for modificada no banco de dados, acesse «Configure fields» e clique em «Sync from database» para ler novamente a estrutura dos campos. Após a sincronização, o NocoBase atualizará os campos: adicionará os novos campos presentes na view, removerá os campos que já foram excluídos da view e confirmará novamente os tipos e as origens dos campos.

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning Atenção

Durante a sincronização, a renomeação de campos normalmente será tratada como “excluir o campo antigo + adicionar o novo campo”. Antes de sincronizar, confirme se o campo antigo já é usado por páginas, permissões, fluxos de trabalho ou APIs externas, para evitar falhas de configuração após a sincronização. Depois, verifique novamente o Field type e o Field interface.

:::

### Editar campos

Clique em «Edit» à direita de um campo para editar sua configuração. A edição de campos é adequada para ajustar como eles serão exibidos e usados no NocoBase, por exemplo, alterando o nome exibido, a descrição, as regras de validação ou as configurações específicas do campo.
[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning Atenção

A edição da configuração de um campo não modifica o nome da coluna real, o tipo do campo, a expressão SQL nem os índices na view do banco de dados. Se for necessário ajustar a estrutura real da view, modifique-a primeiro no banco de dados e depois use «Sync from database» para sincronizar.

:::

### Excluir campos

Clique em «Delete» à direita de um campo para excluí-lo. A exclusão remove apenas o campo salvo no NocoBase; a coluna real da view do banco de dados não é excluída.

[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning Atenção

A exclusão de um campo pode afetar blocos de página, condições de filtragem, ordenação, permissões, fluxos de trabalho, APIs e configurações existentes. Antes de excluí-lo, confirme se o campo ainda está em uso. Se a view do banco de dados continuar retornando essa coluna, o NocoBase poderá identificá-la novamente durante uma futura execução de «Sync from database».

:::

## Editar visualização

A definição SQL da visualização de banco de dados é mantida no lado do banco de dados. Na lista de tabelas de dados, clique em «Edit» à direita de uma visualização para ajustar seus metadados e configurações de execução no NocoBase; isso não modifica a view no banco de dados. Se precisar conectar outra view do banco de dados, recomenda-se criar uma nova tabela de dados de visualização.

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido para a visualização de banco de dados na interface. Pode ser alterado para um nome que os usuários de negócio compreendam, como «Visualização de relatório financeiro» ou «Visualização de estatísticas de clientes». |
| Collection name | Nome de identificação da visualização de banco de dados no NocoBase. Não pode ser alterado durante a edição. |
| Database view | View do banco de dados atualmente conectada. É somente leitura durante a edição e não pode ser alterada para outra view. |
| Categories | Categoria da tabela de dados. Afeta apenas a organização da interface de gerenciamento da fonte de dados, sem alterar a view do banco de dados. |
| Description | Descrição da tabela de dados. É adequado informar quem mantém a view, a origem da consulta e as páginas ou relatórios em que ela é usada. |
| Use simple pagination mode | Modo de paginação simples. Quando ativado, a paginação dos blocos de tabela ignora a contagem do total de registros, sendo adequada para views com grande volume de dados. |
| Record unique key | Identificador exclusivo do registro. Usado para localizar um registro; normalmente é selecionado um campo ou uma combinação de campos estável e exclusiva na view. |
| Allow add new, update and delete actions | Define se é permitido adicionar, atualizar e excluir registros. Só é recomendável ativar quando a própria view do banco de dados permitir gravações e a conta do banco de dados tiver as permissões correspondentes. |

:::warning Atenção

Depois de modificar o Record unique key ou Allow add new, update and delete actions, verifique novamente se os blocos de página, as permissões e os fluxos de trabalho continuam funcionando conforme o esperado.

:::

## Excluir visualização

Na lista de tabelas de dados, clique em «Delete» à direita de uma visualização de banco de dados para excluir sua tabela de dados. A exclusão remove apenas a configuração de conexão e os campos no NocoBase; a view no banco de dados não é excluída.

As visualizações de banco de dados do banco principal também podem ser selecionadas em lote e excluídas de uma só vez. Antes de excluir, verifique se blocos de página, gráficos, permissões, fluxos de trabalho e APIs externas ainda usam essa tabela de dados de visualização.
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)