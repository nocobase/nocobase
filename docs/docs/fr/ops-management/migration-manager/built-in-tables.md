---
title: "Tables intégrées des applications et principaux plugins"
description: "Référence des tables intégrées, stratégies par défaut de migration, portée de gestion des versions et traitement sauvegarde/restauration."
keywords: "migration,gestion des versions,sauvegarde,restauration,tables intégrées,NocoBase"
---

# Tables intégrées des applications et principaux plugins

## Introduction

Cette liste décrit le traitement courant des tables intégrées des applications et principaux plugins dans la migration, la gestion des versions et la sauvegarde/restauration. Dans la plupart des cas, il n’est pas nécessaire d’ajuster les tables une par une. Utilisez la stratégie par défaut.

Les mécanismes répondent à des besoins différents :

- **Gestion des migrations**: publie entre environnements. Les stratégies courantes sont écraser, structure seule et ignorer.
- **Gestion des versions**: enregistre et restaure les points clés pendant la construction de l’application.
- **Sauvegarde/restauration**: sauvegarde et restaure l’état d’exécution de l’application.

La colonne « Type de données » provient de la classification intégrée. Les données de base système participent à la gestion des versions ; les données métier d’exécution non ; les données temporaires d’exécution ne sont pas sauvegardées.

## Référence des tables intégrées

### Database

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | Données de base système | Structure seule | Participe | Sauvegardé |

### Server

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | Données de base système | Écraser | Participe | Sauvegardé |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | Données de base système | Structure seule | Participe | Sauvegardé |

### System settings

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | Données de base système | Écraser | Participe | Sauvegardé |

### Client

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | Données de base système | Écraser | Participe | Sauvegardé |

### Multi-space

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `spacesUsers` | Membership between users and spaces | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### App monitoring

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Main data source

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | Données de base système | Écraser | Participe | Sauvegardé |
| `collections` | Business collection fields, indexes, and metadata | Données de base système | Écraser | Participe | Sauvegardé |
| `fields` | Field types and constraints under collections | Données de base système | Écraser | Participe | Sauvegardé |

### Data source manager

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | Données de base système | Écraser | Participe | Sauvegardé |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | Données de base système | Écraser | Participe | Sauvegardé |
| `dataSourcesRoles` | Access roles at data-source level | Données de base système | Écraser | Participe | Sauvegardé |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | Données de base système | Écraser | Participe | Sauvegardé |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | Données de base système | Écraser | Participe | Sauvegardé |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | Données de base système | Écraser | Participe | Sauvegardé |

### External database connections

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | Données de base système | Écraser | Participe | Sauvegardé |

### Visual data modeling

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | Données de base système | Écraser | Participe | Sauvegardé |

### China region field

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Auto-number field

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | Données de base système | Écraser | Participe | Sauvegardé |

### UI Schema

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | Données de base système | Écraser | Participe | Sauvegardé |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | Données de base système | Écraser | Participe | Sauvegardé |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | Données de base système | Écraser | Participe | Sauvegardé |
| `uiSchemas` | JSON layout definitions for pages and blocks | Données de base système | Écraser | Participe | Sauvegardé |

### UI templates

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | Données de base système | Écraser | Participe | Sauvegardé |
| `flowModelTemplates` | Reusable flow-structure templates | Données de base système | Écraser | Participe | Sauvegardé |

### Flow engine

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | Données de base système | Écraser | Participe | Sauvegardé |
| `flowModels` | Model definitions for the modern flow engine | Données de base système | Écraser | Participe | Sauvegardé |
| `flowSql` | SQL snippets or scripts registered in flows | Données de base système | Écraser | Participe | Sauvegardé |

### Block templates

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | Données de base système | Écraser | Participe | Sauvegardé |
| `blockTemplates` | Reusable UI block definitions | Données de base système | Écraser | Participe | Sauvegardé |

### iframe block

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | Données de base système | Écraser | Participe | Sauvegardé |

### Mobile

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | Données de base système | Écraser | Participe | Sauvegardé |

### Theme editor

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | Données de base système | Écraser | Participe | Sauvegardé |

### Map block

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | Données de base système | Écraser | Participe | Sauvegardé |

### Public forms

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | Données de base système | Écraser | Participe | Sauvegardé |

### Template printing

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | Données de base système | Écraser | Participe | Sauvegardé |

### ACL

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | Données de base système | Écraser | Participe | Sauvegardé |
| `rolesResources` | Resources granted to roles | Données de base système | Écraser | Participe | Sauvegardé |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | Données de base système | Écraser | Participe | Sauvegardé |
| `rolesResourcesScopes` | Data filter scopes visible to roles | Données de base système | Écraser | Participe | Sauvegardé |
| `rolesUsers` | Many-to-many relationship between users and roles | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Authentication

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `tokenControlConfig` | Session duration and refresh strategy | Données de base système | Écraser | Participe | Sauvegardé |
| `issuedTokens` | Issued login or API access tokens | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `usersAuthenticators` | Bindings between users and authentication methods | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Two-factor authentication

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | Données de base système | Écraser | Participe | Sauvegardé |

### API keys

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Password policy

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | Données de base système | Écraser | Participe | Sauvegardé |
| `lockedUsers` | Accounts temporarily locked by policy | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### IP restriction

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | Données de base système | Écraser | Participe | Sauvegardé |

### Users

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Departments

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Données métier d’exécution | Écraser | Ne participe pas | Sauvegardé |
| `departmentsRoles` | Bindings between departments and default roles | Données métier d’exécution | Écraser | Ne participe pas | Sauvegardé |
| `departmentsUsers` | Relationships between users and departments | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### User data sync

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `userDataSyncRecords` | Execution records for synchronization jobs | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `userDataSyncTasks` | Synchronization task records | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Workflow

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | Données de base système | Écraser | Participe | Sauvegardé |
| `workflows` | Automation flow charts, triggers, and node configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `jobs` | Execution result of each node in a workflow run | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `userWorkflowTasks` | Task-count statistics for users | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `workflowCategories` | Workflow grouping in the UI | Données métier d’exécution | Écraser | Ne participe pas | Sauvegardé |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Données métier d’exécution | Écraser | Ne participe pas | Sauvegardé |
| `workflowStats` | Aggregated metrics such as run count and success rate | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `workflowTasks` | Task execution records for automation nodes | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Workflow approval

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `approvalExecutions` | Runtime status and current node of an approval flow | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Données métier d’exécution | Écraser | Ne participe pas | Sauvegardé |
| `approvalRecords` | Approval tasks and processing results from a personal view | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `approvals` | Approval-flow templates and step configuration | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Workflow manual node

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Workflow CC

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Notification manager

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | Données de base système | Écraser | Participe | Sauvegardé |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### In-app messages

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Verification

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | Données de base système | Écraser | Participe | Sauvegardé |
| `otpRecords` | SMS or email OTP issue and verification records | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `usersVerifiers` | Bindings between users and verification channels or entities | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Mail manager

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | Données de base système | Écraser | Participe | Sauvegardé |
| `mailSettings` | Mail plugin switches and parameters | Données de base système | Écraser | Participe | Sauvegardé |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Données métier d’exécution | Écraser | Ne participe pas | Sauvegardé |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `mailMessageLabels` | Mail category label definitions | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `mailMessageNotes` | Internal notes for individual emails | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `mailMessages` | Indexes for synced or sent email content | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `mailTemplates` | HTML/text templates for notification emails | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### AI

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `aiSettings` | AI basic settings | Données de base système | Écraser | Participe | Sauvegardé |
| `rolesAiEmployees` | Relationship between AI employees and roles | Données de base système | Écraser | Participe | Sauvegardé |
| `llmServices` | LLM providers and model endpoint configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `aiMessages` | User and assistant messages in conversations | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `aiToolMessages` | Requests and responses for function or tool calls | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Données temporaires d’exécution | Structure seule | Ne participe pas | Non sauvegardé |
| `lcCheckpointWrites` | Incremental checkpoint write records | Données temporaires d’exécution | Structure seule | Ne participe pas | Non sauvegardé |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Données temporaires d’exécution | Structure seule | Ne participe pas | Non sauvegardé |

### AI knowledge base

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `aiKnowledgeBase` | Knowledge-base type, external ID, and base information | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `aiVectorDatabases` | Vector database service and connection configuration | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `aiVectorStoreConfig` | Relationship between vector database connections and embedding models | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Environment variables

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | Données de base système | Structure seule | Participe | Sauvegardé |

### Migration manager

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | Données de base système | Structure seule | Participe | Sauvegardé |

### Backup manager

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Données métier d’exécution | Écraser | Ne participe pas | Sauvegardé |

### Audit logs

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Async tasks

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Record history

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | Données de base système | Écraser | Participe | Sauvegardé |
| `recordHistoryFields` | Fields that need history records | Données de base système | Écraser | Participe | Sauvegardé |
| `recordHistoryTemplate` | Display template for history records | Données de base système | Écraser | Participe | Sauvegardé |
| `recordFieldHistories` | Historical values and timeline for field changes | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |
| `recordHistories` | Versioned change records for entire records | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### File manager

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `attachments` | File attachment metadata associated with business records | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Localization

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | Données de base système | Écraser | Participe | Sauvegardé |
| `localizationTranslations` | Actual translated content for each language | Données de base système | Écraser | Participe | Sauvegardé |

### Localization tester

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Données métier d’exécution | Structure seule | Ne participe pas | Sauvegardé |

### Custom request

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | Données de base système | Écraser | Participe | Sauvegardé |
| `customRequestsRoles` | Roles allowed to call custom requests | Données de base système | Écraser | Participe | Sauvegardé |

### Custom variables

| Table | Description | Type de données | Stratégie par défaut | Gestion des versions | Sauvegarde/restauration |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | Données de base système | Écraser | Participe | Sauvegardé |

## Tables définies par l’utilisateur

Les tables définies par l’utilisateur sont traitées par défaut comme des données métier. Dans la plupart des cas, migrez seulement la structure.

Si elles stockent des configurations, catégories, modèles, règles ou métadonnées, choisissez écraser selon le scénario.

Si elles stockent clients, commandes, tickets, approbations, messages ou journaux, évitez d’écraser la production.
