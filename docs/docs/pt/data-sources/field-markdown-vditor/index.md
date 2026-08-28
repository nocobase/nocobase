---
title: "Markdown Vditor"
description: "O campo Markdown Vditor é usado para salvar conteúdo Markdown por meio do editor Vditor."
keywords: "Markdown Vditor,Vditor,markdown,NocoBase"
---

# Markdown Vditor

## Introdução

No NocoBase, o **Markdown Vditor (Markdown Vditor)** é usado para editar conteúdo Markdown com o editor Vditor.

O Markdown Vditor é adequado para conteúdos que exigem uma experiência de edição Markdown mais completa, como o corpo de comentários, o conteúdo principal de uma base de conhecimento e descrições de soluções.

Se você precisa apenas de uma edição Markdown simples, pode escolher [Markdown](../data-modeling/collection-fields/media/markdown.md). Se precisa de uma experiência de edição visual de rich text, escolha [Rich text](../data-modeling/collection-fields/media/rich-text.md).

## Cenários aplicáveis

O Markdown Vditor é adequado para os seguintes cenários de negócio:

- Conteúdo de comentários e discussões
- Conteúdo principal de bases de conhecimento e descrições de soluções
- Textos longos com formatação Markdown
- Conteúdos que exigem recursos de visualização e edição

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Markdown Vditor» para criar um campo Markdown Vditor.

![20240512180647](https://static-docs.nocobase.com/20240512180647.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Markdown Vditor corresponde a `vditor` e determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Conteúdo do comentário», «Conteúdo principal da base de conhecimento» ou «Descrição da solução». Recomenda-se usar um nome que os profissionais de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Os campos Markdown Vditor normalmente usam `text` para salvar o conteúdo. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Podem limitar o comprimento ou exigir o preenchimento. |
| Description | Descrição do campo. É adequado registrar o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes da criação para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo Markdown Vditor é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `vditor`. |
| Field type padrão | `text`. |
| Field type opcional | `text`. |
| Componente da página | No modo de edição, é usado o editor MarkdownVditor. |
| Filtro | Oferece suporte a filtros de texto, como contém, está vazio e não está vazio. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte a validações de texto, como comprimento e preenchimento obrigatório. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Markdown Vditor. A edição do campo serve principalmente para ajustar a forma como ele é exibido e usado no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Isso afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes poderão ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo Markdown Vditor. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Markdown Vditor criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importação e exportação, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo Markdown Vditor é adequado para conteúdos principais e comentários que exigem uma experiência de edição.
![20260709230930](https://static-docs.nocobase.com/20260709230930.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Usar o Vditor para editar conteúdo Markdown. |
| Bloco de detalhes | Renderizar e exibir conteúdo Markdown. |
| Bloco de comentários | Salvar o conteúdo como corpo do comentário. |
| Fluxo de trabalho | Usar o conteúdo principal para gerar notificações ou documentos. |

## Links relacionados

- [Campo](../index.md) — Saiba mais sobre a função, as categorias e a lógica de mapeamento dos campos
- [Tabela comum](../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Markdown](../data-modeling/collection-fields/media/markdown.md) — Salvar conteúdo Markdown
- [Rich text](../data-modeling/collection-fields/media/rich-text.md) — Salvar conteúdo rich text
