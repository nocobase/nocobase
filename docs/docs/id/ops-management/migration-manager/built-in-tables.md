---
title: "Tabel bawaan aplikasi dan plugin utama"
description: "Referensi tabel bawaan, strategi default Migration Manager, cakupan kontrol versi, serta perlakuan backup/restore."
keywords: "Migration Manager,kontrol versi,backup restore,tabel bawaan,NocoBase"
---

# Tabel bawaan aplikasi dan plugin utama

## Pendahuluan

Daftar ini menjelaskan perlakuan umum untuk tabel bawaan aplikasi dan plugin utama dalam migrasi, kontrol versi, dan backup/restore. Pada umumnya pengguna tidak perlu menyesuaikan tabel satu per satu. Gunakan strategi default.

Mekanisme ini memiliki fokus berbeda:

- **Migration Manager**: mempublikasikan antar-environment. Strategi umum meliputi overwrite, schema-only, dan skip.
- **Kontrol versi**: menyimpan dan memulihkan titik penting saat membangun aplikasi.
- **Backup/restore**: mencadangkan dan memulihkan status runtime aplikasi.

Kolom “Tipe data” berasal dari klasifikasi bawaan. Data dasar sistem ikut kontrol versi; data runtime bisnis tidak; data sementara runtime tidak dibackup.

## Referensi tabel bawaan

### Database

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | Data dasar sistem | Schema-only | Ikut | Dibackup |

### Server

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | Data dasar sistem | Schema-only | Ikut | Dibackup |

### System settings

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Client

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Multi-space

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `spacesUsers` | Membership between users and spaces | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### App monitoring

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Main data source

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `collections` | Business collection fields, indexes, and metadata | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `fields` | Field types and constraints under collections | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Data source manager

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `dataSourcesRoles` | Access roles at data-source level | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | Data dasar sistem | Overwrite | Ikut | Dibackup |

### External database connections

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Visual data modeling

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | Data dasar sistem | Overwrite | Ikut | Dibackup |

### China region field

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Auto-number field

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | Data dasar sistem | Overwrite | Ikut | Dibackup |

### UI Schema

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `uiSchemas` | JSON layout definitions for pages and blocks | Data dasar sistem | Overwrite | Ikut | Dibackup |

### UI templates

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `flowModelTemplates` | Reusable flow-structure templates | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Flow engine

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `flowModels` | Model definitions for the modern flow engine | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `flowSql` | SQL snippets or scripts registered in flows | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Block templates

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `blockTemplates` | Reusable UI block definitions | Data dasar sistem | Overwrite | Ikut | Dibackup |

### iframe block

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Mobile

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Theme editor

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Map block

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Public forms

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Template printing

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | Data dasar sistem | Overwrite | Ikut | Dibackup |

### ACL

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `rolesResources` | Resources granted to roles | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `rolesResourcesScopes` | Data filter scopes visible to roles | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `rolesUsers` | Many-to-many relationship between users and roles | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Authentication

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `tokenControlConfig` | Session duration and refresh strategy | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `issuedTokens` | Issued login or API access tokens | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `usersAuthenticators` | Bindings between users and authentication methods | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Two-factor authentication

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | Data dasar sistem | Overwrite | Ikut | Dibackup |

### API keys

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Password policy

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `lockedUsers` | Accounts temporarily locked by policy | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### IP restriction

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Users

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Departments

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Data runtime bisnis | Overwrite | Tidak ikut | Dibackup |
| `departmentsRoles` | Bindings between departments and default roles | Data runtime bisnis | Overwrite | Tidak ikut | Dibackup |
| `departmentsUsers` | Relationships between users and departments | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### User data sync

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `userDataSyncRecords` | Execution records for synchronization jobs | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `userDataSyncTasks` | Synchronization task records | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Workflow

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `workflows` | Automation flow charts, triggers, and node configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `jobs` | Execution result of each node in a workflow run | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `userWorkflowTasks` | Task-count statistics for users | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `workflowCategories` | Workflow grouping in the UI | Data runtime bisnis | Overwrite | Tidak ikut | Dibackup |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Data runtime bisnis | Overwrite | Tidak ikut | Dibackup |
| `workflowStats` | Aggregated metrics such as run count and success rate | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `workflowTasks` | Task execution records for automation nodes | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Workflow approval

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `approvalExecutions` | Runtime status and current node of an approval flow | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Data runtime bisnis | Overwrite | Tidak ikut | Dibackup |
| `approvalRecords` | Approval tasks and processing results from a personal view | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `approvals` | Approval-flow templates and step configuration | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Workflow manual node

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Workflow CC

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Notification manager

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### In-app messages

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Verification

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `otpRecords` | SMS or email OTP issue and verification records | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `usersVerifiers` | Bindings between users and verification channels or entities | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Mail manager

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `mailSettings` | Mail plugin switches and parameters | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Data runtime bisnis | Overwrite | Tidak ikut | Dibackup |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `mailMessageLabels` | Mail category label definitions | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `mailMessageNotes` | Internal notes for individual emails | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `mailMessages` | Indexes for synced or sent email content | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `mailTemplates` | HTML/text templates for notification emails | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### AI

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `aiSettings` | AI basic settings | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `rolesAiEmployees` | Relationship between AI employees and roles | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `llmServices` | LLM providers and model endpoint configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `aiMessages` | User and assistant messages in conversations | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `aiToolMessages` | Requests and responses for function or tool calls | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Data sementara runtime | Schema-only | Tidak ikut | Tidak dibackup |
| `lcCheckpointWrites` | Incremental checkpoint write records | Data sementara runtime | Schema-only | Tidak ikut | Tidak dibackup |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Data sementara runtime | Schema-only | Tidak ikut | Tidak dibackup |

### AI knowledge base

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `aiKnowledgeBase` | Knowledge-base type, external ID, and base information | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `aiVectorDatabases` | Vector database service and connection configuration | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `aiVectorStoreConfig` | Relationship between vector database connections and embedding models | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Environment variables

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | Data dasar sistem | Schema-only | Ikut | Dibackup |

### Migration manager

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | Data dasar sistem | Schema-only | Ikut | Dibackup |

### Backup manager

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Data runtime bisnis | Overwrite | Tidak ikut | Dibackup |

### Audit logs

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Async tasks

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Record history

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `recordHistoryFields` | Fields that need history records | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `recordHistoryTemplate` | Display template for history records | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `recordFieldHistories` | Historical values and timeline for field changes | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |
| `recordHistories` | Versioned change records for entire records | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### File manager

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `attachments` | File attachment metadata associated with business records | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Localization

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `localizationTranslations` | Actual translated content for each language | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Localization tester

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Data runtime bisnis | Schema-only | Tidak ikut | Dibackup |

### Custom request

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | Data dasar sistem | Overwrite | Ikut | Dibackup |
| `customRequestsRoles` | Roles allowed to call custom requests | Data dasar sistem | Overwrite | Ikut | Dibackup |

### Custom variables

| Tabel | Deskripsi | Tipe data | Strategi migrasi default | Kontrol versi | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | Data dasar sistem | Overwrite | Ikut | Dibackup |

## Tabel buatan pengguna

Tabel buatan pengguna secara default diperlakukan sebagai data bisnis. Umumnya cukup migrasikan struktur dan pilih schema-only.

Jika tabel menyimpan konfigurasi, kategori, template, rule, atau metadata, overwrite dapat dipilih sesuai skenario bisnis.

Jika tabel menyimpan pelanggan, order, tiket, approval, pesan, atau log, hindari overwrite data production.
