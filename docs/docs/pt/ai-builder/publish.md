---
title: "Gerenciamento de Publicação"
description: "O Skill de Gerenciamento de Publicação serve para executar operações de publicação auditáveis entre múltiplos ambientes."
keywords: "Construtor de IA,gerenciamento de publicação,publicação entre ambientes,backup e restauração,migração"
---

# Gerenciamento de Publicação

:::tip Pré-requisitos

- Antes de ler esta página, certifique-se de que você seguiu o [Início Rápido do Construtor de IA](./index.md), instalou o NocoBase CLI e concluiu a inicialização.
- É necessário ter licença Profissional ou superior do [NocoBase Edição Comercial](https://www.nocobase.com/cn/commercial).
- Garanta que os plugins de Gerenciamento de Backup e de Gerenciamento de Migração estão ativos e atualizados para a versão mais recente.

:::

:::warning Atenção
O CLI relacionado ao gerenciamento de publicação ainda está em desenvolvimento contínuo e, no momento, não está disponível para uso.
:::
## Introdução

O Skill de Gerenciamento de Publicação serve para executar operações de publicação entre múltiplos ambientes — com suporte a duas formas: backup/restauração e migração.


## Capacidades

- Backup e restauração no mesmo ambiente: usa um pacote de backup para restaurar totalmente os dados da máquina local.
- Backup e restauração entre ambientes: usa um pacote de backup para restaurar totalmente os dados do ambiente alvo.
- Migração entre ambientes: usa um novo pacote de migração para atualizar de forma diferencial os dados do ambiente alvo.

## Exemplos de prompt

### Cenário A: Backup e restauração no mesmo ambiente
:::tip Pré-requisitos

O ambiente atual deve ter um pacote de backup, ou faça backup primeiro e depois restaure.

:::

Modo prompt
```
Restaure usando <file-name>.
```
Modo linha de comando
```
// Listar pacotes de backup disponíveis. Se não houver, execute nb backup <file-name>.
nb backup list
nb restore <file-name>
```
![Backup e restauração](https://static-docs.nocobase.com/20260417150854.png)

### Cenário B: Backup e restauração entre ambientes

:::tip Pré-requisitos

São necessários dois ambientes, por exemplo um ambiente local dev e um ambiente remoto test, ou dois ambientes instalados localmente.

:::

Modo prompt
```
Restaure dev em test.
```
Modo linha de comando
```
// Listar pacotes de backup disponíveis. Se não houver, execute nb backup <file-name> --env dev
nb backup list --env dev
// Restaurar usando o pacote de backup
nb restore <file-name> --env test
```
![Backup e restauração](https://static-docs.nocobase.com/20260417150854.png)

### Cenário C: Migração entre ambientes

:::tip Pré-requisitos

Semelhante ao Cenário B, são necessários dois ambientes, por exemplo um ambiente local dev e um ambiente remoto test, ou dois ambientes instalados localmente.

:::

Modo prompt
```
Migre dev para test.
```
Modo linha de comando
```
// Crie uma nova regra de migração — gera um novo ruleId, ou execute nb migration rule list --env dev para obter o ruleId histórico
nb migration rule add --env dev
// Use o ruleId para gerar o pacote de migração
nb migration generate <ruleId> --env dev
// Use o pacote de migração para fazer a migração
nb migration run <file-name> --env test
```
![Publicação por migração](https://static-docs.nocobase.com/20260417151022.png)

## Perguntas frequentes

**Devo escolher backup/restauração ou migração?**

Se você já tem um pacote de backup utilizável, escolha backup/restauração. Se precisa controlar quais dados serão sincronizados via política (por exemplo, sincronizar somente a estrutura, sem dados), escolha migração.

**Por que não tenho o plugin de migração?**

O plugin de gerenciamento de migração requer Edição Profissional ou superior. Veja detalhes em [NocoBase Edição Comercial](https://www.nocobase.com/cn/commercial).

## Links relacionados

- [Visão Geral do Construtor de IA](./index.md) — Visão geral de todos os Skills do Construtor de IA e como instalar
- [Gerenciamento de Ambiente](./env-bootstrap) — Verificação de ambiente, instalação e diagnóstico de falhas
