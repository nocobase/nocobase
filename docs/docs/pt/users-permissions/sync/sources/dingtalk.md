---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Sincronizar dados de usuário do DingTalk"
description: "Sincronize usuários e departamentos do DingTalk com o NocoBase e receba alterações por callback HTTP ou modo Stream."
keywords: "DingTalk,sincronização de usuários,sincronização de departamentos,modo Stream,assinatura de eventos,NocoBase"
---

# Sincronizar dados de usuário do DingTalk

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## Introdução

O plugin **DingTalk** sincroniza usuários e departamentos de uma organização DingTalk com o NocoBase. Ele oferece sincronização completa manual e atualizações incrementais por callback HTTP ou conexão Stream.

## Antes de começar

1. Instale e ative os plugins **DingTalk** e **Sincronização de dados de usuário**.
2. Crie um aplicativo interno na central de desenvolvedores do DingTalk.
3. Conceda as permissões de contatos e configure o escopo de dados descritos abaixo.
4. Copie o Client ID e o Client Secret. Consulte [Autenticação: DingTalk](/auth-verification/auth-dingtalk/).

## Configurar permissões de contatos e escopo de dados

Abra o **Gerenciamento de permissões** do aplicativo no DingTalk e conceda:

| Permissão | Identificador | Obrigatória | Finalidade |
| --- | --- | --- | --- |
| Ler informações de departamentos | `qyapi_get_department_list` | Sim | Ler lista, nomes e hierarquia de departamentos. |
| Ler membros de departamentos | `qyapi_get_department_member` | Sim | Ler os membros de cada departamento. |
| Ler informações de membros | `qyapi_get_member` | Sim | Ler detalhes e associações de usuários. |
| Informações de celular dos funcionários | `fieldMobile` | Ao usar celular | Sincronizar telefone; obrigatória quando o identificador é `mobile`. |
| E-mail e outras informações pessoais | `fieldEmail` | Não | Necessária para sincronizar e-mails. |

Configure também o **Escopo de permissões de dados** para incluir os departamentos e funcionários permitidos. Selecione todos os funcionários para sincronizar toda a organização.

:::warning
As permissões de API determinam os campos legíveis; o escopo de dados determina os departamentos e funcionários legíveis. Ambos são necessários. A assinatura de eventos não substitui as permissões de leitura.
:::

Se o mesmo aplicativo também for usado para login, conceda as permissões pessoais descritas em [Autenticação: DingTalk](/auth-verification/auth-dingtalk/).

## Adicionar uma fonte DingTalk

Acesse **Usuários e permissões > Sincronizar**, clique em **Adicionar** e selecione **DingTalk**.

| Campo | Descrição |
| --- | --- |
| Nome da fonte | Nome exclusivo da fonte. |
| Ativada | Inicia a recepção de eventos e permite tarefas de sincronização. |
| Client ID | Client ID do aplicativo; aceita variáveis de ambiente e segredos. |
| Client Secret | Client Secret do aplicativo; aceita variáveis de ambiente e segredos. |
| Identificador único do usuário | `mobile` ou `unionId`. Não altere após a primeira sincronização. Usuários sem o valor escolhido são ignorados. |
| Modo de recepção | **Callback HTTP** ou **modo Stream** para alterações incrementais. |

Salve e ative a fonte; em seguida clique em **Sincronizar** para executar primeiro uma sincronização completa.

## Escolher o modo de recepção de eventos

### Modo Stream

O modo Stream estabelece uma conexão persistente de saída do servidor NocoBase para o DingTalk. Não requer URL pública, Token ou EncodingAESKey.

1. Selecione **modo Stream** nas configurações de eventos do DingTalk.
2. Assine os eventos necessários de usuários e departamentos.
3. Selecione **modo Stream** no NocoBase, salve e ative a fonte.

O cliente Stream inicia quando a fonte é ativada. Atualizar, desativar ou excluir a fonte atualiza ou encerra a conexão.

:::info
O servidor NocoBase precisa estabelecer conexões de saída com o DingTalk. Não é necessário proxy reverso nem endpoint público de entrada.
:::

### Callback HTTP

1. Selecione **Callback HTTP** no NocoBase.
2. Informe o Token e o EncodingAESKey configurados no DingTalk.
3. Salve a fonte e copie a **URL de callback de eventos** gerada.
4. Configure a URL no DingTalk e assine os eventos de usuários e departamentos.

A URL deve ser acessível pelo DingTalk. Em produção use HTTPS e preserve o caminho completo no proxy reverso.

## Eventos incrementais compatíveis

| Evento | Tratamento no NocoBase |
| --- | --- |
| `user_add_org` | Criar ou atualizar o usuário. |
| `user_modify_org` | Atualizar o usuário. |
| `user_leave_org` | Excluir o usuário sincronizado. |
| `org_dept_create` | Criar ou atualizar o departamento. |
| `org_dept_modify` | Atualizar o departamento e sincronizar seus usuários. |
| `org_dept_remove` | Excluir o departamento sincronizado. |

## Campos sincronizados

### Campos de departamento

| Campo do DingTalk | Campo ou finalidade no NocoBase |
| --- | --- |
| `dept_id` | Identificador único do departamento na fonte. |
| `name` | Nome do departamento. |
| `parent_id` | Departamento pai. Se estiver fora do escopo, o departamento será sincronizado como raiz. |

### Campos de usuário

| Campo do DingTalk | Campo ou finalidade no NocoBase |
| --- | --- |
| `mobile` ou `unionid` | Identificador único da fonte e nome de usuário conforme a configuração. |
| `name` | Apelido do usuário. |
| `mobile` | Telefone. Requer `fieldMobile`. |
| `email`, usando `org_email` como alternativa | E-mail. Requer `fieldEmail`. |
| `dept_id_list` | Departamentos do usuário dentro do escopo de dados. |
| `dept_order_list` | Departamento principal. |
| `leader_in_dept` | Indica se o usuário é responsável pelo departamento. |

### Responsáveis por departamentos

O NocoBase sincroniza `leader_in_dept` separadamente para cada departamento. Um usuário pode responder por vários departamentos, independentemente do departamento principal. Ao remover a marca no DingTalk, a próxima sincronização também a remove no NocoBase. Alterações manuais podem ser sobrescritas.

As sincronizações completa e incremental usam o mesmo mapeamento. Avatar, cargo e número de funcionário não são sincronizados atualmente.

## Solução de problemas

- Se os dados estiverem vazios ou incompletos, verifique as três permissões obrigatórias e o escopo de dados.
- Se telefone ou e-mail estiverem vazios, verifique `fieldMobile` e `fieldEmail`.
- Usuários sem o identificador único configurado são ignorados.
- No Stream, procure `Dingtalk stream client starting`, `Dingtalk stream client started` e erros de conexão nos logs.
- No callback HTTP, verifique acesso público, Token e EncodingAESKey.
- Execute nova sincronização completa após alterar permissões ou escopo.
