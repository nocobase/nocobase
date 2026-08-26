---
title: "Modelagem de Dados"
description: "O Skill de Modelagem de Dados serve para criar e gerenciar tabelas do NocoBase em linguagem natural — incluindo criação de tabelas, adição de campos e definição de relacionamentos."
keywords: "Construtor de IA,modelagem de dados,tabelas,campos,relacionamentos,coleções"
---

# Modelagem de Dados

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

## Introdução

O Skill de Modelagem de Dados serve para criar e gerenciar tabelas do NocoBase em linguagem natural — criação de tabelas, adição de campos, definição de relacionamentos e mais.

Antes de usar, certifique-se de que a fonte de dados de destino está configurada em "Gerenciamento de Fontes de Dados".


## Capacidades

- Criar, modificar e excluir tabelas, com suporte a tabelas comuns, em árvore, de arquivos, de calendário, SQL, view e herança.
- Adicionar, modificar e excluir campos, incluindo todos os tipos de campo nativos do NocoBase (incluindo campos de relação) e os tipos de campo estendidos por plugins.

## Exemplos de prompt

### Cenário A: Criar uma tabela

```
Por favor, crie uma tabela de arquivos para gerenciar contratos.
```

O Skill orienta a IA a analisar quais campos a tabela precisa e quais tipos correspondentes no NocoBase, e então cria a tabela do tipo arquivo no sistema com os campos correspondentes.

![Criação de tabela](https://static-docs.nocobase.com/202604162103369.png)

### Cenário B: Adicionar um campo

```
Adicione na tabela de usuários um campo de status que indique se o usuário está ativo, com três valores: ativo, em saída e desligado.
```

O Skill orienta a IA a obter os metadados da tabela de usuários e analisar que o tipo de campo correspondente no NocoBase é "Lista suspensa (seleção única)", e então adiciona o campo na tabela de usuários e configura os valores do enum.

![Adicionar campo](https://static-docs.nocobase.com/202604162112692.png)

### Cenário C: Inicializar o modelo de dados

```
Estou montando um CRM. Por favor, projete e construa o modelo de dados.
```

O Skill cria as tabelas, adiciona os campos e configura os relacionamentos no sistema com base no modelo de dados projetado pela IA.

![Inicializar modelo de dados](https://static-docs.nocobase.com/202604162126729.png)

![Resultado da inicialização do modelo de dados](https://static-docs.nocobase.com/202604162201867.png)

### Cenário D: Adicionar um módulo funcional

```
Quero adicionar ao sistema CRM atual o modelo de dados de gerenciamento de pedidos do usuário.
```

O Skill orienta a IA a obter o modelo de dados atual do sistema e, com base nele, conclui a modelagem dos novos recursos. Em seguida, cria automaticamente as tabelas, adiciona os campos e configura os relacionamentos.

![Adicionar módulo funcional](https://static-docs.nocobase.com/202604162203006.png)

![Resultado da adição do módulo funcional](https://static-docs.nocobase.com/202604162203893.png)

## Perguntas frequentes

**Os campos de sistema são criados automaticamente ao criar uma tabela?**

Sim. Os campos `id`, `createdAt`, `createdBy`, `updatedAt` e `updatedBy` são gerados automaticamente pelo servidor e não precisam ser informados manualmente.

**O que fazer quando um relacionamento é criado errado?**

Recomendamos primeiro verificar a chave estrangeira e o campo reverso do relacionamento atual antes de decidir se modifica ou remove e recria. Após a alteração, o Skill faz uma releitura para validar o estado nos dois lados.

**Como criar uma tabela baseada num tipo de tabela estendido por plugin?**

Nesse caso, o plugin correspondente precisa estar habilitado. Se não estiver, a IA normalmente tenta habilitá-lo. Se a IA não conseguir, habilite o plugin manualmente.

**Como adicionar campos baseados em tipos de campo estendidos por plugins?**

O mesmo se aplica.

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [Configuração de Interface](./ui-builder) — Após criar tabelas, monte páginas e blocos com IA
- [Soluções](./dsl-reconciler) — Construa sistemas de negócio completos em lote a partir de YAML
