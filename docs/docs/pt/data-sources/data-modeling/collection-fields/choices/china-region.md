---
title: "Divisões administrativas da China"
description: "O campo de divisões administrativas da China é usado para selecionar informações como província, cidade e distrito ou condado."
keywords: "divisões administrativas da China,china region,endereço,campo de opções,NocoBase"
---

# Divisões administrativas da China (obsoleto)

## Introdução

:::warning Atenção

O campo de divisões administrativas da China foi descontinuado. Recomenda-se usar um campo de relação para associar uma tabela hierárquica.

:::

No NocoBase, **China region** é usado para selecionar divisões administrativas da China, como províncias, cidades, distritos e condados.

O campo de divisões administrativas da China é adequado para cenários que exigem seleção estruturada de regiões, como endereços de clientes, endereços de lojas e áreas de serviço. Ele facilita a filtragem e a geração de estatísticas em comparação com a inserção manual de endereços.

Se for necessário salvar um endereço completo e detalhado, você pode combiná-lo com [texto de linha única](../basic/input.md) ou [texto multilinha](../basic/textarea.md) para salvar a rua e o número.

## Cenários aplicáveis

As divisões administrativas da China são adequadas para estes cenários de negócio:

- Província, cidade e distrito ou condado do cliente
- Área de serviço da loja
- Região de implementação do projeto
- Divisão administrativa no endereço de entrega

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «中国行政区划» para criar um campo de divisões administrativas da China.

![20240512180305](https://static-docs.nocobase.com/20240512180305.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. As divisões administrativas da China correspondem a `chinaRegion`, que determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Região», «Área de serviço» ou «Região de entrega». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Os campos de divisões administrativas normalmente são armazenados como valores estruturados; o Field type específico depende da configuração do campo. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Normalmente são configuradas como obrigatoriedade e nível de seleção. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de divisões administrativas da China é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `chinaRegion`. |
| Field type padrão | `json`. |
| Field type disponível | `json`, `string`, conforme a configuração real do campo. |
| Componente da página | No modo de edição, é usado o componente de seleção de divisões administrativas. |
| Filtragem | Permite filtrar por valores de região; os recursos específicos dependem da configuração do campo. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Permite validações básicas, como obrigatoriedade. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de divisões administrativas da China. A edição do campo serve principalmente para ajustar a forma como ele é exibido e usado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem modificar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão dos novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou o Field interface não equivale a simplesmente mudar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de divisões administrativas da China. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de divisões administrativas da China criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração da página

O campo de divisões administrativas da China é adequado para uso em cenários de endereços, regiões e estatísticas.

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar província, cidade, distrito ou condado. |
| Bloco de detalhes | Exibir a divisão administrativa. |
| Bloco de filtragem | Filtrar registros por região. |
| Bloco de gráfico | Gerar estatísticas de dados de negócio por região. |

## Links relacionados

- [Campo](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Texto de linha única](../basic/input.md) — Salvar um endereço detalhado
- [Texto multilinha](../basic/textarea.md) — Salvar uma descrição de endereço mais longa
