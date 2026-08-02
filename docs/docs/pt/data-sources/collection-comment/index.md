---
pkg: "@nocobase/plugin-comments"
title: "Tabela de comentários"
description: "A tabela de comentários armazena comentários, respostas e feedbacks de registros de negócio, oferecendo suporte a conteúdo rich text, rastreamento de usuários, comentários em vários níveis e blocos de comentários."
keywords: "tabela de comentários,funcionalidade de comentários,comentários rich text,comentários em vários níveis,Collection Comment,NocoBase"
---

# Tabela de comentários

## Introdução

A tabela de comentários é adequada para armazenar discussões, feedbacks e anotações relacionadas a registros de negócio. Por exemplo, comentários de tarefas, opiniões de aprovação, comentários de artigos e feedbacks de clientes podem ser armazenados na tabela de comentários.

A tabela de comentários geralmente não é usada isoladamente como tabela principal do negócio. A prática mais comum é: primeiro criar a tabela de comentários, depois configurar campos de relacionamento na tabela de negócio e, por fim, adicionar um bloco de comentários aos detalhes ou à janela modal do registro de negócio.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Cenários aplicáveis

A tabela de comentários é adequada para os seguintes cenários de negócio:

- Discussões colaborativas sobre tarefas, requisitos e bugs
- Opiniões sobre o processamento de solicitações de aprovação, chamados e contratos
- Comentários em artigos, bases de conhecimento e anúncios
- Feedback de clientes, acompanhamento de pós-venda e observações internas

## Fluxo de uso

A tabela de comentários geralmente é usada em conjunto com a tabela de negócio e o bloco de comentários:

1. Criar uma tabela de comentários para armazenar o conteúdo dos comentários, as relações de resposta, o criador, a data de criação e outras informações.
2. Criar um campo de relacionamento na tabela de negócio para associá-la à tabela de comentários. Por exemplo, associar a tabela «Tarefas» à tabela «Comentários de tarefas».
3. Adicionar um bloco de comentários à página de detalhes ou à janela modal da tabela de negócio.
4. Os usuários publicam comentários ou respostas no bloco de comentários. Os dados dos comentários são gravados na tabela de comentários e associados ao registro de negócio atual.
5. Configurar as permissões da tabela de comentários conforme as necessidades do negócio, controlando quem pode visualizar, criar ou excluir comentários.

## Configuração de criação

No banco de dados principal, clique em «Create collection» e selecione «Comment collection» para criar uma tabela de comentários.

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

| Configuração | Descrição |
| --- | --- |
| Collection display name | Nome exibido da tabela na interface, como «Comentários de tarefas», «Opiniões de aprovação» ou «Comentários de artigos». |
| Collection name | Nome identificador da tabela, usado para referências internas em API, campos de relacionamento, permissões, fluxos de trabalho e outros recursos. |
| Inherits | Selecione a tabela-pai a ser herdada. Visível apenas quando o banco de dados principal é PostgreSQL. |
| Categories | Categorias da tabela. As categorias afetam apenas a organização da interface de gerenciamento de tabelas, sem alterar sua estrutura. |
| Description | Descrição da tabela. Você pode informar a qual objeto de negócio essa tabela de comentários atende, quem a mantém e como as permissões de comentários são projetadas. |
| Preset fields | Campos predefinidos. Ao criar uma tabela de comentários, recomenda-se manter os campos do sistema e os campos integrados da tabela de comentários. |

### Campos integrados

Após a criação, a tabela de comentários geralmente contém os seguintes campos integrados. O bloco de comentários depende principalmente de `content`, `createdBy` e `createdAt` para exibir o conteúdo, o autor e o horário dos comentários.

| Campo | Nome do campo | Descrição |
| --- | --- | --- |
| ID | `id` | Campo de chave primária padrão, usado para identificar exclusivamente um registro de comentário. |
| Conteúdo do comentário | `content` | Armazena o texto do comentário inserido pelo usuário e usa o componente Markdown Vditor por padrão. |
| Data de criação | `createdAt` | Registra automaticamente a data de criação do comentário; o bloco de comentários a utiliza para exibir o horário do comentário. |
| Criador | `createdBy` | Registra automaticamente o usuário que publicou o comentário; o bloco de comentários o utiliza para exibir o autor. |
| Data de atualização | `updatedAt` | Registra automaticamente a data da última atualização do comentário. |
| Atualizado por | `updatedBy` | Registra automaticamente o usuário que atualizou o comentário pela última vez. |
| Espaço | `space` | Disponível após a ativação do [plugin de múltiplos espaços](../../multi-app/multi-space/index.md), usado para isolar dados por espaço. Não aparece quando o recurso de múltiplos espaços não está ativado. |

:::warning Observação

Os campos integrados da tabela de comentários geralmente são mantidos pelo bloco de comentários; não é recomendável excluí-los ou atribuir-lhes outros significados de negócio arbitrariamente. Se precisar armazenar categorias de comentários, status de processamento ou outras informações, você pode adicionar campos de negócio.

:::

### Campo de chave primária

Assim como as tabelas comuns, a tabela de comentários precisa de um campo de chave primária. O bloco de comentários localiza os registros de comentários e as relações de resposta por meio da chave primária.

Se a tabela de comentários não tiver uma chave primária, defina «Record unique key» ao editar a tabela de dados; caso contrário, o bloco de comentários poderá não conseguir visualizar, responder ou excluir comentários corretamente.

## Estabelecer relações
Criar um campo de relacionamento na tabela de negócio e associá-lo à tabela de comentários
![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

## Configuração e uso na página

A tabela de comentários geralmente é usada por meio do bloco de comentários. Você pode adicionar um bloco de comentários à página de detalhes, à janela modal ou à página de registros da tabela de negócio, permitindo que os usuários publiquem comentários sobre o registro atual.

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

| Local da configuração | Finalidade |
| --- | --- |
| [Bloco de detalhes](../../interface-builder/blocks/data-blocks/details.md) | Exibe a entrada de comentários nos detalhes do registro de negócio. |
| [Bloco de formulário](../../interface-builder/blocks/data-blocks/form.md) | Usa campos de relacionamento de comentários em conjunto com o fluxo de edição da tabela de negócio. |
| Bloco de comentários | Exibe a lista de comentários e permite publicar e responder a comentários. |

## Editar configuração

Na lista de tabelas de dados, clique em «Edit» à direita da tabela de comentários para modificar configurações como o nome exibido da tabela, as categorias, a descrição, o modo de paginação simples e «Record unique key».

Depois que a tabela de comentários entrar em produção, não é recomendável ajustar arbitrariamente o campo de conteúdo dos comentários e o campo de relacionamento de respostas. O bloco de comentários, as permissões, os fluxos de trabalho e as APIs podem depender desses campos.

## Excluir tabela de dados

Na lista de tabelas de dados, clique em «Delete» à direita da tabela de comentários para excluí-la.

A exclusão da tabela de comentários removerá os registros de comentários, as relações de resposta e os metadados relacionados da Collection. Antes de excluir, confirme se os campos de relacionamento da tabela de negócio, o bloco de comentários, as permissões, os fluxos de trabalho e as APIs ainda dependem dela.

:::danger Aviso

A exclusão da tabela de comentários fará com que os registros de negócio existentes percam seus dados de comentários. Os comentários geralmente registram processos colaborativos e opiniões de tratamento; antes de realizar a operação, confirme se é necessário fazer backup ou arquivá-los.

:::

## Links relacionados

- [Tabela comum](../data-source-main/general-collection.md) — Consulte as configurações gerais e as formas de uso dos blocos
- [Campos de relacionamento](../data-modeling/collection-fields/associations/index.md) — Saiba como associar a tabela de negócio à tabela de comentários
- [Plugin de comentários](../../plugins/@nocobase/plugin-comments/index.md) — Consulte o bloco de comentários e os recursos de comentários
- [Múltiplos espaços](../../multi-app/multi-space/index.md) — Saiba mais sobre o campo de espaço e o isolamento de dados por espaço