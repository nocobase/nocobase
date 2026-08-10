# Multi-portal, Multi-app, and Multi-space

NocoBase provides three capabilities: Multi-portal, Multi-app, and Multi-space.

They solve problems at different levels. They can be used independently or together.

## Key differences

| Capability | Multi-portal | Multi-app | Multi-space |
|------|------|------|------|
| What problem it solves | Provides multiple access entries | Splits business into multiple systems | Isolates business data |
| Core focus | Where users enter | How the system is divided | Who the data belongs to |
| Data | Shared | Independent by default | Isolated |
| Pages and menus | Independent | Independent | Shared |
| Plugin configuration | Shared | Independent | Shared |
| User system | Shared | Can be shared through SSO | Shared |
| Typical scenarios | Different roles need different entries | Different businesses need independent management | Multiple organizations, stores, or tenants |
| Can be combined | Yes | Yes | Yes |

## Multi-portal

Multi-portal provides multiple access entries within the same application.

For example:

```text
ERP App

├─ Admin Portal (/v/admin)
├─ Store Portal (/v/store)
├─ Distributor Portal (/v/dealer)
└─ Mobile Portal (/v/mobile)
```

Features:

- Uses the same application
- Shares the same data
- Shares plugin configuration
- Pages and menus can be configured independently

Suitable for scenarios where different roles need different access entries, such as:

- Administrators
- Employees
- Customers
- Distributors

## Multi-app

Multi-app splits business into multiple independent applications.

For example:

```text
Group System

├─ CRM
├─ ERP
├─ OA
└─ Analytics
```

Features:

- Each app is managed independently
- Independent plugin configuration
- Independent database connection
- Independent upgrade and maintenance

Suitable for:

- Splitting large business systems
- Multi-team collaborative development
- Batch creation of apps for SaaS platforms
- Independent apps for different customers

## Multi-space

Multi-space isolates business data within the same application.

For example:

```text
Store Management App

Spaces
├─ Beijing Store
├─ Shanghai Store
└─ Shenzhen Store
```

Features:

- Shared pages
- Shared menus
- Shared workflows
- Shared configuration
- Isolated data

For tables that have a space field enabled, the system automatically filters data according to the current space.

From the user's perspective:

- The Beijing store can only see Beijing store data
- The Shanghai store can only see Shanghai store data
- The Shenzhen store can only see Shenzhen store data

But all stores still use the same system.

## Relationship among the three

These three capabilities do not conflict. They work on different dimensions.

They can be used together:

```text
Group System

CRM App
├─ Admin Portal
├─ Sales Portal
└─ Customer Portal

Spaces
├─ Beijing Branch
├─ Shanghai Branch
└─ Shenzhen Branch
```

Conceptually:

```text
Portal
    ↓
Where users enter the system

App
    ↓
How the system is divided

Space
    ↓
Who the data belongs to
```

## How to choose

If you only want to provide different entries for different roles, choose **Multi-portal**.

If you want to split business into multiple independent systems, choose **Multi-app**.

If you want to isolate data for different organizations or tenants within the same system, choose **Multi-space**.

In real projects, these three capabilities are usually combined rather than used as substitutes for one another.

In one sentence:

> Multi-portal solves entry points, Multi-app solves system splitting, and Multi-space solves data isolation.
