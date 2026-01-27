---
pkg: '@nocobase/plugin-app-supervisor'
---

# Shared-Memory Mode

:::info 🚀 Coming soon
:::

## Introduction

When users want to split business domains at the application level without introducing complex deployment and operations, the shared-memory multi-application mode can be used.

In this mode, multiple applications run within a single NocoBase instance. Each application is independent, can connect to its own database, and can be created, started, or stopped independently. However, they share the same process and memory space, so only one NocoBase instance needs to be maintained.

## User Guide

### Environment Variables

Before using multi-application features, ensure the following environment variables are set when starting NocoBase:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Creating an Application

In **System Settings**, click **App supervisor** to enter the application management page.

![](https://static-docs.nocobase.com/202512291056215.png)

Click **Add** to create a new application.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Configuration Options

| Option                       | Description                                                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application display name** | Name shown in the UI                                                                                                                                                                                                                                     |
| **Application ID**           | Application identifier, globally unique                                                                                                                                                                                                                  |
| **Start mode**               | - Start on first visit: starts when the app is first accessed via URL<br>- Start with main application: starts together with the main app (increases startup time)                                                                                       |
| **Environments**             | In shared-memory mode, only the local environment is available (`local`)                                                                                                                                                                                 |
| **Database**                 | Configures the main data source. Supported options:<br>- New database: reuse the current DB service and create a dedicated database<br>- New connection: connect to another DB service<br>- New schema: when using PostgreSQL, create a dedicated schema |
| **Upgrade**                  | Whether to automatically upgrade existing lower-version NocoBase data to the current version                                                                                                                                                             |
| **JWT Secret**               | Automatically generates an independent JWT secret to isolate sessions from the main app and other apps                                                                                                                                                   |
| **Custom domain**            | Configure a dedicated access domain for the application                                                                                                                                                                                                  |

### Starting an Application

Click **Start** to start the application.

> If _Start on first visit_ was selected during creation, the application will start automatically on first access.

![](https://static-docs.nocobase.com/202512291121065.png)

### Visiting an Application

Click **Visit** to open the application in a new tab.

By default, applications are accessed via `/apps/:appName/admin/`, for example:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

You can also configure a dedicated domain. The domain must resolve to the current IP, and if using Nginx, the domain must be added to the Nginx configuration.

### Stopping an Application

Click **Stop** to stop the application.

![](https://static-docs.nocobase.com/202512291122113.png)

### Application Status

The current status of each application is shown in the list.

![](https://static-docs.nocobase.com/202512291122339.png)

### Deleting an Application

Click **Delete** to remove an application.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

### 1. Plugin Management

Applications can use the same plugins (and versions) as the main application, but plugin configuration and usage are isolated per application.

### 2. Database Isolation

Applications can use independent databases. To share data between applications, use external data sources.

### 3. Data Backup and Migration

Currently, backups created in the main application do not include data from other applications (only basic application metadata). Data must be backed up and migrated separately within each application.

### 4. Deployment and Upgrades

In shared-memory mode, application versions automatically follow the main application, ensuring version consistency.

### 5. Application Sessions

- If an application uses an independent JWT secret, its session is isolated from the main app and other apps. When accessing multiple apps via subpaths under the same domain, tokens stored in LocalStorage require re-login when switching apps. Using separate domains per app is recommended for better session isolation.
- If an application does not use an independent JWT secret, it shares the main application's session. Users can switch between applications in the same browser without re-login. However, this introduces security risks: if user IDs overlap across applications, unauthorized cross-application access may occur.
