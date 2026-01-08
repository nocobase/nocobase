---
pkg: "@nocobase/plugin-multi-app-manager"
---

# Multi-app


## Introduction

The **Multi-app plugin** allows you to dynamically create and manage multiple independent applications without separate deployments. Each sub-app is a completely independent instance with its own database, plugins, and configuration.

#### Use Cases
- **Multi-tenancy**: Provide independent application instances, where each customer has their own data, plugin configurations, and permission system.
- **Main and sub-systems for different business domains**: A large system composed of multiple independently deployed smaller applications.


:::warning
The Multi-app plugin itself does not provide user sharing capabilities.  
If you need to share users between multiple apps, you can use it in conjunction with the **[Authentication plugin](/auth-verification)**.
:::


## Installation

In the plugin manager, find the **Multi-app** plugin and enable it.


![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)



## Usage Guide


### Creating a Sub-app

In the system settings menu, click "Multi-app" to enter the multi-app management page:


![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)


Click the "Add New" button to create a new sub-app:


![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)


#### Form Field Descriptions

* **Name**: Sub-app identifier, globally unique.
* **Display Name**: The name of the sub-app displayed in the interface.
* **Startup Mode**:
  * **Start on first visit**: The sub-app starts only when a user accesses it via URL for the first time.
  * **Start with main app**: The sub-app starts at the same time as the main app (this will increase the main app's startup time).
* **Port**: The port number used by the sub-app at runtime.
* **Custom Domain**: Configure an independent subdomain for the sub-app.
* **Pin to menu**: Pin the sub-app entry to the left side of the top navigation bar.
* **Database Connection**: Used to configure the data source for the sub-app, supporting the following three methods:
  * **New database**: Reuse the current data service to create an independent database.
  * **New data connection**: Configure a completely new database service.
  * **Schema mode**: Create an independent schema for the sub-app in PostgreSQL.
* **Upgrade**: If the connected database contains an older version of the NocoBase data structure, it will be automatically upgraded to the current version.


### Starting and Stopping a Sub-app

Click the **Start** button to start the sub-app;  
> If *“Start on first visit”* was checked during creation, it will start automatically on the first visit.  

Click the **View** button to open the sub-app in a new tab.


![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)



### Sub-app Status and Logs

In the list, you can view the memory and CPU usage of each application.


![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)


Click the **Logs** button to view the sub-app's runtime logs.  
> If the sub-app is inaccessible after starting (e.g., due to a corrupted database), you can use the logs to troubleshoot.


![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)



### Deleting a Sub-app

Click the **Delete** button to remove the sub-app.  
> When deleting, you can choose whether to delete the database as well. Please proceed with caution, as this action is irreversible.


### Accessing a Sub-app
By default, sub-apps are accessed using `/_app/:appName/admin/`, for example:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
You can also configure an independent subdomain for the sub-app. You will need to resolve the domain to the current IP, and if you are using Nginx, you also need to add the domain to the Nginx configuration.


### Managing Sub-apps via Command Line

In the project root directory, you can use the command line to manage sub-app instances via **PM2**:

```bash
yarn nocobase pm2 list              # View the list of currently running instances
yarn nocobase pm2 stop [appname]    # Stop a specific sub-app process
yarn nocobase pm2 delete [appname]  # Delete a specific sub-app process
yarn nocobase pm2 kill              # Forcefully terminate all started processes (may include the main app's instance)
```

### Migrating Data from Old Multi-app

Go to the old multi-app management page and click the **Migrate data to new multi-app** button to migrate data.


![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)



## FAQ

#### 1. Plugin Management
Sub-apps can use the same plugins as the main app (including versions), but they can be configured and used independently.

#### 2. Database Isolation
Sub-apps can be configured with independent databases. If you want to share data between apps, you can do so through external data sources.

#### 3. Data Backup and Migration
Currently, data backups in the main app do not include sub-app data (only basic sub-app information). You need to manually back up and migrate data within each sub-app.

#### 4. Deployment and Updates
The version of a sub-app will automatically be upgraded along with the main app, ensuring version consistency between the main and sub-apps.

#### 5. Resource Management
The resource consumption of each sub-app is basically the same as the main app. Currently, a single application uses about 500-600MB of memory.