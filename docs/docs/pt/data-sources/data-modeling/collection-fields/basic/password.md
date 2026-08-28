---
title: "Senha"
description: "O campo de senha é usado para armazenar entradas de senha e outros conteúdos semelhantes, exibidos como máscara durante o preenchimento na página."
keywords: "senha,password,entrada sensível,NocoBase"
---

# Senha

## Introdução

No NocoBase, **senha (Password)** é usada para inserir conteúdos relacionados a senhas.

O campo de senha é adequado para armazenar conteúdos cujo processo de entrada precisa ser ocultado, como senhas de serviços externos e códigos de acesso temporários. Seu foco está na forma de entrada e exibição, não equivalendo a uma solução completa de gerenciamento de chaves.

Para armazenar chaves altamente sensíveis ou credenciais de longo prazo, avalie primeiro soluções específicas de criptografia, gerenciamento de chaves ou variáveis de ambiente.

## Cenários aplicáveis

A senha é adequada para estes cenários de negócio:

- Senhas temporárias de sistemas externos
- Códigos de acesso em configurações de conexão
- Textos sensíveis que precisam apenas de entrada mascarada
- Códigos de verificação ou senhas temporárias em processos internos

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Senha» para criar um campo de senha.

![20240512175917](https://static-docs.nocobase.com/20240512175917.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A senha corresponde a `password` e determina como o campo será inserido e exibido na página. |
| Field display name | Nome exibido do campo na interface, como «Senha de acesso», «Senha de conexão» ou «Senha temporária». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não pode ser alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Os campos de senha normalmente usam `password` ou `string`. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. É possível configurar comprimento, expressão regular ou obrigatoriedade. |
| Description | Descrição do campo. É adequada para informar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs após a criação. Confirme a nomenclatura antes de criar o campo para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de senha é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `password`. |
| Field type padrão | `password`. |
| Field type opcional | `password`, `string`. |
| Componente da página | No modo de edição, usa um campo de entrada de senha. |
| Filtro | Normalmente, não é recomendado usá-lo como condição de filtro. |
| Ordenação | Normalmente, não é recomendado usá-lo para ordenação. |
| Validação | Oferece suporte a validações de comprimento, expressão regular, obrigatoriedade e outras. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de senha. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão ao criar novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de senha. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de senha criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados existentes nela também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de senha é adequado para inserir textos sensíveis em formulários de configuração.
![20260709225244](https://static-docs.nocobase.com/20260709225244.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Insere a senha usando um campo de entrada de senha. |
| Bloco de detalhes | Exibe o conteúdo de forma mascarada ou restrita. |
| Permissões | Restringe quem pode visualizar ou editar o campo de senha. |
| Fluxo de trabalho | Deve ser usado com cautela como parâmetro de solicitações externas. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Texto de linha única](./input.md) — Armazene textos curtos comuns