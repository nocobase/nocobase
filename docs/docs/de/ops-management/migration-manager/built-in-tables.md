---
title: "Integrierte Tabellen von Anwendungen und wichtigen Plugins"
description: "Referenz zu integrierten Tabellen, Standardstrategien der Migrationsverwaltung, Versionsverwaltungsumfang und Backup-/Wiederherstellungsverhalten."
keywords: "Migrationsverwaltung,Versionsverwaltung,Backup,Wiederherstellung,integrierte Tabellen,NocoBase"
---

# Integrierte Tabellen von Anwendungen und wichtigen Plugins

## Einführung

Diese Liste beschreibt die übliche Behandlung integrierter Tabellen von Anwendungen und wichtigen Plugins in Migrationsverwaltung, Versionsverwaltung und Backup/Wiederherstellung. In den meisten Fällen müssen Benutzer Tabellen nicht einzeln anpassen. Verwenden Sie die Standardstrategie.

Die Mechanismen haben unterschiedliche Schwerpunkte:

- **Migrationsverwaltung**: für Veröffentlichungen zwischen Umgebungen. Typische Strategien sind Überschreiben, Nur Struktur und Überspringen.
- **Versionsverwaltung**: speichert und stellt wichtige Punkte beim Aufbau der Anwendung wieder her.
- **Backup/Wiederherstellung**: sichert und stellt den Laufzeitstand der Anwendung wieder her.

Die Spalte „Datentyp“ stammt aus der integrierten Klassifikation. Systembasisdaten nehmen an der Versionsverwaltung teil; Geschäftslaufzeitdaten nicht; temporäre Laufzeitdaten werden nicht gesichert.

## Referenz integrierter Tabellen

### Database

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | Systembasisdaten | Nur Struktur | Teilnahme | Gesichert |

### Server

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | Systembasisdaten | Nur Struktur | Teilnahme | Gesichert |

### System settings

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Client

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Multi-space

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `spacesUsers` | Membership between users and spaces | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### App monitoring

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Main data source

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `collections` | Business collection fields, indexes, and metadata | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `fields` | Field types and constraints under collections | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Data source manager

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `dataSourcesRoles` | Access roles at data-source level | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### External database connections

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Visual data modeling

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### China region field

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Auto-number field

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### UI Schema

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `uiSchemas` | JSON layout definitions for pages and blocks | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### UI templates

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `flowModelTemplates` | Reusable flow-structure templates | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Flow engine

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `flowModels` | Model definitions for the modern flow engine | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `flowSql` | SQL snippets or scripts registered in flows | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Block templates

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `blockTemplates` | Reusable UI block definitions | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### iframe block

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Mobile

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Theme editor

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Map block

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Public forms

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Template printing

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### ACL

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `rolesResources` | Resources granted to roles | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `rolesResourcesScopes` | Data filter scopes visible to roles | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `rolesUsers` | Many-to-many relationship between users and roles | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Authentication

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `tokenControlConfig` | Session duration and refresh strategy | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `issuedTokens` | Issued login or API access tokens | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `usersAuthenticators` | Bindings between users and authentication methods | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Two-factor authentication

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### API keys

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Password policy

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `lockedUsers` | Accounts temporarily locked by policy | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### IP restriction

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Users

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Departments

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Geschäftslaufzeitdaten | Überschreiben | Keine Teilnahme | Gesichert |
| `departmentsRoles` | Bindings between departments and default roles | Geschäftslaufzeitdaten | Überschreiben | Keine Teilnahme | Gesichert |
| `departmentsUsers` | Relationships between users and departments | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### User data sync

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `userDataSyncRecords` | Execution records for synchronization jobs | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `userDataSyncTasks` | Synchronization task records | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Workflow

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `workflows` | Automation flow charts, triggers, and node configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `jobs` | Execution result of each node in a workflow run | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `userWorkflowTasks` | Task-count statistics for users | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `workflowCategories` | Workflow grouping in the UI | Geschäftslaufzeitdaten | Überschreiben | Keine Teilnahme | Gesichert |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Geschäftslaufzeitdaten | Überschreiben | Keine Teilnahme | Gesichert |
| `workflowStats` | Aggregated metrics such as run count and success rate | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `workflowTasks` | Task execution records for automation nodes | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Workflow approval

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `approvalExecutions` | Runtime status and current node of an approval flow | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Geschäftslaufzeitdaten | Überschreiben | Keine Teilnahme | Gesichert |
| `approvalRecords` | Approval tasks and processing results from a personal view | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `approvals` | Approval-flow templates and step configuration | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Workflow manual node

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Workflow CC

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Notification manager

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### In-app messages

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Verification

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `otpRecords` | SMS or email OTP issue and verification records | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `usersVerifiers` | Bindings between users and verification channels or entities | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Mail manager

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `mailSettings` | Mail plugin switches and parameters | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Geschäftslaufzeitdaten | Überschreiben | Keine Teilnahme | Gesichert |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `mailMessageLabels` | Mail category label definitions | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `mailMessageNotes` | Internal notes for individual emails | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `mailMessages` | Indexes for synced or sent email content | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `mailTemplates` | HTML/text templates for notification emails | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### AI

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `aiSettings` | AI basic settings | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `rolesAiEmployees` | Relationship between AI employees and roles | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `llmServices` | LLM providers and model endpoint configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `aiMessages` | User and assistant messages in conversations | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `aiToolMessages` | Requests and responses for function or tool calls | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Temporäre Laufzeitdaten | Nur Struktur | Keine Teilnahme | Nicht gesichert |
| `lcCheckpointWrites` | Incremental checkpoint write records | Temporäre Laufzeitdaten | Nur Struktur | Keine Teilnahme | Nicht gesichert |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Temporäre Laufzeitdaten | Nur Struktur | Keine Teilnahme | Nicht gesichert |

### AI knowledge base

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `aiKnowledgeBase` | Wissensdatenbanktyp, externe ID, Vektordatenbank, LLM-Dienst, Embedding-Modell und Basisinformationen | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `aiVectorDatabases` | Vector database service and connection configuration | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Environment variables

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | Systembasisdaten | Nur Struktur | Teilnahme | Gesichert |

### Migration manager

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | Systembasisdaten | Nur Struktur | Teilnahme | Gesichert |

### Backup manager

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Geschäftslaufzeitdaten | Überschreiben | Keine Teilnahme | Gesichert |

### Audit logs

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Async tasks

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Record history

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `recordHistoryFields` | Fields that need history records | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `recordHistoryTemplate` | Display template for history records | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `recordFieldHistories` | Historical values and timeline for field changes | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |
| `recordHistories` | Versioned change records for entire records | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### File manager

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `attachments` | File attachment metadata associated with business records | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Localization

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `localizationTranslations` | Actual translated content for each language | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Localization tester

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Geschäftslaufzeitdaten | Nur Struktur | Keine Teilnahme | Gesichert |

### Custom request

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |
| `customRequestsRoles` | Roles allowed to call custom requests | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

### Custom variables

| Tabelle | Beschreibung | Datentyp | Standardstrategie der Migration | Versionsverwaltung | Backup/Wiederherstellung |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | Systembasisdaten | Überschreiben | Teilnahme | Gesichert |

## Benutzerdefinierte Tabellen

Benutzerdefinierte Tabellen werden standardmäßig als Geschäftsdaten behandelt. Meist wird nur die Tabellenstruktur migriert; wählen Sie Nur Struktur.

Wenn eine benutzerdefinierte Tabelle Konfiguration, Kategorien, Vorlagen, Regeln oder andere Metadaten speichert, können diese Datensätze je nach Szenario per Überschreiben synchronisiert werden.

Wenn sie Laufzeitdaten wie Kunden, Aufträge, Tickets, Genehmigungen, Nachrichten oder Logs speichert, vermeiden Sie das Überschreiben von Produktionsdaten.
