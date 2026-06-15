---
title: "Bảng tích hợp của ứng dụng và plugin chính"
description: "Tài liệu tham khảo bảng tích hợp, chiến lược mặc định của Migration Manager, phạm vi quản lý phiên bản và cách xử lý backup/restore."
keywords: "Migration Manager,quản lý phiên bản,backup restore,bảng tích hợp,NocoBase"
---

# Bảng tích hợp của ứng dụng và plugin chính

## Giới thiệu

Danh sách này mô tả cách xử lý phổ biến của các bảng tích hợp trong ứng dụng và plugin chính khi migration, quản lý phiên bản và backup/restore. Phần lớn trường hợp người dùng không cần chỉnh từng bảng. Hãy dùng chiến lược mặc định.

Các cơ chế có trọng tâm khác nhau:

- **Migration Manager**: dùng để phát hành giữa các môi trường. Chiến lược phổ biến gồm ghi đè, chỉ cấu trúc và bỏ qua.
- **Quản lý phiên bản**: lưu và khôi phục các mốc quan trọng khi xây dựng ứng dụng.
- **Backup/restore**: sao lưu và khôi phục trạng thái runtime của ứng dụng.

Cột “Loại dữ liệu” đến từ phân loại tích hợp. Dữ liệu nền tảng hệ thống tham gia quản lý phiên bản; dữ liệu runtime nghiệp vụ không tham gia; dữ liệu tạm runtime không được backup.

## Tham khảo bảng tích hợp

### Database

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrations` | Executed ORM/SQL migration versions | Dữ liệu nền tảng hệ thống | Chỉ cấu trúc | Tham gia | Backup |

### Server

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `applicationPlugins` | Plugin list and versions loaded by the application | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `applicationVersion` | Application and core version used for upgrade and compatibility checks | Dữ liệu nền tảng hệ thống | Chỉ cấu trúc | Tham gia | Backup |

### System settings

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `systemSettings` | Installation-level system parameters and feature switches | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Client

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `desktopRoutes` | Desktop menu and route structure | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Multi-space

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `spaces` | Top-level containers for space or workspace isolation | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `spacesUsers` | Membership between users and spaces | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### App monitoring

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apps` | Application entries managed by the app monitoring plugin | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Main data source

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `collectionCategories` | UI grouping for business collections | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `collections` | Business collection fields, indexes, and metadata | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `fields` | Field types and constraints under collections | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Data source manager

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `dataSources` | Main or external database connection configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `dataSourcesCollections` | Mapping for synced tables or collections from external sources | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `dataSourcesFields` | Mapping between external fields and NocoBase fields | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `dataSourcesRoles` | Access roles at data-source level | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `dataSourcesRolesResources` | Collections and operations accessible by roles | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `dataSourcesRolesResourcesActions` | Allowed actions such as create, read, update, and delete | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `dataSourcesRolesResourcesScopes` | Row-level or filter-scope restrictions | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### External database connections

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `databaseServers` | Registered database instances available for connection | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Visual data modeling

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `graphPositions` | Node positions in graph or flow editors | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### China region field

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `chinaRegions` | Province, city, and district geographic dictionary | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Auto-number field

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `sequences` | Sequence table for auto-generated business numbers | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### UI Schema

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `uiButtonSchemasRoles` | Relationship between button permissions and roles | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `uiSchemaServerHooks` | Server-side hook extension points for UI configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `uiSchemaTemplates` | Reusable form and detail layout fragments | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `uiSchemaTreePath` | Materialized paths for component-tree hierarchy | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `uiSchemas` | JSON layout definitions for pages and blocks | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### UI templates

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTemplateUsages` | Entities instantiated from a flow template | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `flowModelTemplates` | Reusable flow-structure templates | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Flow engine

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flowModelTreePath` | Materialized paths for flow-model tree structures | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `flowModels` | Model definitions for the modern flow engine | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `flowSql` | SQL snippets or scripts registered in flows | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Block templates

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `blockTemplateLinks` | Relationships between pages and block templates | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `blockTemplates` | Reusable UI block definitions | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### iframe block

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `iframeHtml` | HTML configuration required by embedded iframes | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Mobile

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mobileRoutes` | Mobile app menus and routes | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Theme editor

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `themeConfig` | Light/dark themes and brand colors | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Map block

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mapConfiguration` | Map widget center, zoom, and base-map configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Public forms

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `publicForms` | External forms and submission-entry configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Template printing

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `printingTemplates` | Print layouts for list or detail views | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### ACL

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `roles` | Role definitions for permission sets | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `rolesResources` | Resources granted to roles | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `rolesResourcesActions` | Actions allowed on resources, such as view and update | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `rolesResourcesScopes` | Data filter scopes visible to roles | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `rolesUsers` | Many-to-many relationship between users and roles | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Authentication

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `authenticators` | Password and third-party login method configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `tokenControlConfig` | Session duration and refresh strategy | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `issuedTokens` | Issued login or API access tokens | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `tokenBlacklist` | Tokens that have been logged out or forcibly invalidated | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `usersAuthenticators` | Bindings between users and authentication methods | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Two-factor authentication

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `twoFactorAuthSettings` | 2FA methods and user-level switches | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### API keys

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `apiKeys` | Open API keys and permission scopes | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Password policy

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `passwordPolicy` | Password complexity and expiration policies | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `lockedUsers` | Accounts temporarily locked by policy | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `userPasswordHistory` | Recent password hashes used to prevent reuse | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### IP restriction

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `ipRestrictionConfig` | IP allowlist or blocklist rules | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Users

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `users` | Login accounts, profiles, and basic status | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Departments

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `departments` | Department tree in the organization structure | Dữ liệu runtime nghiệp vụ | Ghi đè | Không tham gia | Backup |
| `departmentsRoles` | Bindings between departments and default roles | Dữ liệu runtime nghiệp vụ | Ghi đè | Không tham gia | Backup |
| `departmentsUsers` | Relationships between users and departments | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### User data sync

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `userDataSyncSources` | External identity source or account-system connection configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `userDataSyncRecords` | Execution records for synchronization jobs | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `userDataSyncRecordsResources` | Tables or resources involved in synchronization jobs | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `userDataSyncTasks` | Synchronization task records | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Workflow

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `flow_nodes` | Workflow nodes | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `workflows` | Automation flow charts, triggers, and node configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `jobs` | Execution result of each node in a workflow run | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `executions` | Status, inputs, outputs, and log indexes for workflow runs | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `userWorkflowTasks` | Task-count statistics for users | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `workflowCategories` | Workflow grouping in the UI | Dữ liệu runtime nghiệp vụ | Ghi đè | Không tham gia | Backup |
| `workflowCategoryRelations` | Many-to-many relationship between workflows and categories | Dữ liệu runtime nghiệp vụ | Ghi đè | Không tham gia | Backup |
| `workflowStats` | Aggregated metrics such as run count and success rate | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `workflowTasks` | Task execution records for automation nodes | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `workflowVersionStats` | Execution and performance statistics by workflow version | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Workflow approval

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `approvalAudienceUsers` | Relationship between approval audiences and users | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `approvalAudiences` | Approval notification or participation scope grouped by role or user | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `approvalExecutions` | Runtime status and current node of an approval flow | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `approvalMsgTpls` | Message templates for approval notices and tasks | Dữ liệu runtime nghiệp vụ | Ghi đè | Không tham gia | Backup |
| `approvalRecords` | Approval tasks and processing results from a personal view | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `approvals` | Approval-flow templates and step configuration | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Workflow manual node

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowManualTasks` | Manual-node tasks that require human handling | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Workflow CC

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `workflowCcTasks` | Read-only copied workflow tasks | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Notification manager

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationChannels` | Delivery channel configuration such as in-app messages and email | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `notificationSendLogs` | Delivery status and failure reason for notifications | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### In-app messages

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `notificationInAppMessages` | In-app messages received by users | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Verification

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `verifiers` | Configuration for who can initiate or complete verification | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `otpRecords` | SMS or email OTP issue and verification records | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `usersVerifiers` | Bindings between users and verification channels or entities | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Mail manager

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `mailGeneralSettings` | Global mail behavior and default values | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `mailSettings` | Mail plugin switches and parameters | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `mailAccounts` | Sending mailbox accounts and SMTP configuration | Dữ liệu runtime nghiệp vụ | Ghi đè | Không tham gia | Backup |
| `mailMassMessages` | Mass-mail tasks and recipient batches | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `mailMessageLabels` | Mail category label definitions | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `mailMessageNotes` | Internal notes for individual emails | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `mailMessages` | Indexes for synced or sent email content | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `mailTemplates` | HTML/text templates for notification emails | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `mailmessagelabelsMailmessages` | Join table between emails and many-to-many labels | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `mailmessagelabelsMailmessagesRel` | Auxiliary fields or extension table for mail-label relationships | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### AI

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiEmployees` | AI employee profiles: nickname, skills, models, knowledge bases, and related configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `aiSettings` | AI basic settings | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `rolesAiEmployees` | Relationship between AI employees and roles | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `llmServices` | LLM providers and model endpoint configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `aiContextDatasources` | Business collections, fields, and filters queryable by AI employees | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `aiConversations` | Conversation context for sessions, topics, and message threads | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `aiFiles` | Uploaded files and storage references generated by the AI plugin | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `aiMessages` | User and assistant messages in conversations | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `aiToolMessages` | Requests and responses for function or tool calls | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `usersAiEmployees` | Relationship between user custom prompts and AI employees | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `lcCheckpointBlobs` | Binary blocks for LLM conversation checkpoints | Dữ liệu tạm runtime | Bỏ qua | Không tham gia | Không backup |
| `lcCheckpointWrites` | Incremental checkpoint write records | Dữ liệu tạm runtime | Bỏ qua | Không tham gia | Không backup |
| `lcCheckpoints` | LangGraph checkpoint metadata for recoverable conversations | Dữ liệu tạm runtime | Bỏ qua | Không tham gia | Không backup |

### AI knowledge base

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `aiKnowledgeBaseDocs` | Document chunks and index metadata stored in knowledge bases | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `aiKnowledgeBase` | Knowledge-base type, external ID, and base information | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `aiVectorDatabases` | Vector database service and connection configuration | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `aiVectorStoreConfig` | Relationship between vector database connections and embedding models | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Environment variables

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `environmentVariables` | Deployment-related key-value entries, such as secret placeholder names | Dữ liệu nền tảng hệ thống | Chỉ cấu trúc | Tham gia | Backup |

### Migration manager

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `migrationRules` | Rules and scope configuration in the migration manager | Dữ liệu nền tảng hệ thống | Chỉ cấu trúc | Tham gia | Backup |

### Backup manager

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `backupSettings` | Automatic backup and retention policy | Dữ liệu runtime nghiệp vụ | Ghi đè | Không tham gia | Backup |

### Audit logs

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `auditTrails` | Trace of who operated on which resources and when | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Async tasks

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `asyncTasks` | Queue, status, and result of long-running tasks | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Record history

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `recordHistoryCollections` | Collections with field history enabled | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `recordHistoryFields` | Fields that need history records | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `recordHistoryTemplate` | Display template for history records | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `recordFieldHistories` | Historical values and timeline for field changes | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `recordFieldSnapshots` | Snapshot proof of field values at a point in time | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |
| `recordHistories` | Versioned change records for entire records | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### File manager

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `storages` | Local, S3, OSS, and other storage bucket configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `attachments` | File attachment metadata associated with business records | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Localization

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localizationTexts` | Keys and default text awaiting translation | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `localizationTranslations` | Actual translated content for each language | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Localization tester

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `localeTester` | Entries used for localization debugging or testing | Dữ liệu runtime nghiệp vụ | Chỉ cấu trúc | Không tham gia | Backup |

### Custom request

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customRequests` | Custom HTTP request actions with URL and method configuration | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |
| `customRequestsRoles` | Roles allowed to call custom requests | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

### Custom variables

| Bảng | Mô tả | Loại dữ liệu | Chiến lược mặc định | Quản lý phiên bản | Backup/restore |
| --- | --- | --- | --- | --- | --- |
| `customVariables` | Variable definitions and default values available to flows or globally | Dữ liệu nền tảng hệ thống | Ghi đè | Tham gia | Backup |

## Bảng do người dùng tạo

Bảng do người dùng tạo mặc định được xem là dữ liệu nghiệp vụ. Thường chỉ cần migration cấu trúc và chọn chỉ cấu trúc.

Nếu bảng lưu cấu hình, phân loại, template, rule hoặc metadata, có thể chọn ghi đè theo bối cảnh nghiệp vụ.

Nếu bảng lưu khách hàng, đơn hàng, ticket, bản ghi phê duyệt, tin nhắn hoặc log, nên tránh ghi đè dữ liệu production.
