---
title: "Configuração de Interface"
description: "O Skill de Configuração de Interface serve para criar e editar páginas, blocos, campos e configurações de ações no NocoBase."
keywords: "Construtor de IA,configuração de interface,páginas,blocos,popups,interações,UI Builder"
---

# Configuração de Interface

:::tip Pré-requisitos

Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.

:::

## Introdução

O Skill de Configuração de Interface serve para criar e editar páginas, blocos, campos e configurações de ações no NocoBase — você descreve em linguagem de negócio o tipo de página que quer e ele cuida da geração do blueprint, do layout dos blocos e das interações.


## Capacidades

Pode fazer:

- Criar páginas completas: tabela, formulário de filtro e popup de detalhes em uma só tacada.
- Editar páginas existentes: adicionar blocos, ajustar campos, configurar popups, ajustar layout.
- Definir interações: valores padrão, exibir/ocultar campos, cálculos vinculados, estado dos botões de ação.
- Reutilizar templates: popups e blocos repetidos podem ser salvos como templates.
- Suportar tarefas com várias páginas: construir página por página em sequência.

Não pode fazer:

- Não configura permissões ACL (use o [Skill de Configuração de Permissões](./acl)).
- Não desenha estruturas de tabelas (use o [Skill de Modelagem de Dados](./data-modeling)).
- Não orquestra workflows (use o [Skill de Gerenciamento de Workflow](./workflow)).
- Não trata navegação de páginas não modernas (v1) — só dá suporte a páginas v2.

## Exemplos de prompt

### Cenário A: Criar uma página de gerenciamento

```
Crie uma página de gerenciamento de clientes com uma caixa de pesquisa por nome e uma tabela de clientes mostrando nome, telefone, e-mail e data de criação.
```

O Skill primeiro lê os campos da tabela, gera o blueprint da página e o aplica.

![Criação de página de gerenciamento](https://static-docs.nocobase.com/20260420100608.png)


### Cenário B: Configurar um popup

```
Ao clicar no nome do cliente na tabela, abra um popup de detalhes mostrando todos os campos.
```

A preferência é usar o popup do campo (clicar e abrir), em vez de adicionar um botão de ação extra.

![Configuração de popup](https://static-docs.nocobase.com/20260420100641.png)

### Cenário C: Definir regras de interação

```
No formulário de edição do popup /admin/c0vc2vmkfll/view/cec3e7a69ac/filterbytk/1, adicione uma regra de campo:
quando o id do usuário for 1, impeça a edição de username.
```

A configuração é feita pelas regras de interação e não é necessário escrever configuração à mão.

![Configuração de regra de interação](https://static-docs.nocobase.com/20260420100709.png)

### Cenário D: Construção com várias páginas

```
Monte um sistema de gerenciamento de usuários com duas páginas: gerenciamento de usuários e gerenciamento de papéis, ambas dentro de um mesmo grupo de páginas.
```

Apresenta um design simples para várias páginas. Após ajuste e confirmação humana, a construção é executada.

![Construção com várias páginas](https://static-docs.nocobase.com/20260420100731.png)

## Perguntas frequentes

**O que fazer quando a página é criada, mas os blocos não mostram dados?**

Confirme primeiro se a tabela correspondente realmente tem registros. Verifique também se a coleção e a fonte de dados vinculadas ao bloco estão corretas. Você também pode usar o [Skill de Modelagem de Dados](./data-modeling) para criar dados de teste.

**Como colocar vários blocos dentro de um popup?**

Você pode descrever o conteúdo do popup no prompt, por exemplo: "no popup de edição, coloque um formulário e uma tabela relacionada". O Skill gera um layout de popup customizado contendo vários blocos.

**A configuração manual e a configuração via IA podem se atrapalhar?**

Se a configuração manual e a por IA acontecerem ao mesmo tempo, podem se atrapalhar. Se não forem feitas simultaneamente, não há interferência.

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [Modelagem de Dados](./data-modeling) — Crie e gerencie tabelas, campos e relacionamentos com IA
- [Configuração de Permissões](./acl) — Configure papéis e permissões de acesso a dados
- [Gerenciamento de Workflow](./workflow) — Crie, edite e diagnostique workflows
