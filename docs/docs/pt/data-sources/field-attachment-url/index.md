---
title: "URL de anexo"
description: "O campo URL de anexo é usado para armazenar endereços de arquivos externos, sendo adequado para cenários em que o arquivo não é carregado."
keywords: "URL de anexo,attachment url,arquivo externo,URL,NocoBase"
---

# URL de anexo

## Introdução

No NocoBase, **URL de anexo (Attachment URL)** é usado para armazenar endereços de acesso a arquivos externos.

O campo URL de anexo é adequado para cenários em que os arquivos já estão armazenados em sistemas externos, armazenamento de objetos ou CDNs, e basta salvar o endereço de acesso no NocoBase.

Se precisar que o NocoBase faça o upload e gerencie os arquivos, selecione [Anexo](../file-manager/field-attachment.md). Se for apenas um endereço comum de página da web, selecione [URL](../data-modeling/collection-fields/basic/url.md).

## Cenários aplicáveis

O URL de anexo é adequado para estes cenários de negócio:

- Endereços de arquivos em armazenamento de objetos externo
- Endereços de imagens em CDN
- Endereços de documentos em sistemas de terceiros
- Links de arquivos após a migração de dados históricos

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «URL de anexo» para criar um campo URL de anexo.

![20241017092323](https://static-docs.nocobase.com/20241017092323.png)

![20241017092456](https://static-docs.nocobase.com/20241017092456.png)

![20241017092759](https://static-docs.nocobase.com/20241017092759.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O URL de anexo corresponde a `attachmentUrl`, que determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Endereço do arquivo», «URL da imagem» ou «Anexo externo». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O URL de anexo normalmente usa `string` ou `text` para armazenar o endereço. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. É possível configurar o formato da URL, o comprimento ou a obrigatoriedade. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo URL de anexo é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `attachmentUrl`. |
| Field type padrão | `string`. |
| Field type opcional | `string`, `text`, conforme a configuração real do campo. |
| Componente da página | No modo de edição, usa um componente de entrada de URL ou de endereço de anexo. |
| Filtragem | Oferece suporte a filtros de texto e à verificação de valores vazios. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte à validação do formato da URL, do comprimento, da obrigatoriedade etc. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo URL de anexo. A edição do campo serve principalmente para ajustar a forma como ele é exibido e usado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo URL de anexo. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo URL de anexo criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão do campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por configurações de negócio.

:::

## Uso na configuração de páginas

O campo URL de anexo é adequado para exibir e acessar arquivos externos.
![20260709231803](https://static-docs.nocobase.com/20260709231803.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir o endereço de um arquivo externo. |
| Bloco de detalhes | Exibir o link do arquivo. |
| Bloco de tabela | Exibir o link ou uma entrada de miniatura. |
| Fluxo de trabalho | Inserir o endereço do arquivo em notificações ou solicitações externas. |

## Links relacionados

- [Campo](../index.md) — Conheça a função, as categorias e a lógica de mapeamento dos campos
- [Tabela comum](../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Anexo](../file-manager/field-attachment.md) — Faça upload e associe arquivos do NocoBase
- [URL](../data-modeling/collection-fields/basic/url.md) — Armazene links comuns