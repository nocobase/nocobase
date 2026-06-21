---
pkg: '@nocobase/plugin-migration-manager'
title: "Gerenciamento de migrações"
description: "Migração operacional: migre configurações de aplicação entre ambientes, com regras de somente estrutura, sobrescrever e ignorar. Depende do Backup Manager."
keywords: "Gerenciamento de migrações,Migration,configuração de aplicação,regras de migração,somente estrutura,sobrescrever,ignorar,NocoBase"
---

# Gerenciador de Migração

## Introdução

O Gerenciador de Migração ajuda você a transferir configurações de aplicativos de um ambiente para outro. Ele foca principalmente na migração de "configurações de aplicativos". Se você precisar de uma migração de dados completa, recomendamos usar o "[Gerenciador de Backup](../backup-manager/index.mdx)" para fazer backup e restaurar seu aplicativo.

## Instalação

O Gerenciador de Migração depende do [Gerenciador de Backup](../backup-manager/index.mdx). Certifique-se de que o plugin esteja instalado e ativado.

## Processo e Princípios

O Gerenciador de Migração transfere tabelas e dados do banco de dados principal, com base em regras de migração especificadas, movendo-os de uma instância de aplicativo para outra. É importante notar que ele não migra dados de bancos de dados externos ou subaplicativos.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Regras de Migração

### Regras integradas

O Gerenciador de Migrações oferece suporte às três regras a seguir:

- **Somente estrutura:** sincroniza apenas a estrutura da tabela. Não insere nem atualiza dados.
- **Sobrescrever:** remove os registros existentes da tabela e insere novos dados.
- **Ignorar:** não realiza nenhum processamento nessa tabela.

**Observações:**
- Sobrescrever também sincroniza alterações na estrutura da tabela.
- Tabelas de dados de negócio definidas pelo usuário normalmente usam Somente estrutura para evitar sobrescrever dados de produção.

### Design Detalhado

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Interface de Configuração

Configure as regras de migração

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Habilite regras independentes

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Selecione as regras independentes e as tabelas a serem processadas pelas regras independentes atuais

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Arquivos de Migração

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Criando uma Nova Migração

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Executando uma Migração

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Verificação de variáveis de ambiente do aplicativo (saiba mais sobre [Variáveis de Ambiente](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Se alguma estiver faltando, um pop-up solicitará que você insira as novas variáveis de ambiente necessárias aqui e, em seguida, continue.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Logs de Migração

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Reversão

Antes de qualquer migração ser executada, o aplicativo atual é automaticamente copiado. Se a migração falhar ou os resultados não forem os esperados, você pode reverter a operação usando o [Gerenciador de Backup](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)