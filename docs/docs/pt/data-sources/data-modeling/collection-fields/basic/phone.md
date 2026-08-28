---
title: "Número de telefone"
description: "O campo de número de telefone é usado para armazenar números de celular, telefones de contato e outros textos relacionados a telefones, além de oferecer validação de formato."
keywords: "número de telefone,phone,telefone,informações de contato,NocoBase"
---

# Número de telefone

## Introdução

No NocoBase, **Número de telefone (Phone)** é usado para armazenar números de celular ou telefones de contato.

O campo de número de telefone é adequado para telefones de clientes, contatos e números de celular de funcionários. Ele é mais apropriado do que um texto comum para representar dados relacionados a telefones.

Se precisar armazenar vários telefones ou informações de contato complexas, use [texto multilinha](./textarea.md) ou crie uma tabela de contatos separada.

## Cenários de uso

O campo de número de telefone é adequado para estes cenários de negócio:

- Número de celular de clientes e telefone de contatos
- Número de celular de funcionários e telefone alternativo
- Telefone de contato de lojas e linhas de atendimento
- Números para notificações por SMS

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Número de telefone» para criar um campo desse tipo.

![20240512175526](https://static-docs.nocobase.com/20240512175526.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para números de telefone, corresponde a `phone` e determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido para o campo na interface, como «Número de telefone», «Telefone de contato» ou «Linha de atendimento». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado em referências internas como API, campos de relação, permissões e fluxos de trabalho. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de número de telefone é `string`. |
| Default value | Valor padrão. Ao adicionar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. É possível configurar comprimento, expressão regular ou obrigatoriedade. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, requisitos de preenchimento, origem dos dados ou responsável pela manutenção. |

:::warning Atenção

Depois de criado, o nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de reconfiguração posteriores.

:::

## Características do campo

O comportamento padrão do campo de número de telefone é o seguinte:

| Característica | Descrição |
| --- | --- |
| Interface Field padrão | `phone`. |
| Tipo Field padrão | `string`. |
| Tipo Field opcional | `string`. |
| Componente da página | No modo de edição, usa um campo de entrada e permite configurar a validação do formato do telefone. |
| Filtragem | Oferece filtros de texto, como contém, é igual a, está vazio e não está vazio. |
| Ordenação | Permite ordenar em blocos de tabela. |
| Validação | Oferece validações de comprimento, expressão regular, obrigatoriedade e outras. |

## Configuração de edição

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de número de telefone. A edição é usada principalmente para ajustar como o campo é exibido e utilizado no NocoBase, por exemplo, para alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em um mapeamento de campo — mapeando o campo do banco de dados para um Field type e uma Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, confirme se os dados existentes poderão ser utilizados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Trocar o Field type ou a Field interface não equivale simplesmente a alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de número de telefone. No banco de dados principal, também é possível selecionar vários campos e excluí-los em massa.

Ao excluir um campo de número de telefone criado no banco de dados principal, normalmente a coluna correspondente e os dados já existentes nessa coluna também serão excluídos do banco de dados. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de número de telefone é adequado para uso em formulários, detalhes, filtros e notificações.
![20260709224555](https://static-docs.nocobase.com/20260709224555.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir número de celular ou telefone de contato. |
| Bloco de detalhes | Exibir informações de contato. |
| Bloco de filtragem | Filtrar registros por número de celular ou trecho do número. |
| Fluxos de trabalho e notificações | Servir como origem dos números para notificações por SMS e telefone. |

## Links relacionados

- [Campos](../index.md) — Saiba mais sobre a função, as categorias e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Texto de linha única](./input.md) — Armazene textos curtos comuns
- [E-mail](./email.md) — Armazene endereços de e-mail