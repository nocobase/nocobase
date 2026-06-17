---
title: "Встроенные таблицы приложений и основных плагинов"
description: "Справочник встроенных таблиц: стратегии миграции по умолчанию, область управления версиями и обработка резервного копирования/восстановления."
keywords: "миграции,управление версиями,резервное копирование,восстановление,встроенные таблицы,NocoBase"
---

# Встроенные таблицы приложений и основных плагинов

## Введение

Этот список описывает обычную обработку встроенных таблиц приложений и основных плагинов в миграциях, управлении версиями и резервном копировании/восстановлении. В большинстве случаев не нужно настраивать таблицы по одной. Используйте стратегию по умолчанию.

Механизмы решают разные задачи:

- **Управление миграциями**: публикует изменения между окружениями. Частые стратегии: перезапись, только структура и пропуск.
- **Управление версиями**: сохраняет и восстанавливает ключевые точки при сборке приложения.
- **Резервное копирование/восстановление**: сохраняет и восстанавливает рабочее состояние приложения.

Столбец «Тип данных» основан на встроенной классификации. Системные базовые данные участвуют в управлении версиями; рабочие бизнес-данные не участвуют; временные runtime-данные не копируются.

## Справочник встроенных таблиц

### Database

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | Системные базовые данные | Только структура | Участвует | Копируется |

### Server

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | Системные базовые данные | Перезапись | Участвует | Копируется |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | Системные базовые данные | Только структура | Участвует | Копируется |

### System settings

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | Системные базовые данные | Перезапись | Участвует | Копируется |

### Client

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | Системные базовые данные | Перезапись | Участвует | Копируется |

### Multi-space

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `spacesUsers` | Membership between users and spaces | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### App monitoring

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Main data source

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | Системные базовые данные | Перезапись | Участвует | Копируется |
| `collections` | Business collection fields, indexes, and metadata | Системные базовые данные | Перезапись | Участвует | Копируется |
| `fields` | Field types and constraints under collections | Системные базовые данные | Перезапись | Участвует | Копируется |

### Data source manager

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | Системные базовые данные | Перезапись | Участвует | Копируется |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | Системные базовые данные | Перезапись | Участвует | Копируется |
| `dataSourcesRoles` | Access roles at data-source level | Системные базовые данные | Перезапись | Участвует | Копируется |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | Системные базовые данные | Перезапись | Участвует | Копируется |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | Системные базовые данные | Перезапись | Участвует | Копируется |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | Системные базовые данные | Перезапись | Участвует | Копируется |

### External database connections

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | Системные базовые данные | Перезапись | Участвует | Копируется |

### Visual data modeling

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | Системные базовые данные | Перезапись | Участвует | Копируется |

### China region field

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Auto-number field

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | Системные базовые данные | Перезапись | Участвует | Копируется |

### UI Schema

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | Системные базовые данные | Перезапись | Участвует | Копируется |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | Системные базовые данные | Перезапись | Участвует | Копируется |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | Системные базовые данные | Перезапись | Участвует | Копируется |
| `uiSchemas` | JSON layout definitions for pages and blocks | Системные базовые данные | Перезапись | Участвует | Копируется |

### UI templates

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | Системные базовые данные | Перезапись | Участвует | Копируется |
| `flowModelTemplates` | Reusable flow-structure templates | Системные базовые данные | Перезапись | Участвует | Копируется |

### Flow engine

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | Системные базовые данные | Перезапись | Участвует | Копируется |
| `flowModels` | Model definitions for the modern flow engine | Системные базовые данные | Перезапись | Участвует | Копируется |
| `flowSql` | SQL snippets or scripts registered in flows | Системные базовые данные | Перезапись | Участвует | Копируется |

### Block templates

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | Системные базовые данные | Перезапись | Участвует | Копируется |
| `blockTemplates` | Reusable UI block definitions | Системные базовые данные | Перезапись | Участвует | Копируется |

### iframe block

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | Системные базовые данные | Перезапись | Участвует | Копируется |

### Mobile

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | Системные базовые данные | Перезапись | Участвует | Копируется |

### Theme editor

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | Системные базовые данные | Перезапись | Участвует | Копируется |

### Map block

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | Системные базовые данные | Перезапись | Участвует | Копируется |

### Public forms

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | Системные базовые данные | Перезапись | Участвует | Копируется |

### Template printing

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | Системные базовые данные | Перезапись | Участвует | Копируется |

### ACL

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | Системные базовые данные | Перезапись | Участвует | Копируется |
| `rolesResources` | Resources granted to roles | Системные базовые данные | Перезапись | Участвует | Копируется |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | Системные базовые данные | Перезапись | Участвует | Копируется |
| `rolesResourcesScopes` | Data filter scopes visible to roles | Системные базовые данные | Перезапись | Участвует | Копируется |
| `rolesUsers` | Many-to-many relationship between users and roles | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Authentication

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `tokenControlConfig` | Session duration and refresh strategy | Системные базовые данные | Перезапись | Участвует | Копируется |
| `issuedTokens` | Issued login or API access tokens | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `usersAuthenticators` | Bindings between users and authentication methods | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Two-factor authentication

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | Системные базовые данные | Перезапись | Участвует | Копируется |

### API keys

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Password policy

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | Системные базовые данные | Перезапись | Участвует | Копируется |
| `lockedUsers` | Accounts temporarily locked by policy | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### IP restriction

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | Системные базовые данные | Перезапись | Участвует | Копируется |

### Users

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Departments

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Рабочие бизнес-данные | Перезапись | Не участвует | Копируется |
| `departmentsRoles` | Bindings between departments and default roles | Рабочие бизнес-данные | Перезапись | Не участвует | Копируется |
| `departmentsUsers` | Relationships between users and departments | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### User data sync

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `userDataSyncRecords` | Execution records for synchronization jobs | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `userDataSyncTasks` | Synchronization task records | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Workflow

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | Системные базовые данные | Перезапись | Участвует | Копируется |
| `workflows` | Automation flow charts, triggers, and node configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `jobs` | Execution result of each node in a workflow run | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `userWorkflowTasks` | Task-count statistics for users | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `workflowCategories` | Workflow grouping in the UI | Рабочие бизнес-данные | Перезапись | Не участвует | Копируется |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Рабочие бизнес-данные | Перезапись | Не участвует | Копируется |
| `workflowStats` | Aggregated metrics such as run count and success rate | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `workflowTasks` | Task execution records for automation nodes | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Workflow approval

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `approvalExecutions` | Runtime status and current node of an approval flow | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Рабочие бизнес-данные | Перезапись | Не участвует | Копируется |
| `approvalRecords` | Approval tasks and processing results from a personal view | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `approvals` | Approval-flow templates and step configuration | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Workflow manual node

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Workflow CC

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Notification manager

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | Системные базовые данные | Перезапись | Участвует | Копируется |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### In-app messages

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Verification

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | Системные базовые данные | Перезапись | Участвует | Копируется |
| `otpRecords` | SMS or email OTP issue and verification records | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `usersVerifiers` | Bindings between users and verification channels or entities | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Mail manager

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | Системные базовые данные | Перезапись | Участвует | Копируется |
| `mailSettings` | Mail plugin switches and parameters | Системные базовые данные | Перезапись | Участвует | Копируется |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Рабочие бизнес-данные | Перезапись | Не участвует | Копируется |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `mailMessageLabels` | Mail category label definitions | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `mailMessageNotes` | Internal notes for individual emails | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `mailMessages` | Indexes for synced or sent email content | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `mailTemplates` | HTML/text templates for notification emails | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### AI

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `aiSettings` | AI basic settings | Системные базовые данные | Перезапись | Участвует | Копируется |
| `rolesAiEmployees` | Relationship between AI employees and roles | Системные базовые данные | Перезапись | Участвует | Копируется |
| `llmServices` | LLM providers and model endpoint configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `aiMessages` | User and assistant messages in conversations | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `aiToolMessages` | Requests and responses for function or tool calls | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Временные runtime-данные | Только структура | Не участвует | Не копируется |
| `lcCheckpointWrites` | Incremental checkpoint write records | Временные runtime-данные | Только структура | Не участвует | Не копируется |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Временные runtime-данные | Только структура | Не участвует | Не копируется |

### AI knowledge base

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `aiKnowledgeBase` | Knowledge-base type, external ID, and base information | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `aiVectorDatabases` | Vector database service and connection configuration | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `aiVectorStoreConfig` | Relationship between vector database connections and embedding models | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Environment variables

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | Системные базовые данные | Только структура | Участвует | Копируется |

### Migration manager

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | Системные базовые данные | Только структура | Участвует | Копируется |

### Backup manager

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Рабочие бизнес-данные | Перезапись | Не участвует | Копируется |

### Audit logs

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Async tasks

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Record history

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | Системные базовые данные | Перезапись | Участвует | Копируется |
| `recordHistoryFields` | Fields that need history records | Системные базовые данные | Перезапись | Участвует | Копируется |
| `recordHistoryTemplate` | Display template for history records | Системные базовые данные | Перезапись | Участвует | Копируется |
| `recordFieldHistories` | Historical values and timeline for field changes | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |
| `recordHistories` | Versioned change records for entire records | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### File manager

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `attachments` | File attachment metadata associated with business records | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Localization

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | Системные базовые данные | Перезапись | Участвует | Копируется |
| `localizationTranslations` | Actual translated content for each language | Системные базовые данные | Перезапись | Участвует | Копируется |

### Localization tester

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Рабочие бизнес-данные | Только структура | Не участвует | Копируется |

### Custom request

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | Системные базовые данные | Перезапись | Участвует | Копируется |
| `customRequestsRoles` | Roles allowed to call custom requests | Системные базовые данные | Перезапись | Участвует | Копируется |

### Custom variables

| Таблица | Описание | Тип данных | Стратегия по умолчанию | Управление версиями | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | Системные базовые данные | Перезапись | Участвует | Копируется |

## Пользовательские таблицы

Пользовательские таблицы по умолчанию считаются бизнес-данными. Обычно мигрируют только структуру.

Если таблица хранит настройки, категории, шаблоны, правила или метаданные, можно выбрать перезапись по сценарию.

Если она хранит клиентов, заказы, заявки, согласования, сообщения или журналы, не перезаписывайте production.
