---
title: "Built-in tables for applications and major plugins"
description: "Reference for built-in tables of applications and major plugins, covering Migration Manager default strategies, version-control scope, and backup/restore handling."
keywords: "Migration Manager,version control,backup restore,built-in tables,application configuration,plugin configuration,dataCategory,overwrite,schema-only,skip,NocoBase"
---

# Built-in tables for applications and major plugins

## Introduction

This list explains common handling for built-in tables of applications and major plugins in Migration Manager, version control, and backup/restore. In most cases, users do not need to adjust tables one by one. Use the default strategy.

These mechanisms focus on different concerns:

- **Migration Manager**: publishes across environments. Common strategies include overwrite, schema-only, and skip.
- **Version control**: saves and restores key checkpoints during application building.
- **Backup/restore**: backs up and restores the application runtime state.

The “Data type” column comes from built-in classification. System base data participates in version control; business runtime data does not; runtime temporary data is not backed up.

## Built-in table reference

### Database

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | System base data | Schema-only | Included | Backed up |

### Server

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | System base data | Overwrite | Included | Backed up |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | System base data | Schema-only | Included | Backed up |

### System settings

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | System base data | Overwrite | Included | Backed up |

### Client

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | System base data | Overwrite | Included | Backed up |

### Multi-space

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Business runtime data | Schema-only | Not included | Backed up |
| `spacesUsers` | Membership between users and spaces | Business runtime data | Schema-only | Not included | Backed up |

### App monitoring

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Business runtime data | Schema-only | Not included | Backed up |

### Main data source

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | System base data | Overwrite | Included | Backed up |
| `collections` | Business collection fields, indexes, and metadata | System base data | Overwrite | Included | Backed up |
| `fields` | Field types and constraints under collections | System base data | Overwrite | Included | Backed up |

### Data source manager

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | System base data | Overwrite | Included | Backed up |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | System base data | Overwrite | Included | Backed up |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | System base data | Overwrite | Included | Backed up |
| `dataSourcesRoles` | Access roles at data-source level | System base data | Overwrite | Included | Backed up |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | System base data | Overwrite | Included | Backed up |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | System base data | Overwrite | Included | Backed up |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | System base data | Overwrite | Included | Backed up |

### External database connections

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | System base data | Overwrite | Included | Backed up |

### Visual data modeling

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | System base data | Overwrite | Included | Backed up |

### China region field

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Business runtime data | Schema-only | Not included | Backed up |

### Auto-number field

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | System base data | Overwrite | Included | Backed up |

### UI Schema

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | System base data | Overwrite | Included | Backed up |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | System base data | Overwrite | Included | Backed up |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | System base data | Overwrite | Included | Backed up |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | System base data | Overwrite | Included | Backed up |
| `uiSchemas` | JSON layout definitions for pages and blocks | System base data | Overwrite | Included | Backed up |

### UI templates

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | System base data | Overwrite | Included | Backed up |
| `flowModelTemplates` | Reusable flow-structure templates | System base data | Overwrite | Included | Backed up |

### Flow engine

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | System base data | Overwrite | Included | Backed up |
| `flowModels` | Model definitions for the modern flow engine | System base data | Overwrite | Included | Backed up |
| `flowSql` | SQL snippets or scripts registered in flows | System base data | Overwrite | Included | Backed up |

### Block templates

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | System base data | Overwrite | Included | Backed up |
| `blockTemplates` | Reusable UI block definitions | System base data | Overwrite | Included | Backed up |

### iframe block

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | System base data | Overwrite | Included | Backed up |

### Mobile

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | System base data | Overwrite | Included | Backed up |

### Theme editor

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | System base data | Overwrite | Included | Backed up |

### Map block

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | System base data | Overwrite | Included | Backed up |

### Public forms

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | System base data | Overwrite | Included | Backed up |

### Template printing

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | System base data | Overwrite | Included | Backed up |

### ACL

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | System base data | Overwrite | Included | Backed up |
| `rolesResources` | Resources granted to roles | System base data | Overwrite | Included | Backed up |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | System base data | Overwrite | Included | Backed up |
| `rolesResourcesScopes` | Data filter scopes visible to roles | System base data | Overwrite | Included | Backed up |
| `rolesUsers` | Many-to-many relationship between users and roles | Business runtime data | Schema-only | Not included | Backed up |

### Authentication

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | System base data | Overwrite | Included | Backed up |
| `tokenControlConfig` | Session duration and refresh strategy | System base data | Overwrite | Included | Backed up |
| `issuedTokens` | Issued login or API access tokens | Business runtime data | Schema-only | Not included | Backed up |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Business runtime data | Schema-only | Not included | Backed up |
| `usersAuthenticators` | Bindings between users and authentication methods | Business runtime data | Schema-only | Not included | Backed up |

### Two-factor authentication

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | System base data | Overwrite | Included | Backed up |

### API keys

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Business runtime data | Schema-only | Not included | Backed up |

### Password policy

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | System base data | Overwrite | Included | Backed up |
| `lockedUsers` | Accounts temporarily locked by policy | Business runtime data | Schema-only | Not included | Backed up |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Business runtime data | Schema-only | Not included | Backed up |

### IP restriction

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | System base data | Overwrite | Included | Backed up |

### Users

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Business runtime data | Schema-only | Not included | Backed up |

### Departments

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Business runtime data | Overwrite | Not included | Backed up |
| `departmentsRoles` | Bindings between departments and default roles | Business runtime data | Overwrite | Not included | Backed up |
| `departmentsUsers` | Relationships between users and departments | Business runtime data | Schema-only | Not included | Backed up |

### User data sync

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | System base data | Overwrite | Included | Backed up |
| `userDataSyncRecords` | Execution records for synchronization jobs | Business runtime data | Schema-only | Not included | Backed up |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Business runtime data | Schema-only | Not included | Backed up |
| `userDataSyncTasks` | Synchronization task records | Business runtime data | Schema-only | Not included | Backed up |

### Workflow

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | System base data | Overwrite | Included | Backed up |
| `workflows` | Automation flow charts, triggers, and node configuration | System base data | Overwrite | Included | Backed up |
| `jobs` | Execution result of each node in a workflow run | Business runtime data | Schema-only | Not included | Backed up |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Business runtime data | Schema-only | Not included | Backed up |
| `userWorkflowTasks` | Task-count statistics for users | Business runtime data | Schema-only | Not included | Backed up |
| `workflowCategories` | Workflow grouping in the UI | Business runtime data | Overwrite | Not included | Backed up |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Business runtime data | Overwrite | Not included | Backed up |
| `workflowStats` | Aggregated metrics such as run count and success rate | Business runtime data | Schema-only | Not included | Backed up |
| `workflowTasks` | Task execution records for automation nodes | Business runtime data | Schema-only | Not included | Backed up |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Business runtime data | Schema-only | Not included | Backed up |

### Workflow approval

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Business runtime data | Schema-only | Not included | Backed up |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Business runtime data | Schema-only | Not included | Backed up |
| `approvalExecutions` | Runtime status and current node of an approval flow | Business runtime data | Schema-only | Not included | Backed up |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Business runtime data | Overwrite | Not included | Backed up |
| `approvalRecords` | Approval tasks and processing results from a personal view | Business runtime data | Schema-only | Not included | Backed up |
| `approvals` | Approval-flow templates and step configuration | Business runtime data | Schema-only | Not included | Backed up |

### Workflow manual node

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Business runtime data | Schema-only | Not included | Backed up |

### Workflow CC

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Business runtime data | Schema-only | Not included | Backed up |

### Notification manager

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | System base data | Overwrite | Included | Backed up |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Business runtime data | Schema-only | Not included | Backed up |

### In-app messages

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Business runtime data | Schema-only | Not included | Backed up |

### Verification

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | System base data | Overwrite | Included | Backed up |
| `otpRecords` | SMS or email OTP issue and verification records | Business runtime data | Schema-only | Not included | Backed up |
| `usersVerifiers` | Bindings between users and verification channels or entities | Business runtime data | Schema-only | Not included | Backed up |

### Mail manager

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | System base data | Overwrite | Included | Backed up |
| `mailSettings` | Mail plugin switches and parameters | System base data | Overwrite | Included | Backed up |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Business runtime data | Overwrite | Not included | Backed up |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Business runtime data | Schema-only | Not included | Backed up |
| `mailMessageLabels` | Mail category label definitions | Business runtime data | Schema-only | Not included | Backed up |
| `mailMessageNotes` | Internal notes for individual emails | Business runtime data | Schema-only | Not included | Backed up |
| `mailMessages` | Indexes for synced or sent email content | Business runtime data | Schema-only | Not included | Backed up |
| `mailTemplates` | HTML/text templates for notification emails | Business runtime data | Schema-only | Not included | Backed up |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Business runtime data | Schema-only | Not included | Backed up |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Business runtime data | Schema-only | Not included | Backed up |

### AI

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | System base data | Overwrite | Included | Backed up |
| `aiSettings` | AI basic settings | System base data | Overwrite | Included | Backed up |
| `rolesAiEmployees` | Relationship between AI employees and roles | System base data | Overwrite | Included | Backed up |
| `llmServices` | LLM providers and model endpoint configuration | System base data | Overwrite | Included | Backed up |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Business runtime data | Schema-only | Not included | Backed up |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Business runtime data | Schema-only | Not included | Backed up |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Business runtime data | Schema-only | Not included | Backed up |
| `aiMessages` | User and assistant messages in conversations | Business runtime data | Schema-only | Not included | Backed up |
| `aiToolMessages` | Requests and responses for function or tool calls | Business runtime data | Schema-only | Not included | Backed up |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Business runtime data | Schema-only | Not included | Backed up |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Runtime temporary data | Schema-only | Not included | Not backed up |
| `lcCheckpointWrites` | Incremental checkpoint write records | Runtime temporary data | Schema-only | Not included | Not backed up |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Runtime temporary data | Schema-only | Not included | Not backed up |

### AI knowledge base

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Business runtime data | Schema-only | Not included | Backed up |
| `aiKnowledgeBase` | Knowledge-base type, external ID, vector database, LLM service, embedding model, and base information | Business runtime data | Schema-only | Not included | Backed up |
| `aiVectorDatabases` | Vector database service and connection configuration | Business runtime data | Schema-only | Not included | Backed up |

### Environment variables

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | System base data | Schema-only | Included | Backed up |

### Migration manager

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | System base data | Schema-only | Included | Backed up |

### Backup manager

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Business runtime data | Overwrite | Not included | Backed up |

### Audit logs

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Business runtime data | Schema-only | Not included | Backed up |

### Async tasks

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Business runtime data | Schema-only | Not included | Backed up |

### Record history

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | System base data | Overwrite | Included | Backed up |
| `recordHistoryFields` | Fields that need history records | System base data | Overwrite | Included | Backed up |
| `recordHistoryTemplate` | Display template for history records | System base data | Overwrite | Included | Backed up |
| `recordFieldHistories` | Historical values and timeline for field changes | Business runtime data | Schema-only | Not included | Backed up |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Business runtime data | Schema-only | Not included | Backed up |
| `recordHistories` | Versioned change records for entire records | Business runtime data | Schema-only | Not included | Backed up |

### File manager

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | System base data | Overwrite | Included | Backed up |
| `attachments` | File attachment metadata associated with business records | Business runtime data | Schema-only | Not included | Backed up |

### Localization

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | System base data | Overwrite | Included | Backed up |
| `localizationTranslations` | Actual translated content for each language | System base data | Overwrite | Included | Backed up |

### Localization tester

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Business runtime data | Schema-only | Not included | Backed up |

### Custom request

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | System base data | Overwrite | Included | Backed up |
| `customRequestsRoles` | Roles allowed to call custom requests | System base data | Overwrite | Included | Backed up |

### Custom variables

| Table | Description | Data type | Default migration strategy | Version control | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | System base data | Overwrite | Included | Backed up |

## User-defined tables

User-defined tables are treated as business data by default. In most cases, migrate only the table structure and choose schema-only.

If a user-defined table stores business configuration, categories, templates, rules, or other metadata, and those records should be synchronized from development to staging or production with the release, choose overwrite based on the business scenario.

If a user-defined table stores runtime data such as customers, orders, tickets, approval records, messages, or logs, avoid overwriting production records.
