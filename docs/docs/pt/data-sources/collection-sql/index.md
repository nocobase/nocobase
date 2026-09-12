---
pkg: "@nocobase/plugin-collection-sql"
title: "Tabela SQL"
description: "Crie tabelas de dados a partir de resultados de consultas SQL e configure a origem dos campos, o mapeamento dos campos e o identificador exclusivo dos registros, adequado para consultas relacionadas, estatísticas e exibição de relatórios."
keywords: "Tabela SQL,coleção SQL,consulta SQL,mapeamento de campos,relatórios,NocoBase"
---

#  Tabela SQL

## Introdução

Escrever uma consulta SQL para formar uma tabela SQL não cria uma tabela física no banco de dados. Em vez disso, lê os resultados da consulta, permitindo usá-los em tabelas, detalhes, gráficos e workflows. Cenários aplicáveis: consolidação de dados e relatórios estatísticos.

:::warning Atenção

As tabelas SQL aceitam apenas instruções `SELECT` ou instruções `WITH ... SELECT`. Elas permitem apenas consultar e exibir dados; não permitem criar, editar ou excluir dados.

:::

## Criar uma tabela SQL

1. Clique no menu de fontes de dados, em funções do sistema, para acessar a página inicial das fontes de dados.
2. Selecione a fonte de dados **Main** na lista de fontes de dados e clique na ação «Configure» para acessar o banco de dados principal.
3. Na administração do banco de dados principal, clique em «Create collection» e selecione «SQL collection».

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![create_sql_collection](https://static-docs.nocobase.com/create_sql_collection.png)
![create_sql_collection_configure](https://static-docs.nocobase.com/create_sql_collection_configure.png)

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido da tabela SQL na interface, como «Resumo de vendas» ou «Alerta de estoque». Recomenda-se usar um nome que explique o significado dos resultados da consulta. |
| Collection name | Nome de identificação da tabela SQL no NocoBase, usado para referências internas em APIs, campos de relacionamento, permissões, workflows e outros recursos. Ele é gerado automaticamente, mas também pode ser alterado manualmente; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Categories | Categoria da tabela de dados. Afeta apenas a organização da interface de gerenciamento de tabelas de dados, sem alterar a consulta SQL. |
| Description | Descrição da tabela de dados. Recomenda-se indicar claramente quais dados são consultados por este SQL, quem o mantém e em qual página ou relatório ele é usado. |
| Record unique key | Identificador exclusivo do registro. Os resultados da consulta SQL não têm uma chave primária real; é necessário selecionar um campo ou combinação de campos que identifique exclusivamente cada registro. Caso contrário, talvez não seja possível visualizar os registros corretamente nos blocos. |
| SQL | Consulta usada pela tabela SQL. O NocoBase executará este SQL, configurará os campos com base nos resultados da consulta e usará esses resultados como uma tabela de dados. |
| Source collections | Origem dos campos dos resultados da consulta SQL. Usado para relacionar os campos dos resultados da consulta aos campos das tabelas de dados existentes, ajudando o NocoBase a identificar a origem e o tipo de interface dos campos. |
| Fields | Configuração do mapeamento de campos. Usada para confirmar o nome, a origem, o tipo de interface e o nome de exibição de cada campo. |
| Preview | Visualização dos resultados da consulta SQL. Antes de enviar, é possível confirmar se o mapeamento dos campos e o efeito da exibição atendem às expectativas. |

### Escrever uma consulta SQL

Insira a consulta SQL e clique em «Execute» para executá-la e tentar analisar os campos retornados e as tabelas de dados de origem.
Clique em «Execute» apenas para executar a visualização e analisar os campos. Depois de confirmar que a consulta SQL está disponível, clique em «Confirm» para que o formulário possa enviá-la como uma consulta confirmada.

![execute_sql_statement](https://static-docs.nocobase.com/202405191453556.png)

:::tip Dica

`Source collections` são as tabelas de dados de origem inferidas com base na consulta SQL. Elas identificam de quais tabelas de dados existentes vêm principalmente os campos dos resultados da consulta e limitam os `Field source` disponíveis durante o mapeamento dos campos.

Os resultados da inferência servem para auxiliar na configuração rápida. Se a consulta SQL contiver aliases, subconsultas, campos calculados, funções de agregação ou joins complexos, o resultado poderá não ser totalmente preciso ou não ser inferido. Nesse caso, é possível especificar manualmente `Source collections`.

:::

### Mapeamento de campos

O mapeamento de campos é uma configuração que deve ser confirmada após a criação de uma tabela SQL. Os resultados da consulta SQL informam ao NocoBase apenas quais colunas foram retornadas. Para que essas colunas possam ser usadas na interface como campos comuns, também é necessário confirmar `Field source` ou configurar `Field interface` e o nome de exibição do campo.
[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

![configure_sql_field_source](https://static-docs.nocobase.com/202405191453579.png)
![configure_sql_field_interface](https://static-docs.nocobase.com/202405191454703.png)

| Configuração | Descrição |
| --- | --- |
| Field source | Selecione de qual tabela e campo de dados existentes vêm os campos dos resultados da consulta SQL. Depois de selecionar a origem, o NocoBase pode reutilizar o Field interface do campo original. |
| Field interface | Confirme como o campo será exibido e inserido na página, por exemplo, texto de uma linha, número, data ou opções suspensas. |
| Field display name | Nome exibido do campo na interface. Recomenda-se usar um nome que seja compreensível para os usuários de negócio. |

Por exemplo, se a consulta SQL retornar `customers.name as customer_name` e esse valor vier do campo «Nome do cliente» da tabela de clientes, você poderá mapeá-lo para o campo correspondente da tabela de clientes. Assim, o NocoBase poderá reutilizar o título e a configuração da interface do campo original.

Se o campo vier de um resultado calculado, como `count(*) as total` ou `sum(amount) as amount_total`, normalmente não haverá um campo de origem claro. Nesse caso, será necessário selecionar manualmente um Field interface adequado.

:::tip Dica

`Field source` depende de `Source collections`. Somente depois de selecionar a tabela de dados de origem os campos de origem disponíveis nessa tabela aparecerão na tabela de mapeamento de campos.

Quando a inferência de campos contiver `Field source`, o NocoBase dará prioridade à reutilização do Field interface do campo de origem. Se não for possível inferir o campo de origem, você poderá especificar manualmente `Field source`. Se o resultado da inferência não corresponder ao significado do negócio, será necessário excluir `Field source`; depois, você poderá especificar manualmente `Field source` ou selecionar manualmente `Field interface` e configurar `Field display name`.

:::

### Identificador exclusivo do registro

É necessário configurar o Record unique key da tabela SQL; caso contrário, não será possível criar blocos na página nem visualizar os registros corretamente. É possível selecionar um campo ou uma combinação de vários campos como identificador exclusivo. Os campos adequados para usar como Record unique key geralmente atendem às seguintes condições:

- Cada linha dos resultados da consulta é exclusiva
- Os valores dos campos são estáveis e não mudam devido à paginação, à ordenação ou a alterações no critério estatístico
- O campo não é nulo
- O campo é sempre retornado nos resultados da consulta

Se os resultados da consulta vierem de uma única tabela, dê prioridade ao retorno da chave primária da tabela original. Se vierem de um join entre várias tabelas ou de uma agregação, mantenha na consulta SQL um ID de negócio estável ou retorne vários campos que, em conjunto, identifiquem o registro.

:::warning Atenção

Não use valores como `row_number()`, que mudam conforme a ordenação, os filtros ou o intervalo estatístico, como um Record unique key estável de longo prazo. Depois que o identificador exclusivo do registro mudar, os blocos da página, as permissões, os workflows e as APIs externas poderão não conseguir localizar o mesmo registro.

:::

### Visualizar os resultados da consulta

Antes de enviar, use Preview para visualizar os resultados da consulta SQL. Durante a visualização, confirme principalmente:

- Se o SQL pode ser executado normalmente
- Se os campos retornados estão completos
- Se o Field interface e o nome de exibição correspondem ao significado do negócio
- Se o Record unique key existe e os dados são exclusivos
- Se os resultados da consulta são adequados para exibição na página

![preview_sql_collection](https://static-docs.nocobase.com/202405191455439.png)

## Configurar campos

Depois de criar a tabela SQL, clique em «Configure fields» à direita da tabela SQL na lista de tabelas de dados para acessar a página de configuração de campos. A configuração de campos permite manter os campos da tabela SQL, definir como eles serão exibidos na interface e determinar como os resultados da consulta SQL serão mapeados para o Field interface do NocoBase.
[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

### Alterar o tipo de interface

Depois de criar a tabela SQL, ainda é possível ajustar a configuração da interface dos campos na configuração de campos. Essa página é usada principalmente para alterar o Field interface, modificar o nome de exibição, a descrição e as configurações específicas do campo.
![configure_field_sql](https://static-docs.nocobase.com/configure_field_sql.png)

É adequado tratar aqui dos seguintes casos:

- Ao criar a tabela SQL, o Field interface foi definido incorretamente
- O nome de exibição do campo não corresponde aos hábitos do negócio e precisa ser alterado para um nome mais compreensível
- O significado de negócio do campo retornado pela consulta mudou e é necessário confirmar novamente a forma de exibição
- A descrição ou a configuração específica do campo precisa ser ajustada, como as opções suspensas

### Sicronizar com o banco de dados

Se a consulta SQL não tiver mudado, mas a estrutura da tabela de dados subjacente ou os campos tiverem sido alterados, acesse «Configure fields» e clique em «Sync from database» para executar o SQL novamente e sincronizar os campos. Consulte [«Criar uma tabela SQL»](#字段映射) para obter informações sobre o mapeamento de campos.

![sync_sql_collection_fields](https://static-docs.nocobase.com/202405191456216.png)

### Editar campos

Clique em «Edit» à direita do campo para editar sua configuração. A edição de campos é adequada para ajustar como eles serão exibidos e usados no NocoBase, por exemplo, para modificar o nome de exibição, a descrição, as regras de validação ou as configurações específicas do campo.
[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

:::warning Atenção

Editar a configuração de campos não modifica a consulta SQL, o nome do campo da tabela de origem, a definição do campo da tabela de origem nem os índices do banco de dados. Se for necessário ajustar as colunas reais dos resultados da consulta, modifique primeiro a consulta SQL e depois execute novamente a sincronização dos campos.

:::

### Excluir campos

Clique em «Delete» à direita do campo para excluir um único campo. A exclusão remove apenas o campo salvo no NocoBase; não exclui a consulta SQL nem a coluna real da tabela de dados de origem.
[Saiba mais sobre a configuração de campos](../data-modeling/collection-fields/index.md)

:::warning Atenção

A exclusão de campos pode afetar blocos da página, condições de filtro, ordenação, permissões, workflows, APIs e configurações existentes. Antes de excluir, confirme se o campo ainda está sendo usado. Se a consulta SQL ainda retornar essa coluna, o NocoBase poderá identificá-la novamente na próxima execução de «Sync from database».

:::

## Editar a tabela SQL

Na lista de tabelas de dados, clique em «Edit» à direita de uma tabela SQL para ajustar os metadados e a configuração de execução da tabela SQL no NocoBase. Os itens de configuração durante a edição são basicamente os mesmos da criação da tabela SQL; apenas `Collection name` não pode ser modificado.

Se a consulta SQL mudar, clique novamente em «Execute» e confirme o mapeamento dos campos, o Record unique key e os resultados da visualização.

![edit_sql_collection](https://static-docs.nocobase.com/202405191455302.png)

:::warning Atenção

Modificar a consulta SQL pode alterar os nomes dos campos, o mapeamento dos campos ou o Record unique key. Depois da alteração, verifique novamente se os blocos da página, os gráficos, as permissões e os workflows continuam funcionando corretamente.

:::

## Excluir a tabela SQL

Na lista de tabelas de dados, clicar em «Delete» à direita da tabela SQL excluirá apenas a configuração e os campos da tabela SQL no NocoBase. A tabela de origem subjacente e os dados nela contidos não serão excluídos.
Também é possível selecionar várias tabelas e excluí-las em conjunto. Antes de excluir, verifique se os blocos da página, os gráficos, as permissões, os workflows e as APIs externas ainda usam essa tabela SQL.