---
title: "E-mail"
description: "O campo de e-mail é usado para armazenar endereços de e-mail e fornece validação do formato do e-mail."
keywords: "e-mail,email,informações de contato,NocoBase"
---

# E-mail

## Introdução

No NocoBase, **e-mail (Email)** é usado para armazenar endereços de e-mail.

O campo de e-mail é adequado para e-mails de clientes, funcionários, fornecedores e outros contatos. Em comparação com o texto de linha única comum, ele oferece uma semântica de e-mail mais clara e validação de formato.

Se o conteúdo não for um endereço de e-mail, mas apenas informações de contato comuns, é mais adequado escolher [texto de linha única](./input.md).

## Cenários de uso

O e-mail é adequado para os seguintes cenários de negócio:

- E-mail de clientes e contatos
- E-mail de funcionários e e-mail de contato para login
- E-mail de fornecedores e e-mail de serviço
- Endereço para recebimento de notificações

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «E-mail» para criar um campo de e-mail.

![20240512175609](https://static-docs.nocobase.com/20240512175609.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para e-mail, corresponde a `email`, determinando como o campo será preenchido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «E-mail do cliente», «E-mail do contato» ou «E-mail do destinatário». Recomenda-se usar um nome que os usuários de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado em referências internas para API, campos de relacionamento, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de e-mail é `string`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Normalmente, é necessário ativar a validação do formato de e-mail; também é possível configurar o preenchimento obrigatório. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme o nome antes da criação para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de e-mail é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `email`. |
| Field type padrão | `string`. |
| Field type opcional | `string`. |
| Componente da página | No modo de edição, utiliza um campo de entrada e valida o formato do e-mail. |
| Filtro | Oferece filtros de texto, como contém, é igual a, está vazio e não está vazio. |
| Ordenação | Permite ordenar em blocos de tabela. |
| Validação | Oferece validações como formato de e-mail e preenchimento obrigatório. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar sua configuração. A edição do campo serve principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como modificar o nome de exibição, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada do banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode editar | Descrição |
| --- | --- | --- |
| Field display name | Sim | Modifica o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | O nome identificador do campo normalmente não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao adicionar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome de exibição. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de e-mail. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de e-mail criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de e-mail é adequado para uso em formulários, detalhes e fluxos de notificação.
![20260709224700](https://static-docs.nocobase.com/20260709224700.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir endereços de e-mail. |
| Bloco de detalhes | Exibir endereços de e-mail. |
| Bloco de filtro | Filtrar registros por endereço de e-mail. |
| Fluxos de trabalho e notificações | Servir como origem dos destinatários de notificações por e-mail. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Criar e gerenciar campos em uma tabela comum
- [Texto de linha única](./input.md) — Armazenar textos curtos comuns
- [Número de telefone](./phone.md) — Armazenar números de telefone de contato