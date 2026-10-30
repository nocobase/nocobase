---
pkg: '@nocobase/plugin-feishu'
title: "Sincronizar dados de usuário do Feishu"
description: "Sincronize usuários e departamentos do Feishu com o NocoBase e receba alterações incrementais via callback HTTP ou modo Stream."
keywords: "Feishu,Lark,sincronização de usuários,sincronização de departamentos,modo Stream,callback de eventos,NocoBase"
---

# Sincronizar dados de usuário do Feishu

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## Introdução

O plugin **Feishu / Lark** sincroniza usuários e departamentos de uma organização Feishu com o NocoBase. Suporta sincronização completa sob demanda e atualizações incrementais via callback HTTP ou conexão Stream.

## Antes de começar

1. Instale e ative os plugins **Feishu / Lark** e **Sincronização de dados de usuário**.
2. Crie um aplicativo interno na plataforma aberta do Feishu, veja [Autenticação: Feishu / Lark](/auth-verification/auth-feishu/).
3. Conceda as permissões de contatos e configure o escopo de visibilidade conforme abaixo.

## Permissões de contatos e escopo de visibilidade

Em **Gerenciamento de permissões** do aplicativo, ative:

| Permissão | Scope | Obrigatória | Finalidade |
| --- | --- | --- | --- |
| Obter informações básicas do usuário | `contact:user.base:readonly` | Sim | Lê nomes, `open_id` / `union_id` e outros campos básicos. |
| Obter informações básicas do departamento | `contact:department.base:readonly` | Sim | Lê nomes e hierarquia de departamentos. |
| Obter estrutura organizacional de departamentos | `contact:department.organize:readonly` | Sim | Percorre subdepartamentos; lê responsáveis. |
| Obter estrutura organizacional do usuário | `contact:user.department:readonly` | Sim | Lê departamentos e departamento principal. |
| Obter user ID do usuário | `contact:user.id:readonly` | Se identificador `user_id` | Lê o campo `user_id`. |
| Obter telefone do usuário | `contact:user.phone:readonly` | Para sincronizar telefones | Lê números; obrigatória se identificador `mobile`. |
| Obter e-mail do usuário | `contact:user.email:readonly` | Para sincronizar e-mails | Lê e-mails; obrigatória se identificador `email`. |

Em seguida configure o **escopo de permissões de contatos** (departamentos e membros acessíveis):

1. Em **Configuração de desenvolvimento → Permissões**, clique em **Configurar** na coluna "Escopo de dados acessível" (ativar uma permissão de contatos leva aqui automaticamente).
2. Selecione departamentos e membros; recomenda-se **Todos os membros** no início e restringir depois.
3. Clique em **OK** para salvar.

:::warning
Sem **Obter informações básicas do usuário**, a API não retorna nomes e os apelidos sincronizados ficam vazios. O escopo de permissões de contatos e a "disponibilidade do aplicativo" (quem pode usá-lo) são configurações independentes; apenas a primeira afeta a sincronização. Permissões de API definem os campos legíveis; o escopo define departamentos e usuários legíveis. Configure ambos e rode uma sincronização completa após alterações. A assinatura de eventos não substitui permissões de leitura: a cada evento o NocoBase consulta a API do Feishu.
:::

## Adicionar fonte de sincronização Feishu

Abra **Usuários e permissões** → **Sincronização** e adicione uma fonte do tipo **Feishu / Lark**:

| Campo | Descrição |
| --- | --- |
| Nome da fonte | Nome exclusivo da fonte. |
| Ativado | Inicia o recebimento de eventos e permite tarefas de sincronização. |
| Região | `Feishu China` ou `Lark Global`. |
| App ID / App Secret | Credenciais do aplicativo. Variáveis de ambiente e segredos são suportados. |
| Campo de identificador único | `user_id`, `union_id`, `open_id`, `mobile` ou `email`; recomenda-se `union_id`. Deve coincidir com o autenticador; usuários sem valor são ignorados. |
| Modo de recebimento de eventos | **Callback HTTP** ou **modo Stream**, veja abaixo. |

Salve e ative a fonte, depois clique em **Sincronizar** para a primeira sincronização completa.

## Escolher o modo de recebimento

### Modo Stream

O modo Stream mantém uma conexão WebSocket persistente iniciada pelo servidor NocoBase. Sem URL pública, token ou chave de criptografia.

1. Selecione **modo Stream** no NocoBase, salve e ative a fonte.
2. Na plataforma, em **Eventos e callbacks**, mude o recebimento para **conexão longa (WebSocket)** e assine os eventos de contatos.

A conexão inicia automaticamente ao ativar a fonte (com reconexão automática) e é atualizada ou encerrada conforme o ciclo da fonte.

:::info
O modo Stream não exige endereço público de entrada nem proxy reverso — adequado para implantações internas. Verifique a conexão nos logs buscando `Feishu stream client`.
:::

### Callback HTTP

1. Selecione **callback HTTP** e configure o **Verification Token** e, opcionalmente, o **Encrypt Key** — pelo menos um é obrigatório.
2. Salve a fonte e copie a **URL de callback de eventos** exibida.
3. Na plataforma, em **Eventos e callbacks** → **Configuração de eventos**, escolha o envio ao servidor, cole a URL e assine os eventos de contatos.

A URL deve ser acessível ao Feishu (HTTPS em produção). Com Encrypt Key o conteúdo é criptografado.

:::warning
Sem Verification Token ou Encrypt Key as requisições são recusadas (401). Fonte migrada para modo Stream fecha o endpoint HTTP (403).
:::

## Eventos incrementais suportados

| Evento | Tratamento no NocoBase |
| --- | --- |
| `contact.user.created_v3` | Criar ou atualizar o usuário. |
| `contact.user.updated_v3` | Atualizar o usuário. |
| `contact.user.deleted_v3` | Excluir o usuário sincronizado. |
| `contact.department.created_v3` | Criar ou atualizar o departamento. |
| `contact.department.updated_v3` | Atualizar o departamento. |
| `contact.department.deleted_v3` | Excluir o departamento sincronizado. |

Usuários com papel Root nunca são excluídos pela sincronização.

## Campos sincronizados

### Campos de departamento

| Campo Feishu | Campo / finalidade no NocoBase |
| --- | --- |
| `open_department_id` | Identificador de origem do departamento. |
| `name` | Nome do departamento. |
| `parent_department_id` | Departamento pai para a hierarquia; pai fora do escopo é sincronizado como raiz. |

### Campos de usuário

| Campo Feishu | Campo / finalidade no NocoBase |
| --- | --- |
| Valor do campo identificador | Identificador de origem e nome de usuário gerados do **campo de identificador único**. |
| `name`, se vazio `en_name` | Apelido; vazio se ambos faltarem. |
| `mobile` | Telefone. |
| `email` | E-mail. |
| `department_ids` | Departamentos do usuário; somente dentro do escopo. |
| `main_department_id` | Departamento principal. |

### Responsáveis de departamento

Responsáveis (líderes) dos dados de departamento são sincronizados como proprietários no NocoBase: um usuário pode responder por vários departamentos, e o departamento sob sua responsabilidade não precisa ser o principal. Apenas departamentos no escopo participam. Responsáveis removidos no Feishu são removidos na próxima sincronização; alterações manuais podem ser sobrescritas.

Outros campos como avatar, cargo e matrícula não são sincronizados atualmente.

## Solução de problemas

- Resultados vazios ou departamentos ausentes: verifique permissões de contatos e escopo.
- Apelidos vazios: ative **Obter informações básicas do usuário** (`contact:user.base:readonly`) e sincronize novamente.
- Usuários ignorados: confira o valor do identificador e a coincidência com o autenticador.
- Callback HTTP 401: Verification Token / Encrypt Key ausentes ou incorretos; 403: fonte mudou para modo Stream.
- Erros de `redirect_uri` ou URL de callback: a URL na plataforma deve ser idêntica à exibida no NocoBase (incluindo o prefixo `APP_PUBLIC_PATH`).
- Falha por limite de frequência da API: aguarde o limite acabar e execute novamente.
