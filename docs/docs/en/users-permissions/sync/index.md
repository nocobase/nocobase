---
pkg: '@nocobase/plugin-user-data-sync'
---

# User Data Synchronization

## Introduction

This feature allows you to register and manage user data synchronization sources. By default, an HTTP API is provided, but additional data sources can be supported through plugins. It supports syncing data to the **Users** and **Departments** collections by default, with the possibility to extend synchronization to other target resources using plugins.

## Data Source Management and Synchronization


![](https://static-docs.nocobase.com/202412041043465.png)


:::info
If no plugins providing user data synchronization sources are installed, user data can be synchronized using the HTTP API. Refer to [Data Source - HTTP API](./sources/api.md).
:::

## Adding a Data Source

Once you install a plugin that provides a user data synchronization source, you can add the corresponding data source. Only enabled data sources will display the "Sync" and "Task" buttons.

> Example: WeCom


![](https://static-docs.nocobase.com/202412041053785.png)


## Synchronizing Data

Click the **Sync** button to start synchronizing data.


![](https://static-docs.nocobase.com/202412041055022.png)


Click the **Task** button to view the synchronization status. After successful synchronization, you can view the data in the Users and Departments lists.


![](https://static-docs.nocobase.com/202412041202337.png)


For failed synchronization tasks, you can click **Retry**.


![](https://static-docs.nocobase.com/202412041058337.png)


In case of synchronization failures, you can troubleshoot the issue through system logs. Additionally, raw synchronization records are stored in the `user-data-sync` directory under the application logs folder.


![](https://static-docs.nocobase.com/202412041205655.png)