---
title: "Markdown"
description: "O campo Markdown é usado para armazenar textos com sintaxe Markdown."
keywords: "Markdown,markdown,campo de conteúdo,NocoBase"
---

# Markdown

## Introdução

No NocoBase, **Markdown (Markdown)** é usado para armazenar conteúdo no formato Markdown.

O campo Markdown é adequado para documentos de instruções, planos de tratamento, conteúdo principal de bases de conhecimento, registros de alterações e outros conteúdos. Ele armazena texto, que é renderizado como Markdown quando exibido na página.

Se você precisar de uma experiência de edição WYSIWYG, poderá escolher [Rich text](./rich-text.md) ou [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Cenários de uso

O Markdown é adequado para estes cenários de negócio:

- Conteúdo principal de bases de conhecimento e documentos de instruções
- Planos de tratamento e registros de solução de problemas
- Notas de versão e registros de alterações
- Conteúdo de texto longo que requer formatação leve

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Markdown» para criar um campo Markdown.

![20240512181311](https://static-docs.nocobase.com/20240512181311.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Markdown corresponde a `markdown` e determina como o campo é preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Documento de instruções», «Plano de tratamento» ou «Conteúdo principal». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas para API, campos de relacionamento, permissões, fluxos de trabalho e outros. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Os campos Markdown normalmente usam `text` para armazenar o conteúdo. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. Permitem limitar o comprimento ou exigir o preenchimento. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme o nome antes da criação para evitar custos de ajuste de configuração causados por alterações posteriores.

:::

## Características do campo

O comportamento padrão do campo Markdown é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `markdown`. |
| Field type padrão | `text`. |
| Field type opcional | `text` e `string`, conforme a configuração real do campo. |
| Componente da página | O modo de edição usa o componente de edição Markdown. |
| Filtros | Suporta filtros de texto, como contém, está vazio e não está vazio. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Suporta validações de texto, como comprimento e preenchimento obrigatório. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Markdown. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao criar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou o Field interface não equivale a simplesmente mudar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo Markdown. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Markdown criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo Markdown é adequado para edição de conteúdo e exibição detalhada.
![20260709230801](https://static-docs.nocobase.com/20260709230801.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Editar conteúdo Markdown. |
| Bloco de detalhes | Exibir o conteúdo renderizado como Markdown. |
| Bloco de tabela | Exibir conteúdo resumido. |
| Fluxo de trabalho | Usar o conteúdo principal como conteúdo para gerar notificações ou documentos. |

## Links relacionados

- [Campo](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Usar o Vditor para editar Markdown
- [Rich text](./rich-text.md) — Usar o editor de rich text para editar conteúdo
- [Texto multilinha](../basic/textarea.md) — Armazenar conteúdo de texto longo sem formatação
