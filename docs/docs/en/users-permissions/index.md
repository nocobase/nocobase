# Users & Permissions

## Introduction

The Users & Permissions module is a core functional module of NocoBase, providing comprehensive user management, role-based access control, department management, and user data synchronization capabilities. Through this module, you can build a complete user permission system to ensure system security and proper data access control.

## Main Functional Modules

### [User Management](/users-permissions/users/)

Provides basic user model and user management interface, including:
- User creation, editing, and deletion
- User profile management
- Password management and reset
- User status management

### [Roles & Permissions](/users-permissions/acl/)

Flexible and powerful role permission management system:
- Role creation and management
- Role-Based Access Control (RBAC)
- Data permission control
- Menu permission configuration
- API permission management

### [Department Management](/users-permissions/departments/)

Organization structure and department management features:
- Department hierarchy management
- Department member management
- Department-based access control
- Department data isolation

### [User Data Synchronization](/users-permissions/user-data-sync/)

Support for synchronizing user data from external systems:
- Multiple data source support (HTTP API, WeCom, etc.)
- Scheduled synchronization configuration
- Field mapping
- Synchronization logs and monitoring

## Quick Start

1. **Configure User Management**: Go to "Configuration Center" - "User Management" to add and manage system users
2. **Set Role Permissions**: Create roles and assign appropriate permissions in "Roles & Permissions"
3. **Organize Department Structure**: If needed, build organizational structure in "Department Management"
4. **Configure Data Sync**: If you have external user systems, configure user data synchronization

## Extension Development

The Users & Permissions module supports rich extension capabilities:
- [Extending Synchronized Data Sources](/users-permissions/user-data-sync/dev/source)
- [Extending Sync Target Resources](/users-permissions/user-data-sync/dev/resource)
- Custom authentication methods
- Custom permission rules