---
pkg: '@nocobase/plugin-auth-ldap'
title: "Sincronizar dados de usuário do LDAP"
description: "Sincronize usuários e departamentos LDAP com o NocoBase reutilizando um autenticador LDAP existente."
keywords: "LDAP,sincronização de usuários,sincronização de departamentos,Bind DN,Search DN,NocoBase"
---

# Sincronizar dados de usuário do LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Introdução

O plugin **Autenticação: LDAP** permite usar um autenticador LDAP existente como fonte de sincronização. Ele reutiliza conexão, Bind DN, Search DN, escopo de pesquisa e mapeamento de atributos, gravando usuários e, opcionalmente, a hierarquia de departamentos no NocoBase.

## Antes de começar

1. Instale e ative **Autenticação: LDAP** e **Sincronização de dados de usuário**.
2. Crie e teste um autenticador LDAP. Consulte [Autenticação: LDAP](/auth-verification/auth-ldap/).
3. Confirme que o mapeamento contém os campos necessários, como usuário ou e-mail, apelido e telefone.

## Adicionar uma fonte LDAP

Acesse **Usuários e permissões > Sincronizar**, clique em **Adicionar** e selecione **LDAP**.

| Campo | Descrição |
| --- | --- |
| Nome da fonte | Nome exclusivo da fonte. |
| Ativada | Permite sincronizações LDAP manuais e agendadas. |
| Autenticador LDAP | Autenticador cuja conexão e mapeamento serão reutilizados. |
| Filtro de sincronização | Filtro LDAP de usuários. Padrão: `(&(objectCategory=person)(objectClass=user))`. |
| Limite de tamanho | Máximo de entradas por pesquisa; vazio usa o limite do servidor. |
| Tamanho da página | Tamanho para pesquisas LDAP paginadas. |
| Sincronizar departamentos | Sincroniza a hierarquia LDAP como departamentos NocoBase. |
| DN de pesquisa de departamentos | Obrigatório para departamentos, por exemplo `ou=departments,dc=example,dc=com`. |

:::info
A fonte usa o Bind DN e a senha do autenticador selecionado e não armazena uma segunda cópia das credenciais.
:::

## Sincronizar usuários

Salve e ative a fonte e clique em **Sincronizar**. Abra **Tarefa** para revisar o resultado e tentar novamente tarefas com falha.

A correspondência segue **Usar este campo para vincular o usuário** no autenticador. Mantenha essa configuração e o mapeamento estáveis após a primeira sincronização para evitar duplicidade.

## Sincronizar departamentos

Ative **Sincronizar departamentos** e informe o **DN de pesquisa de departamentos**. O plugin pesquisa unidades organizacionais, preserva a hierarquia e associa o usuário ao departamento pelo Distinguished Name.

## Campos sincronizados

### Campos de usuário

| Atributo ou configuração LDAP | Campo ou finalidade no NocoBase |
| --- | --- |
| Atributo da conta de login | Identificador único da fonte e usuário ou e-mail selecionado para vínculo. Normalmente inferido de `{{account}}` no filtro, como `uid`, `sAMAccountName` ou `mail`. O usuário é ignorado se o atributo estiver ausente. |
| Mapeamento para `username` | Nome de usuário. |
| Mapeamento para `nickname` | Apelido. |
| Mapeamento para `email` | E-mail. |
| Mapeamento para `phone` | Telefone. |
| `distinguishedName`, ou DN da entrada | Departamento sincronizado mais próximo no caminho DN, definido como principal. |

Para atributos com vários valores, apenas o primeiro é sincronizado. Atributos sem mapeamento não são sincronizados.

### Campos de departamento

| Atributo ou estrutura LDAP | Campo ou finalidade no NocoBase |
| --- | --- |
| `objectGUID` | Identificador único da fonte. Unidades sem esse atributo são ignoradas. |
| `ou`, `cn`, `name` | O primeiro valor não vazio vira o nome do departamento. |
| `distinguishedName`, ou DN da entrada | Identifica o departamento e seu pai para montar a hierarquia. |

Por padrão, são pesquisados objetos `organizationalUnit` e `container`. Vários departamentos via `memberOf` e responsáveis por departamentos não são sincronizados atualmente.

## Solução de problemas

- Se nenhum usuário for retornado, verifique Search DN, escopo, permissões do Bind DN e filtro.
- Se o resultado estiver truncado, configure o tamanho da página e verifique os limites do servidor LDAP.
- Se faltarem departamentos, confira a ativação e a cobertura do DN de pesquisa.
- Consulte os detalhes da tarefa e os logs para erros de conexão, bind e pesquisa.
