# User Data Sync

## Introduction

Register and manage user data sync sources. By default, an HTTP API is provided, and other data sources can be extended through plugins. It supports syncing data to the **User** and **Department** collections by default, and other sync target resources can also be extended through plugins.

## Data Source Management and Data Sync


![](https://static-docs.nocobase.com/202412041043465.png)


:::info
When a plugin that provides a user data sync source is not installed, you can sync user data via HTTP API. See [Data Source - HTTP API](./sources/api.md).
:::

## Add Data Source

After installing a plugin that provides a user data sync source, you can add the corresponding data source. Only enabled data sources will display the Sync and Tasks buttons.

> Taking WeCom as an example


![](https://static-docs.nocobase.com/202412041053785.png)


## Sync Data

Click the "Sync" button to start data synchronization.


![](https://static-docs.nocobase.com/202412041055022.png)


Click the "Tasks" button to view the sync status. After a successful sync, you can go to the user and department lists to view the data.


![](https://static-docs.nocobase.com/202412041202337.png)


For failed sync tasks, you can click "Retry".


![](https://static-docs.nocobase.com/202412041058337.png)


When a sync fails, you can check the system logs to investigate the cause. At the same time, the original data sync records are saved in the `user-data-sync` directory under the application log directory.


![](https://static-docs.nocobase.com/202412041205655.png)