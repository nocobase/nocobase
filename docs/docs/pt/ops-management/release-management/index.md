---
title: "Gerenciamento de publicações"
description: "Boas práticas de publicação: controle de versão, multi-app, Backup Manager e Migration Manager para desenvolvimento, homologação e produção."
keywords: "Gerenciamento de publicações,Release,controle de versão,multi-app,Backup Manager,Migration Manager,NocoBase"
---

# Gerenciamento de publicações

## Introdução

O gerenciamento de publicações define um processo repetível, verificável e recuperável para levar uma aplicação do desenvolvimento à produção. Conclua mudanças em desenvolvimento, valide em homologação e só depois publique em produção. Guarde arquivos de migração, backups, logs e resultados de validação.

~~~text
Desenvolvimento -> Homologação -> Produção
~~~

## Modelo de publicação

| Capacidade | Finalidade | Etapa |
| --- | --- | --- |
| Controle de versão | Salvar marcos e pontos de retorno | Desenvolvimento |
| Variáveis e segredos | Isolar configuração e dados sensíveis | Todas |
| Multi-app | Separar módulos e reduzir impacto | Arquitetura |
| Backup Manager | Manter estado recuperável | Antes da publicação e operação |
| Migration Manager | Publicar configuração e estrutura | Homologação e produção |

## Configuração de ambiente

Conexões de banco, serviços externos, contas de teste, tokens, API Keys e Webhooks devem usar variáveis e segredos, não valores fixos em páginas, workflows ou plugins.

Documentação relacionada: [Variáveis e segredos](../variables-and-secrets/index.md).

## Desenvolvimento

Use controle de versão antes e depois de mudanças relevantes em modelos, páginas, permissões, workflows ou plugins. A publicação entre ambientes deve usar o Migration Manager; recuperação de produção deve usar Backup Manager.

Documentação relacionada: [Controle de versão](../version-control/index.md).

## Divisão em módulos

Sistemas pequenos podem começar com uma aplicação. Quando a complexidade cresce, separe CRM, tickets, ativos, RH, relatórios ou back-office em aplicações independentes. Planeje usuários, organizações, autenticação, permissões e dados compartilhados.

~~~text
CRM: Desenvolvimento -> Homologação -> Produção
Tickets: Desenvolvimento -> Homologação -> Produção
Ativos: Desenvolvimento -> Homologação -> Produção
~~~

Documentação relacionada: [Gerenciamento multi-app](../../multi-app/multi-app/index.md).

## Preparação

Crie backup antes da produção. Em publicações importantes, teste a restauração em ambiente independente. O backup deve incluir banco, uploads e storage necessário.

Documentação relacionada: [Backup Manager](../backup-manager/index.mdx).

## Execução

Publique primeiro em homologação. Após validação, use o mesmo arquivo de migração em produção.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)

Em produção, agende janela de manutenção, avise usuários e evite novas escritas. Em multi-node, reduza para um nó antes da migração. Depois valide fluxos principais e restaure o acesso.

### Regras de migração

Estratégias comuns: sobrescrever, somente estrutura e ignorar. Tabelas integradas geralmente seguem a estratégia padrão. Tabelas de negócio definidas pelo usuário normalmente usam somente estrutura. Metadados podem usar sobrescrever conforme o cenário.

Consulte: [Tabelas integradas de aplicações e plugins principais](../migration-manager/built-in-tables.md).

Documentação relacionada: [Gerenciamento de migrações](../migration-manager/index.md).

## Rollback e recuperação

Se falhar, use primeiro o backup pré-publicação. Restaure no ambiente atual se ele ainda estiver estável; caso contrário, restaure em ambiente independente, valide e altere o tráfego.

## Documentação relacionada

- [Variáveis e segredos](../variables-and-secrets/index.md)
- [Controle de versão](../version-control/index.md)
- [Gerenciamento multi-app](../../multi-app/multi-app/index.md)
- [Backup Manager](../backup-manager/index.mdx)
- [Migration Manager](../migration-manager/index.md)
