---
title: "Seleção múltipla suspensa"
description: "O campo de seleção múltipla suspensa é usado para selecionar vários valores entre opções predefinidas, sendo adequado para campos como tags, capacidades e preferências."
keywords: "seleção múltipla suspensa,multiple select,tags,campo de opções,NocoBase"
---

# Seleção múltipla suspensa

## Introdução

No NocoBase, a **seleção múltipla suspensa (Multiple select)** é usada para selecionar vários valores de um conjunto de opções.

A seleção múltipla suspensa é adequada para campos como tags, capacidades, preferências e escopo de aplicação. Ela armazena vários valores de opções, que normalmente são exibidos como tags na página.

Se for possível selecionar apenas um valor, escolha [seleção única suspensa](./select.md) ou [grupo de botões de opção](./radio-group.md).

## Cenários de uso

A seleção múltipla suspensa é adequada para estes cenários de negócio:

- Tags de clientes e preferências de usuários
- Cenários de aplicação de produtos e capacidades de dispositivos
- Pontos de risco de projetos e categorias de problemas
- Campos que permitem selecionar vários valores fixos

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Seleção múltipla suspensa» para criar um campo de seleção múltipla suspensa.

![20240512180236](https://static-docs.nocobase.com/20240512180236.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A seleção múltipla suspensa corresponde a `multipleSelect`, determinando como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Tags de clientes», «Cenários de aplicação» e «Categoria de problemas». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. A seleção múltipla suspensa normalmente é armazenada como um array ou JSON, dependendo da configuração do campo e dos recursos da fonte de dados. |
| Default value | Valor padrão. Ao criar um registro, o valor padrão pode ser preenchido automaticamente se o usuário não inserir nenhum valor. |
| Validation rules | Regras de validação. Normalmente são configuradas como obrigatoriedade e intervalo de opções. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de seleção múltipla suspensa é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `multipleSelect`. |
| Field type padrão | `array`. |
| Field type disponível | `array`、`json`, conforme o mapeamento real do campo. |
| Componente da página | No modo de edição, usa um seletor suspenso de múltipla seleção. |
| Filtragem | Permite filtrar pela inclusão de uma determinada opção. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Permite restrições de obrigatoriedade e intervalo de opções. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de seleção múltipla suspensa. A edição do campo é usada principalmente para ajustar como ele será exibido e utilizado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Isso afetará a forma de entrada, exibição e validação na página. |
| Field type | Condicionalmente | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao criar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Trocar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de seleção múltipla suspensa. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de seleção múltipla suspensa criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de seleção múltipla suspensa é adequado para representar várias tags ou várias opções fixas.
![20260709230017](https://static-docs.nocobase.com/20260709230017.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar vários valores entre as opções. |
| Bloco de tabela | Exibir as opções como várias tags. |
| Bloco de filtro | Filtrar pela inclusão de determinadas tags. |
| Fluxos de trabalho e permissões | Participar de condições como incluir ou não incluir para realizar verificações. |

## Links relacionados

- [Campo](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Seleção única suspensa](./select.md) — Selecionar um valor entre as opções
- [Grupo de caixas de seleção](./checkbox-group.md) — Selecionar vários valores usando caixas de seleção
