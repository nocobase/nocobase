---
title: "URL"
description: "O campo URL é usado para armazenar endereços de páginas da web, links para sistemas externos, links para documentos e outras informações de endereço."
keywords: "URL,link,endereço da web,url,NocoBase"
---

# URL

## Introdução

No NocoBase, **URL (URL)** é usado para armazenar endereços de sites ou links.

O campo URL é adequado para endereços de sistemas externos, links para documentos, endereços de sites oficiais, endereços de callback e outros conteúdos. Em comparação com o texto comum, ele expressa de forma mais clara a semântica de link.

Se quiser fazer upload de arquivos, selecione [Anexo](../media/field-attachment.md). Se for apenas um texto descritivo comum, selecione [Texto de linha única](./input.md) ou [Texto de várias linhas](./textarea.md).

## Cenários de aplicação

O URL é adequado para estes cenários de negócios:

- Site oficial de clientes e fornecedores
- Links para páginas de detalhes de sistemas externos
- Links para documentos de contratos e páginas da base de conhecimento
- Endereços de Webhook e endereços de callback

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «URL» para criar um campo URL.

![20240512175641](https://static-docs.nocobase.com/20240512175641.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. URL corresponde a `url` e determina como o valor é inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Site oficial», «Link do documento» ou «Endereço externo». Recomenda-se usar um nome que os profissionais de negócios possam entender diretamente. |
| Field name | Nome de identificação do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo URL é `string`. |
| Default value | Valor padrão. Ao adicionar um registro, esse valor pode ser preenchido automaticamente se o usuário não informar nenhum. |
| Validation rules | Regras de validação. É possível configurar o formato, o comprimento e a obrigatoriedade do URL. |
| Description | Descrição do campo. É adequada para informar o significado, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme o nome antes de criar o campo para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo URL é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `url`. |
| Field type padrão | `string`. |
| Field type opcional | `string`. |
| Componente da página | No modo de edição, usa um campo de entrada; no modo de leitura, geralmente é exibido como um link. |
| Filtro | Oferece suporte a filtros de texto, como contém, igual a, vazio e não vazio. |
| Ordenação | Oferece suporte à ordenação em blocos de tabela. |
| Validação | Oferece suporte à validação do formato, comprimento e obrigatoriedade do URL, entre outras. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo URL. A edição do campo serve principalmente para ajustar a forma como ele é exibido e usado no NocoBase, por exemplo, alterando o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer o mapeamento do campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome de identificação. |
| Field name | Não | O nome de identificação do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Trocar o Field type ou o Field interface não equivale simplesmente a alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo URL. No banco de dados principal, também é possível selecionar vários campos e excluí-los em massa.

Ao excluir um campo URL criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo URL é adequado para uso em detalhes, tabelas e cenários de redirecionamento externo.
![20260709224747](https://static-docs.nocobase.com/20260709224747.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir um endereço de link. |
| Bloco de detalhes | Exibir e abrir o link. |
| Bloco de tabela | Exibir um resumo do link ou um link clicável. |
| Fluxo de trabalho | Usar o link como conteúdo de notificação ou parâmetro de uma solicitação externa. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em tabelas comuns
- [Texto de linha única](./input.md) — Armazene textos curtos comuns
- [Anexo](../media/field-attachment.md) — Faça upload e associe arquivos
