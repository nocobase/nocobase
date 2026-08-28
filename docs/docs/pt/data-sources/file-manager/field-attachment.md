---
title: "Anexo"
description: "O campo de anexo é usado para fazer upload e associar arquivos, enquanto os metadados dos arquivos são armazenados na tabela de arquivos."
keywords: "Anexo,attachment,upload de arquivos,tabela de arquivos,NocoBase"
---

# Anexo (obsoleto)

## Introdução

:::warning Atenção

O campo de anexo foi descontinuado. Recomenda-se usar o campo [tabela de arquivos](./file-collection.md) ou [URL de anexo](../field-attachment-url/index.md).

:::

No NocoBase, **Anexo (Attachment)** é usado para fazer upload de arquivos e associar os registros de arquivos ao registro de negócio atual.

O campo de anexo geralmente é associado a uma tabela de arquivos. O arquivo em si é armazenado pelo mecanismo de armazenamento de arquivos, enquanto metadados como nome, tamanho, URL e tipo MIME são armazenados na tabela de arquivos.

Se você precisa apenas salvar o link de um arquivo externo, escolha [URL de anexo](../field-attachment-url/index.md) ou [URL](../data-modeling/collection-fields/basic/url.md).

## Cenários aplicáveis

O anexo é adequado para estes cenários de negócio:

- Anexos de contratos, arquivos de faturas e comprovantes de reembolso
- Imagens de produtos, documentos de identificação de funcionários e documentos de projetos
- Capturas de tela de chamados e anexos de problemas
- Múltiplos arquivos associados a registros de negócio

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Anexo» para criar um campo de anexo.

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para anexos, corresponde a `attachment` e determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Anexo do contrato», «Arquivo da fatura» ou «Imagem do produto». Recomenda-se usar um nome que seja facilmente compreendido pelos usuários da área de negócio. |
| Field name | Nome identificador do campo, usado em referências internas por API, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O campo de anexo geralmente é um campo de relacionamento associado aos registros de arquivos na tabela de arquivos. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. É possível definir se o campo é obrigatório; a quantidade, o tamanho e o tipo dos arquivos geralmente são controlados pelo componente de upload ou pela configuração do armazenamento de arquivos. |
| Description | Descrição do campo. É adequado informar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de anexo é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `attachment`. |
| Field type padrão | `belongsToMany`. |
| Field type opcional | `belongsToMany` e outros tipos de relacionamento, conforme a configuração do campo de arquivo. |
| Componente da página | No modo de edição, é usado o componente de upload de anexos. |
| Filtro | Normalmente, filtra por estar vazio ou por possuir arquivos associados. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece validações básicas, como obrigatoriedade; as restrições de upload dependem da configuração do componente. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de anexo. A edição do campo é usada principalmente para ajustar como ele será exibido e utilizado no NocoBase, por exemplo, para alterar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada do banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Pode ser ajustado durante o mapeamento de campos do banco de dados principal ou de campos sincronizados. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Pode ser ajustado durante o mapeamento de campos do banco de dados principal ou de campos sincronizados. Antes do ajuste, é necessário confirmar se os dados existentes poderão ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de anexo. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de anexo criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Configuração e uso nas páginas

O campo de anexo é adequado para uso em formulários, detalhes e cenários de gerenciamento de arquivos.
![20260709231642](https://static-docs.nocobase.com/20260709231642.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Fazer upload de um ou mais arquivos. |
| Bloco de detalhes | Visualizar, pré-visualizar ou baixar anexos. |
| Bloco de tabela | Exibir a quantidade de anexos ou uma entrada para os anexos. |
| Fluxo de trabalho | Usar anexos como arquivos relacionados a aprovações, notificações ou exportações. |

## Links relacionados

- [Campos](../index.md) — conhecer a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../data-source-main/general-collection.md) — criar e gerenciar campos em uma tabela comum
- [Tabela de arquivos](./file-collection.md) — conhecer como os metadados dos arquivos são armazenados
- [URL de anexo](../field-attachment-url/index.md) — salvar o endereço de um arquivo externo
- [URL](../data-modeling/collection-fields/basic/url.md) — salvar um link comum
