---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Aplicação na UI

## Permissões de Bloco de Dados

A visibilidade dos blocos de dados em uma **coleção** é controlada pelas permissões de ação de visualização, com configurações individuais tendo precedência sobre as configurações globais.

Por exemplo, sob as permissões globais, a função "admin" tem acesso total, mas a **coleção** de Pedidos pode ter permissões individuais configuradas, tornando-a invisível.

Configuração de permissão global:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Configuração de permissão individual da **coleção** de Pedidos:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

Na UI, todos os blocos da **coleção** de Pedidos não são exibidos.

Processo de configuração completo:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Permissões de Campo

**Visualizar**: Determina se campos específicos são visíveis no nível do campo, permitindo controlar quais campos são visíveis para certas funções dentro da **coleção** de Pedidos.

![](https://static-docs.nocobase.com/30dea84d984d95036e6f7b180955a6cf.png)

Na UI, apenas os campos com permissões configuradas são visíveis dentro do bloco da **coleção** de Pedidos. Campos do sistema (Id, CreatedAt, LastUpdatedAt) mantêm as permissões de visualização mesmo sem configuração específica.

![](https://static-docs.nocobase.com/40cc49b17efe701147fd2e799e79dcc.png)

- **Editar**: Controla se os campos podem ser editados e salvos (atualizados).

  Configure as permissões de edição para os campos da **coleção** de Pedidos (quantidade e itens associados têm permissões de edição):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  Na UI, apenas os campos com permissões de edição são exibidos no bloco do formulário de ação de edição dentro da **coleção** de Pedidos.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Processo de configuração completo:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Adicionar**: Determina se os campos podem ser adicionados (criados).

  Configure as permissões de adição para os campos da **coleção** de Pedidos (número do pedido, quantidade, itens e envio têm permissões de adição):

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  Na UI, apenas os campos com permissões de adição são exibidos dentro do bloco do formulário de ação de adição da **coleção** de Pedidos.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Exportar**: Controla se os campos podem ser exportados.
- **Importar**: Controla se os campos suportam importação.

## Permissões de Ação

As permissões configuradas individualmente têm a maior prioridade. Se permissões específicas forem configuradas, elas substituem as configurações globais; caso contrário, as configurações globais são aplicadas.

- **Adicionar**: Controla se o botão de ação de adição é visível dentro de um bloco.

  Configure permissões de ação individuais para a **coleção** de Pedidos para permitir a adição:

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Quando a ação de adição é permitida, o botão de adição aparece na área de ação do bloco da **coleção** de Pedidos na UI.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Visualizar**

  Determina se o bloco de dados é visível.

  Configuração de permissão global (sem permissão de visualização):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Configuração de permissão individual da **coleção** de Pedidos:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  Na UI, os blocos de dados para todas as outras **coleções** permanecem ocultos, mas o bloco da **coleção** de Pedidos é exibido.

  Processo de configuração de exemplo completo:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Editar**

  Controla se o botão de ação de edição é exibido dentro de um bloco.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  As permissões de ação podem ser ainda mais refinadas definindo o escopo dos dados.

  Por exemplo, configurando a **coleção** de Pedidos para que os usuários possam editar apenas seus próprios dados:

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Excluir**

  Controla se o botão de ação de exclusão é visível dentro de um bloco.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Exportar**

  Controla se o botão de ação de exportação é visível dentro de um bloco.

- **Importar**

  Controla se o botão de ação de importação é visível dentro de um bloco.

## Permissões de Associação

### Como um Campo

- As permissões de um campo de associação são controladas pelas permissões de campo da **coleção** de origem. Isso controla se o componente inteiro do campo de associação é exibido.

Por exemplo, na **coleção** de Pedidos, o campo de associação "Cliente" tem apenas permissões de visualização, importação e exportação.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

Na UI, isso significa que o campo de associação "Cliente" não será exibido nos blocos de ação de adição e edição da **coleção** de Pedidos.

Processo de configuração de exemplo completo:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- As permissões para campos dentro do componente de campo de associação (como uma sub-tabela ou sub-formulário) são determinadas pelas permissões da **coleção** de destino.

Quando o componente de campo de associação é um sub-formulário:

Como mostrado abaixo, o campo de associação "Cliente" na **coleção** de Pedidos tem todas as permissões, enquanto a **coleção** de Clientes em si está configurada como somente leitura.

Configuração de permissão individual para a **coleção** de Pedidos, onde o campo de associação "Cliente" tem todas as permissões de campo:

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Configuração de permissão individual para a **coleção** de Clientes, onde os campos têm permissões somente de visualização:

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

Na UI, o campo de associação "Cliente" é visível no bloco da **coleção** de Pedidos. No entanto, quando alternado para um sub-formulário, os campos dentro do sub-formulário são visíveis na visualização de detalhes, mas não são exibidos nas ações de adição e edição.

Processo de configuração de exemplo completo:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Para controlar ainda mais as permissões para campos dentro do sub-formulário, você pode conceder permissões a campos individuais.

Como mostrado, a **coleção** de Clientes é configurada com permissões de campo individuais (Nome do Cliente não é visível e não é editável).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Processo de configuração de exemplo completo:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Quando o componente de campo de associação é uma sub-tabela, a situação é consistente com a de um sub-formulário:

Como mostrado, o campo de associação "Envio" na **coleção** de Pedidos tem todas as permissões, enquanto a **coleção** de Envios está configurada como somente leitura.

Na UI, este campo de associação é visível. No entanto, quando alternado para uma sub-tabela, os campos dentro da sub-tabela são visíveis na ação de visualização, mas não nas ações de adição e edição.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Para controlar ainda mais as permissões para campos dentro da sub-tabela, você pode conceder permissões a campos individuais:

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Como um Bloco

- A visibilidade de um bloco de associação é controlada pelas permissões da **coleção** de destino do campo de associação correspondente, e é independente das permissões do campo de associação.

Por exemplo, se o bloco de associação "Cliente" é exibido é controlado pelas permissões da **coleção** de Clientes.

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Os campos dentro de um bloco de associação são controlados pelas permissões de campo na **coleção** de destino.

Como mostrado, você pode definir permissões de visualização para campos individuais na **coleção** de Clientes.

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)