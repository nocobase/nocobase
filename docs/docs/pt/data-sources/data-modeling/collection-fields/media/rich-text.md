---
title: "Texto rico"
description: "O campo de texto rico é usado para armazenar conteúdo formatado com estilos, imagens, links e outros formatos."
keywords: "texto rico,rich text,campo de conteúdo,NocoBase"
---

# Texto rico

## Introdução

No NocoBase, o **texto rico (Rich text)** é usado para armazenar conteúdo formatado.

O campo de texto rico é adequado para o corpo de avisos, artigos, modelos de e-mail, documentos de instruções e outros conteúdos. Ele oferece uma experiência mais próxima da edição WYSIWYG.

Se a equipe estiver acostumada com Markdown ou precisar de um formato de texto simples e controlável, escolha [Markdown](./markdown.md) ou [Markdown Vditor](../../../field-markdown-vditor/index.md).

## Cenários de uso

O texto rico é adequado para os seguintes cenários de negócio:

- Corpo de avisos e artigos
- Modelos de e-mail e de notificações
- Instruções de produtos e operações
- Conteúdo que precisa de imagens, links e estilos

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Texto rico» para criar um campo de texto rico.

![20240512181002](https://static-docs.nocobase.com/20240512181002.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para texto rico, corresponde a `richText` e determina como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Corpo do aviso», «Modelo de e-mail» ou «Instruções do produto». Recomenda-se usar um nome que os usuários de negócio possam compreender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Os campos de texto rico normalmente usam `text` para armazenar o conteúdo. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. Podem limitar o comprimento ou exigir o preenchimento. |
| Description | Descrição do campo. É adequado informar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de texto rico é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `richText`. |
| Field type padrão | `text`. |
| Field type opcional | `text`. |
| Componente da página | O modo de edição usa um editor de texto rico. |
| Filtragem | Oferece suporte a filtros de texto, como contém, está vazio e não está vazio. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte a validações de texto, como comprimento e preenchimento obrigatório. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de texto rico. A edição do campo serve principalmente para ajustar a forma como ele é exibido e usado no NocoBase, como alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão dos novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de texto rico. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de texto rico criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de texto rico é adequado para cenários de edição e exibição de conteúdo.
![20260709231418](https://static-docs.nocobase.com/20260709231418.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Editar conteúdo de texto rico. |
| Bloco de detalhes | Exibir o conteúdo no formato de texto rico. |
| Modelo de e-mail ou notificação | Servir como fonte do corpo do modelo. |
| Bloco de tabela | Exibir um resumo ou conteúdo simplificado. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, as categorias e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Markdown](./markdown.md) — Armazenar conteúdo em Markdown
- [Markdown Vditor](../../../field-markdown-vditor/index.md) — Usar o Vditor para editar Markdown