---
title: "Texto multilinha"
description: "O campo de texto multilinha é usado para armazenar textos mais longos, como observações, instruções, endereços e opiniões sobre o processamento. Por padrão, usa o tipo text e uma caixa de entrada multilinha."
keywords: "texto multilinha,textarea,campo de texto,text,NocoBase"
---

# Texto multilinha

## Introdução

No NocoBase, **texto multilinha (Multi-line text)** é usado para armazenar conteúdos de texto que precisam de quebras de linha ou que sejam mais longos.

Por padrão, o texto multilinha usa uma caixa de entrada multilinha, sendo adequado para observações, instruções, opiniões sobre o processamento e outros conteúdos. Ele pode ser usado em filtros, permissões, condições de fluxo de trabalho e consultas de API.

Se o conteúdo normalmente tiver apenas uma linha, como um nome, número ou título, escolher [texto de linha única](./input.md) por padrão é mais adequado. Se o conteúdo precisar de formatação, imagens ou recursos de texto rico, escolha um campo de texto rico ou Markdown.

## Cenários aplicáveis

O texto multilinha é adequado para estes cenários de negócios:

- Observações de clientes, observações de pedidos e opiniões sobre o processamento de solicitações
- Endereços detalhados, descrições de problemas e especificações de necessidades
- Resumo de cláusulas contratuais e descrição do contexto do projeto
- Conteúdos de texto que precisam ser inseridos com quebras de linha

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Texto multilinha» para criar um campo de texto multilinha.

![20240512165017](https://static-docs.nocobase.com/20240512165017.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O texto multilinha corresponde a `textarea`, que determina como o campo será inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Observações do cliente», «Opinião sobre o processamento» ou «Endereço detalhado». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome de identificação do campo, usado para referências internas em APIs, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o texto multilinha é `text`, mas também pode ser mapeado como `string` ou `json` de acordo com o campo de origem. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. É possível limitar o comprimento mínimo, o comprimento máximo, o comprimento fixo, o uso de maiúsculas e minúsculas ou uma expressão regular. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de texto multilinha é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `textarea`. |
| Field type padrão | `text`. |
| Field type opcional | `text`, `json`, `string`. |
| Componente da página | No modo de edição, usa uma caixa de entrada multilinha. |
| Filtros | Oferece suporte a filtros de texto, como contém, não contém, está vazio, não está vazio etc. |
| Ordenação | Normalmente não é recomendado usá-lo para ordenação. A possibilidade de ordenar depende do banco de dados e do tipo de campo específicos. |
| Validação | Oferece suporte a validações como comprimento mínimo, comprimento máximo, comprimento fixo, uso de maiúsculas e minúsculas e expressão regular. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de texto multilinha. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome de exibição do campo na interface, sem alterar seu nome de identificação. |
| Field name | Não | O nome de identificação do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Os campos do banco de dados principal ou os campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Os campos do banco de dados principal ou os campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afetará a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de texto multilinha. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de texto multilinha criado no banco de dados principal, normalmente a coluna correspondente e os dados existentes nela também serão excluídos do banco de dados. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de texto multilinha é adequado para exibir conteúdos mais longos em formulários e detalhes.

![20260709224428](https://static-docs.nocobase.com/20260709224428.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir ou editar observações, instruções, opiniões sobre o processamento e outros conteúdos. |
| Bloco de detalhes | Exibir conteúdos de texto mais longos. |
| Bloco de tabela | Exibir um resumo; conteúdos mais longos normalmente serão truncados. |
| Fluxos de trabalho e permissões | Participar de decisões como campo de condição, por exemplo, verificar se uma observação está vazia. |

## Links relacionados

- [Campos](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Texto de linha única](./input.md) — Armazenar conteúdos de texto curtos de uma linha
- [Markdown](../media/markdown.md) — Armazenar conteúdos com formatação Markdown
- [Texto rico](../media/rich-text.md) — Armazenar conteúdos com formatação complexa