---
title: "Tabelas integradas de aplicações e plugins principais"
description: "Referência de tabelas integradas, estratégias padrão de migração, escopo do controle de versão e tratamento de backup/restauração."
keywords: "migração,controle de versão,backup,restauração,tabelas integradas,NocoBase"
---

# Tabelas integradas de aplicações e plugins principais

## Introdução

Esta lista explica o tratamento comum das tabelas integradas de aplicações e plugins principais em migração, controle de versão e backup/restauração. Na maioria dos casos, não é necessário ajustar tabela por tabela. Use a estratégia padrão.

Os mecanismos têm focos diferentes:

- **Gerenciamento de migrações**: publica entre ambientes. Estratégias comuns incluem sobrescrever, somente estrutura e ignorar.
- **Controle de versão**: salva e restaura pontos importantes durante a construção da aplicação.
- **Backup/restauração**: faz backup e restaura o estado de execução da aplicação.

A coluna “Tipo de dados” vem da classificação integrada. Dados base do sistema participam do controle de versão; dados de execução de negócio não; dados temporários de execução não são salvos em backup.

## Referência de tabelas integradas

### Database

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | Dados base do sistema | Somente estrutura | Participa | Com backup |

### Server

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | Dados base do sistema | Somente estrutura | Participa | Com backup |

### System settings

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Client

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Multi-space

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `spacesUsers` | Membership between users and spaces | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### App monitoring

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Main data source

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `collections` | Business collection fields, indexes, and metadata | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `fields` | Field types and constraints under collections | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Data source manager

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `dataSourcesRoles` | Access roles at data-source level | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | Dados base do sistema | Sobrescrever | Participa | Com backup |

### External database connections

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Visual data modeling

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | Dados base do sistema | Sobrescrever | Participa | Com backup |

### China region field

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Auto-number field

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | Dados base do sistema | Sobrescrever | Participa | Com backup |

### UI Schema

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `uiSchemas` | JSON layout definitions for pages and blocks | Dados base do sistema | Sobrescrever | Participa | Com backup |

### UI templates

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `flowModelTemplates` | Reusable flow-structure templates | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Flow engine

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `flowModels` | Model definitions for the modern flow engine | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `flowSql` | SQL snippets or scripts registered in flows | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Block templates

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `blockTemplates` | Reusable UI block definitions | Dados base do sistema | Sobrescrever | Participa | Com backup |

### iframe block

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Mobile

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Theme editor

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Map block

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Public forms

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Template printing

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | Dados base do sistema | Sobrescrever | Participa | Com backup |

### ACL

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `rolesResources` | Resources granted to roles | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `rolesResourcesScopes` | Data filter scopes visible to roles | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `rolesUsers` | Many-to-many relationship between users and roles | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Authentication

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `tokenControlConfig` | Session duration and refresh strategy | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `issuedTokens` | Issued login or API access tokens | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `usersAuthenticators` | Bindings between users and authentication methods | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Two-factor authentication

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | Dados base do sistema | Sobrescrever | Participa | Com backup |

### API keys

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Password policy

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `lockedUsers` | Accounts temporarily locked by policy | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### IP restriction

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Users

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Departments

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Dados de execução de negócio | Sobrescrever | Não participa | Com backup |
| `departmentsRoles` | Bindings between departments and default roles | Dados de execução de negócio | Sobrescrever | Não participa | Com backup |
| `departmentsUsers` | Relationships between users and departments | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### User data sync

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `userDataSyncRecords` | Execution records for synchronization jobs | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `userDataSyncTasks` | Synchronization task records | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Workflow

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `workflows` | Automation flow charts, triggers, and node configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `jobs` | Execution result of each node in a workflow run | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `userWorkflowTasks` | Task-count statistics for users | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `workflowCategories` | Workflow grouping in the UI | Dados de execução de negócio | Sobrescrever | Não participa | Com backup |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Dados de execução de negócio | Sobrescrever | Não participa | Com backup |
| `workflowStats` | Aggregated metrics such as run count and success rate | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `workflowTasks` | Task execution records for automation nodes | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Workflow approval

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `approvalExecutions` | Runtime status and current node of an approval flow | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Dados de execução de negócio | Sobrescrever | Não participa | Com backup |
| `approvalRecords` | Approval tasks and processing results from a personal view | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `approvals` | Approval-flow templates and step configuration | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Workflow manual node

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Workflow CC

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Notification manager

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### In-app messages

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Verification

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `otpRecords` | SMS or email OTP issue and verification records | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `usersVerifiers` | Bindings between users and verification channels or entities | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Mail manager

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `mailSettings` | Mail plugin switches and parameters | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Dados de execução de negócio | Sobrescrever | Não participa | Com backup |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `mailMessageLabels` | Mail category label definitions | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `mailMessageNotes` | Internal notes for individual emails | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `mailMessages` | Indexes for synced or sent email content | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `mailTemplates` | HTML/text templates for notification emails | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### AI

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `aiSettings` | AI basic settings | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `rolesAiEmployees` | Relationship between AI employees and roles | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `llmServices` | LLM providers and model endpoint configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `aiMessages` | User and assistant messages in conversations | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `aiToolMessages` | Requests and responses for function or tool calls | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Dados temporários de execução | Somente estrutura | Não participa | Sem backup |
| `lcCheckpointWrites` | Incremental checkpoint write records | Dados temporários de execução | Somente estrutura | Não participa | Sem backup |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Dados temporários de execução | Somente estrutura | Não participa | Sem backup |

### AI knowledge base

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `aiKnowledgeBase` | Tipo de base de conhecimento, ID externo, banco de dados vetorial, serviço LLM, modelo de embedding e informações básicas | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `aiVectorDatabases` | Vector database service and connection configuration | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Environment variables

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | Dados base do sistema | Somente estrutura | Participa | Com backup |

### Migration manager

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | Dados base do sistema | Somente estrutura | Participa | Com backup |

### Backup manager

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Dados de execução de negócio | Sobrescrever | Não participa | Com backup |

### Audit logs

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Async tasks

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Record history

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `recordHistoryFields` | Fields that need history records | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `recordHistoryTemplate` | Display template for history records | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `recordFieldHistories` | Historical values and timeline for field changes | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |
| `recordHistories` | Versioned change records for entire records | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### File manager

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `attachments` | File attachment metadata associated with business records | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Localization

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `localizationTranslations` | Actual translated content for each language | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Localization tester

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Dados de execução de negócio | Somente estrutura | Não participa | Com backup |

### Custom request

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | Dados base do sistema | Sobrescrever | Participa | Com backup |
| `customRequestsRoles` | Roles allowed to call custom requests | Dados base do sistema | Sobrescrever | Participa | Com backup |

### Custom variables

| Tabela | Descrição | Tipo de dados | Estratégia padrão | Controle de versão | Backup/restauração |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | Dados base do sistema | Sobrescrever | Participa | Com backup |

## Tabelas definidas pelo usuário

Tabelas definidas pelo usuário são tratadas como dados de negócio por padrão. Em geral, migre apenas a estrutura.

Se armazenarem configuração, categorias, modelos, regras ou metadados, escolha sobrescrever conforme o cenário.

Se armazenarem clientes, pedidos, tickets, aprovações, mensagens ou logs, evite sobrescrever a produção.
