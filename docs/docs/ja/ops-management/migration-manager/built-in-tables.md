---
title: "アプリケーションと主要プラグインの組み込みテーブル"
description: "組み込みテーブルの参考情報。移行管理の既定戦略、バージョン管理の対象範囲、バックアップ/復元の扱いを示します。"
keywords: "移行管理,バージョン管理,バックアップ,復元,組み込みテーブル,NocoBase"
---

# アプリケーションと主要プラグインの組み込みテーブル

## はじめに

この一覧は、アプリケーションと主要プラグインの組み込みテーブルについて、移行管理、バージョン管理、バックアップ/復元での一般的な扱いを示します。多くの場合、ユーザーがテーブルごとに調整する必要はありません。既定戦略を使用してください。

各仕組みの目的は異なります。

- **移行管理**: 環境間の公開に使用します。主な戦略は上書き、スキーマのみ、スキップです。
- **バージョン管理**: アプリ構築中の重要な時点を保存・復元します。
- **バックアップ/復元**: アプリの実行状態をバックアップし復元します。

「データ型」は組み込み分類に基づきます。システム基礎データはバージョン管理に参加し、業務実行データは参加せず、実行時一時データはバックアップされません。

## 組み込みテーブル参考

### Database

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | システム基礎データ | スキーマのみ | 対象 | バックアップ対象 |

### Server

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | システム基礎データ | スキーマのみ | 対象 | バックアップ対象 |

### System settings

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Client

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Multi-space

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `spacesUsers` | Membership between users and spaces | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### App monitoring

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Main data source

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `collections` | Business collection fields, indexes, and metadata | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `fields` | Field types and constraints under collections | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Data source manager

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `dataSourcesRoles` | Access roles at data-source level | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### External database connections

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Visual data modeling

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### China region field

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Auto-number field

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### UI Schema

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `uiSchemas` | JSON layout definitions for pages and blocks | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### UI templates

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `flowModelTemplates` | Reusable flow-structure templates | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Flow engine

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `flowModels` | Model definitions for the modern flow engine | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `flowSql` | SQL snippets or scripts registered in flows | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Block templates

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `blockTemplates` | Reusable UI block definitions | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### iframe block

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Mobile

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Theme editor

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Map block

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Public forms

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Template printing

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### ACL

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `rolesResources` | Resources granted to roles | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `rolesResourcesScopes` | Data filter scopes visible to roles | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `rolesUsers` | Many-to-many relationship between users and roles | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Authentication

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `tokenControlConfig` | Session duration and refresh strategy | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `issuedTokens` | Issued login or API access tokens | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `usersAuthenticators` | Bindings between users and authentication methods | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Two-factor authentication

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### API keys

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Password policy

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `lockedUsers` | Accounts temporarily locked by policy | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### IP restriction

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Users

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Departments

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | 業務実行データ | 上書き | 対象外 | バックアップ対象 |
| `departmentsRoles` | Bindings between departments and default roles | 業務実行データ | 上書き | 対象外 | バックアップ対象 |
| `departmentsUsers` | Relationships between users and departments | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### User data sync

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `userDataSyncRecords` | Execution records for synchronization jobs | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `userDataSyncTasks` | Synchronization task records | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Workflow

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `workflows` | Automation flow charts, triggers, and node configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `jobs` | Execution result of each node in a workflow run | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `userWorkflowTasks` | Task-count statistics for users | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `workflowCategories` | Workflow grouping in the UI | 業務実行データ | 上書き | 対象外 | バックアップ対象 |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | 業務実行データ | 上書き | 対象外 | バックアップ対象 |
| `workflowStats` | Aggregated metrics such as run count and success rate | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `workflowTasks` | Task execution records for automation nodes | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `workflowVersionStats` | Execution and performance statistics by workflow version | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Workflow approval

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `approvalExecutions` | Runtime status and current node of an approval flow | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `approvalMsgTpls` | Message templates for approval notices and tasks | 業務実行データ | 上書き | 対象外 | バックアップ対象 |
| `approvalRecords` | Approval tasks and processing results from a personal view | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `approvals` | Approval-flow templates and step configuration | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Workflow manual node

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Workflow CC

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Notification manager

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `notificationSendLogs` | Delivery status and failure reason for notifications | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### In-app messages

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Verification

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `otpRecords` | SMS or email OTP issue and verification records | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `usersVerifiers` | Bindings between users and verification channels or entities | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Mail manager

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `mailSettings` | Mail plugin switches and parameters | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | 業務実行データ | 上書き | 対象外 | バックアップ対象 |
| `mailMassMessages` | Mass-mail tasks and recipient batches | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `mailMessageLabels` | Mail category label definitions | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `mailMessageNotes` | Internal notes for individual emails | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `mailMessages` | Indexes for synced or sent email content | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `mailTemplates` | HTML/text templates for notification emails | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### AI

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `aiSettings` | AI basic settings | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `rolesAiEmployees` | Relationship between AI employees and roles | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `llmServices` | LLM providers and model endpoint configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `aiConversations` | Conversation context for sessions, topics, and message threads | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `aiMessages` | User and assistant messages in conversations | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `aiToolMessages` | Requests and responses for function or tool calls | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | 実行時一時データ | スキップ | 対象外 | バックアップ対象外 |
| `lcCheckpointWrites` | Incremental checkpoint write records | 実行時一時データ | スキップ | 対象外 | バックアップ対象外 |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | 実行時一時データ | スキップ | 対象外 | バックアップ対象外 |

### AI knowledge base

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `aiKnowledgeBase` | Knowledge-base type, external ID, and base information | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `aiVectorDatabases` | Vector database service and connection configuration | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `aiVectorStoreConfig` | Relationship between vector database connections and embedding models | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Environment variables

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | システム基礎データ | スキーマのみ | 対象 | バックアップ対象 |

### Migration manager

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | システム基礎データ | スキーマのみ | 対象 | バックアップ対象 |

### Backup manager

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | 業務実行データ | 上書き | 対象外 | バックアップ対象 |

### Audit logs

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Async tasks

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Record history

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `recordHistoryFields` | Fields that need history records | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `recordHistoryTemplate` | Display template for history records | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `recordFieldHistories` | Historical values and timeline for field changes | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |
| `recordHistories` | Versioned change records for entire records | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### File manager

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `attachments` | File attachment metadata associated with business records | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Localization

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `localizationTranslations` | Actual translated content for each language | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Localization tester

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | 業務実行データ | スキーマのみ | 対象外 | バックアップ対象 |

### Custom request

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | システム基礎データ | 上書き | 対象 | バックアップ対象 |
| `customRequestsRoles` | Roles allowed to call custom requests | システム基礎データ | 上書き | 対象 | バックアップ対象 |

### Custom variables

| テーブル | 説明 | データ型 | 移行の既定戦略 | バージョン管理 | バックアップ/復元 |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | システム基礎データ | 上書き | 対象 | バックアップ対象 |

## ユーザー定義テーブル

ユーザー定義テーブルは既定で業務データとして扱われます。通常は構造のみを移行し、スキーマのみを選択します。

設定、カテゴリ、テンプレート、ルールなどのメタデータを保存する場合は、業務シナリオに応じて上書きを選択できます。

顧客、注文、チケット、承認記録、メッセージ、ログなどの実行データを保存する場合、本番レコードの上書きは避けてください。
