---
title: "JSON"
description: "O campo JSON é usado para armazenar objetos estruturados, arrays, trechos de respostas de APIs e outros dados semiestruturados."
keywords: "JSON,json,dados estruturados,NocoBase"
---

# JSON

## Introdução

No NocoBase, **JSON (JSON)** é usado para armazenar dados estruturados ou semiestruturados.

Os campos JSON são adequados para armazenar trechos de respostas de APIs externas, configurações de extensão, propriedades dinâmicas e outros dados cuja estrutura não é fixa. Eles são flexíveis, mas menos fáceis de filtrar, validar e exibir do que os campos comuns.

Se a estrutura do campo for estável, prefira dividi-la em campos específicos, facilitando a configuração de páginas, as permissões, os filtros e o uso em fluxos de trabalho.

## Cenários de uso

O JSON é adequado para estes cenários de negócio:

- Respostas brutas de APIs externas
- Propriedades de extensão dinâmicas
- Objetos de configuração complexos
- Armazenamento temporário de dados que não podem ser divididos em uma estrutura organizada

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «JSON» para criar um campo JSON.

![20240512173905](https://static-docs.nocobase.com/20240512173905.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. JSON corresponde a `json` e determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Informações adicionais», «Resposta da API» ou «Configuração». Recomenda-se usar um nome que os usuários de negócio possam compreender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas por APIs, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Os campos JSON normalmente usam `json` ou `jsonb`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Normalmente verificam se o JSON é válido ou se o campo é obrigatório. |
| Description | Descrição do campo. É adequado informar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajustes posteriores na configuração.

:::

## Características do campo

O comportamento padrão dos campos JSON é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `json`. |
| Field type padrão | `json`. |
| Field type opcional | `json` e `jsonb`, conforme os recursos do banco de dados. |
| Componente da página | No modo de edição, usa um componente de edição JSON ou um componente de entrada de texto. |
| Filtros | A capacidade de filtragem depende do banco de dados e do mapeamento do campo; normalmente, o campo não é usado como principal campo de filtro. |
| Ordenação | Normalmente, não é usado para ordenação. |
| Validação | Oferece suporte à validação de JSON válido, campos obrigatórios etc. |

## Configuração de edição

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo JSON. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Isso afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, confirme se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão de campos

Clique em «Delete» à direita do campo para excluir o campo JSON. No banco de dados principal, também é possível selecionar vários campos e excluí-los em massa.

Ao excluir um campo JSON criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

Os campos JSON são adequados para cenários de integração e configurações de extensão.
![20260710151854](https://static-docs.nocobase.com/20260710151854.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir ou editar dados JSON. |
| Bloco de detalhes | Exibir conteúdo estruturado. |
| Fluxo de trabalho | Armazenar ou ler trechos retornados por APIs externas. |
| API | Transmitir ou retornar como um objeto de extensão. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Texto multilinha](../basic/textarea.md) — Armazenar textos longos sem formatação
- [Fórmula](../../../field-formula/index.md) — Calcular resultados com base em campos
