---
title: "Tablas integradas de aplicaciones y plugins principales"
description: "Referencia de tablas integradas, estrategias predeterminadas de migración, alcance del control de versiones y tratamiento de copias de seguridad/restauración."
keywords: "migración,control de versiones,copia de seguridad,restauración,tablas integradas,NocoBase"
---

# Tablas integradas de aplicaciones y plugins principales

## Introducción

Esta lista explica el tratamiento habitual de las tablas integradas de aplicaciones y plugins principales en migración, control de versiones y copia de seguridad/restauración. En la mayoría de los casos no es necesario ajustar tabla por tabla. Use la estrategia predeterminada.

Los mecanismos tienen enfoques diferentes:

- **Gestión de migraciones**: publica entre entornos. Las estrategias comunes son sobrescribir, solo estructura y omitir.
- **Control de versiones**: guarda y restaura hitos clave durante la construcción de la aplicación.
- **Copia de seguridad/restauración**: respalda y restaura el estado de ejecución de la aplicación.

La columna “Tipo de datos” proviene de la clasificación integrada. Los datos base del sistema participan en el control de versiones; los datos de ejecución de negocio no; los datos temporales de ejecución no se respaldan.

## Referencia de tablas integradas

### Database

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | Datos base del sistema | Solo estructura | Participa | Se respalda |

### Server

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | Datos base del sistema | Solo estructura | Participa | Se respalda |

### System settings

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Client

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Multi-space

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `spacesUsers` | Membership between users and spaces | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### App monitoring

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Main data source

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `collections` | Business collection fields, indexes, and metadata | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `fields` | Field types and constraints under collections | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Data source manager

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `dataSourcesRoles` | Access roles at data-source level | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### External database connections

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Visual data modeling

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### China region field

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Auto-number field

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### UI Schema

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `uiSchemas` | JSON layout definitions for pages and blocks | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### UI templates

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `flowModelTemplates` | Reusable flow-structure templates | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Flow engine

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `flowModels` | Model definitions for the modern flow engine | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `flowSql` | SQL snippets or scripts registered in flows | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Block templates

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `blockTemplates` | Reusable UI block definitions | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### iframe block

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Mobile

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Theme editor

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Map block

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Public forms

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Template printing

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### ACL

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `rolesResources` | Resources granted to roles | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `rolesResourcesScopes` | Data filter scopes visible to roles | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `rolesUsers` | Many-to-many relationship between users and roles | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Authentication

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `tokenControlConfig` | Session duration and refresh strategy | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `issuedTokens` | Issued login or API access tokens | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `usersAuthenticators` | Bindings between users and authentication methods | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Two-factor authentication

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### API keys

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Password policy

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `lockedUsers` | Accounts temporarily locked by policy | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### IP restriction

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Users

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Departments

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Datos de ejecución de negocio | Sobrescribir | No participa | Se respalda |
| `departmentsRoles` | Bindings between departments and default roles | Datos de ejecución de negocio | Sobrescribir | No participa | Se respalda |
| `departmentsUsers` | Relationships between users and departments | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### User data sync

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `userDataSyncRecords` | Execution records for synchronization jobs | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `userDataSyncTasks` | Synchronization task records | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Workflow

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `workflows` | Automation flow charts, triggers, and node configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `jobs` | Execution result of each node in a workflow run | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `userWorkflowTasks` | Task-count statistics for users | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `workflowCategories` | Workflow grouping in the UI | Datos de ejecución de negocio | Sobrescribir | No participa | Se respalda |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Datos de ejecución de negocio | Sobrescribir | No participa | Se respalda |
| `workflowStats` | Aggregated metrics such as run count and success rate | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `workflowTasks` | Task execution records for automation nodes | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Workflow approval

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `approvalExecutions` | Runtime status and current node of an approval flow | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Datos de ejecución de negocio | Sobrescribir | No participa | Se respalda |
| `approvalRecords` | Approval tasks and processing results from a personal view | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `approvals` | Approval-flow templates and step configuration | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Workflow manual node

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Workflow CC

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Notification manager

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### In-app messages

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Verification

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `otpRecords` | SMS or email OTP issue and verification records | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `usersVerifiers` | Bindings between users and verification channels or entities | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Mail manager

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `mailSettings` | Mail plugin switches and parameters | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Datos de ejecución de negocio | Sobrescribir | No participa | Se respalda |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `mailMessageLabels` | Mail category label definitions | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `mailMessageNotes` | Internal notes for individual emails | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `mailMessages` | Indexes for synced or sent email content | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `mailTemplates` | HTML/text templates for notification emails | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### AI

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `aiSettings` | AI basic settings | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `rolesAiEmployees` | Relationship between AI employees and roles | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `llmServices` | LLM providers and model endpoint configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `aiMessages` | User and assistant messages in conversations | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `aiToolMessages` | Requests and responses for function or tool calls | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Datos temporales de ejecución | Solo estructura | No participa | No se respalda |
| `lcCheckpointWrites` | Incremental checkpoint write records | Datos temporales de ejecución | Solo estructura | No participa | No se respalda |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Datos temporales de ejecución | Solo estructura | No participa | No se respalda |

### AI knowledge base

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `aiKnowledgeBase` | Tipo de base de conocimiento, ID externo, base de datos vectorial, servicio LLM, modelo de embedding e información básica | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `aiVectorDatabases` | Vector database service and connection configuration | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Environment variables

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | Datos base del sistema | Solo estructura | Participa | Se respalda |

### Migration manager

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | Datos base del sistema | Solo estructura | Participa | Se respalda |

### Backup manager

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Datos de ejecución de negocio | Sobrescribir | No participa | Se respalda |

### Audit logs

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Async tasks

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Record history

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `recordHistoryFields` | Fields that need history records | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `recordHistoryTemplate` | Display template for history records | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `recordFieldHistories` | Historical values and timeline for field changes | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |
| `recordHistories` | Versioned change records for entire records | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### File manager

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `attachments` | File attachment metadata associated with business records | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Localization

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `localizationTranslations` | Actual translated content for each language | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Localization tester

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Datos de ejecución de negocio | Solo estructura | No participa | Se respalda |

### Custom request

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | Datos base del sistema | Sobrescribir | Participa | Se respalda |
| `customRequestsRoles` | Roles allowed to call custom requests | Datos base del sistema | Sobrescribir | Participa | Se respalda |

### Custom variables

| Tabla | Descripción | Tipo de datos | Estrategia predeterminada | Control de versiones | Copia/restauración |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | Datos base del sistema | Sobrescribir | Participa | Se respalda |

## Tablas definidas por el usuario

Las tablas definidas por el usuario se tratan como datos de negocio por defecto. En la mayoría de los casos, migre solo la estructura y elija solo estructura.

Si almacenan configuración, categorías, plantillas, reglas u otros metadatos, puede usar sobrescribir según el escenario.

Si almacenan clientes, pedidos, tickets, aprobaciones, mensajes o logs, evite sobrescribir los registros de producción.
