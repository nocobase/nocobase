---
title: 'External NocoBase'
description: 'Connect another NocoBase application as an external data source and learn about configuration, available capabilities, and workflow limitations.'
keywords: 'External NocoBase,NocoBase data source,data source manager,workflow,NocoBase'
---

# External NocoBase

## Introduction

The External NocoBase data source connects another NocoBase application to the current application while preserving metadata from the remote application, including collections, field interfaces, titles, and association fields.

Compared with an external database data source, an external NocoBase data source usually does not require you to configure field interfaces again or manually create association fields. In addition to viewing, creating, editing, and deleting records, it also supports file upload and preview, import and export, chart queries, and some workflow scenarios.

## Add a Data Source

After activating the plugin, add an External NocoBase data source in Data Source Manager and fill in the access information of the remote application.

| Option | Description |
| --- | --- |
| API URL | The full API URL of the remote NocoBase application, such as `https://example.com/api` |
| Origin | The public origin of the remote NocoBase application, such as `https://example.com`. It is mainly used to handle preview URLs for local files in the remote application |
| API key | The credential used by the current application to access the remote NocoBase application |
| Request headers | Additional request headers sent to the remote application, such as space information |
| Timeout | Request timeout for accessing the remote application |

After the data source is enabled, the system loads the collections from the remote application.

![](https://static-docs.nocobase.com/202606101149185.png)

## Permissions

An External NocoBase data source is affected by permissions in both the current application and the remote application.

- In the current application, you can configure access permissions for different collections and fields just like other external data sources.
- In the remote application, data is read and operated according to the permissions of the configured API key.

External NocoBase data sources do not return permission metadata used for fine-grained button visibility on the frontend. As a result, some buttons may not be automatically hidden by permissions in the same way as the main data source. Regardless of whether a button is visible, submitted operations still go through server-side permission checks in the current application, and unauthorized operations are rejected.

:::warning{title=Note}
Prepare a dedicated API key for the External NocoBase data source and grant only the required collection and operation permissions. If a user has permission in the current application but the operation fails, check the permissions of the remote API key.
:::

## Use Collections

After collections are loaded successfully, select this data source in page configuration, block configuration, charts, or workflows to use collections from the remote application.

When the collection structure in the remote application changes, reload the collections in the current application.

## Features

External NocoBase data sources are mainly used to use collections and data from a remote application in the current application. The collection structure, field configuration, and actual data are still maintained by the remote application.

### Collections and Fields

The current application loads metadata from the remote application, including collections, field interfaces, titles, and association fields. Compared with an external database data source, you usually do not need to configure field interfaces again or manually create association fields in the current application.

The current application does not support configuring fields directly for an External NocoBase data source. To add fields, adjust field types, or modify association fields, make the changes in the remote application and then reload the collections in the current application.

### Records and Associated Data

External NocoBase data sources support viewing, creating, editing, and deleting records in page blocks, and also support viewing and maintaining associated data. Operations are initiated by the current application and sent to the remote application through the configured API key.

### Files and Attachments

Files are uploaded to the storage used by the remote application. The current application initiates upload, preview, and download requests, but the files themselves are not stored in the current application.

Origin is mainly used to handle preview URLs for files stored locally by the remote application. If the remote application returns a relative path, the current application uses Origin to complete the file access URL. Origin should be the public access address of the remote NocoBase application, for example:

```text
https://example.com
```

Do not use the API URL as Origin.

### Import and Export

Import and export operations read from or write to the data source through external files, and are proxied to the remote application for execution. The current application handles user operations, forwards requests, and returns download results. The actual data read and write operations are completed by the remote application.

- Import records: the current application receives the uploaded import file and proxies it to the remote application for import.
- Export records: the current application proxies the request to the remote application to export records. In synchronous mode, the record file returned by the remote application is streamed back to the browser for download. In asynchronous mode, a local async task is created, record export is started in the remote application, progress is synchronized to the local task, and the result file is streamed from the remote application when downloaded.
- Export attachments: the current application proxies the request to the remote application to export attachments. In synchronous mode, the attachment archive returned by the remote application is streamed back to the browser for download. In asynchronous mode, a local async task is created, attachment export is started in the remote application, progress is synchronized to the local task, and the attachment archive is streamed from the remote application when downloaded.

### Template Print

Template Print can use records from an External NocoBase data source. Print templates and print action configuration are stored in the current application. When printing, the current application reads remote records and associated data, and generates the print file in the current application.

### Charts

#### Query Panel

External NocoBase data sources can be used in the chart query panel. The current application processes query parameters according to locally configured chart, data source, collection, and field permissions, then requests results from the remote application.

The remote API key must also have access to the corresponding data, otherwise the query fails.

#### SQL Panel

The SQL panel is the SQL query mode in charts and is used only for queries. The current application saves SQL configuration and initiates the call, while the SQL is proxied to the remote application for execution.

When using the SQL panel, the local user must have UI configuration permissions in the current application, and the remote API key must also have UI configuration permissions in the remote application. SQL is not broken down by collection and field permissions like the query panel. Grant UI configuration permissions to local users and the corresponding API key with caution.

### Workflows

External NocoBase data sources may involve workflows in both the current application and the remote application. The current application responds to events in local pages, buttons, and API request chains. After the remote application receives proxied requests, it handles them according to its own workflow configuration.

The current application does not listen to create, update, or delete events that occur inside remote collections. Remote collection events are triggered only in the remote application.

#### Triggers

The following table describes how triggers affected by External NocoBase data sources behave in the current application and the remote application when the corresponding workflow is enabled.

| Trigger | Current application | Remote application | Description |
| --- | --- | --- | --- |
| Pre-action event | Triggered | Triggered only in global mode | Global mode is triggered in the current application, and local mode follows button bindings in the current application. After the remote application receives the proxied request, only global mode is triggered |
| Post-action event | Triggered | Triggered only in global mode | Global mode is triggered in the current application, and local mode follows button bindings in the current application. After the remote application receives the proxied request, only global mode is triggered |
| Custom action event | Triggered | Not triggered | A Trigger workflow button bound in the current application triggers the local workflow. Proxied CRUD requests do not trigger remote custom action events |
| Collection event | Not triggered | Triggered | The actual data changes in the remote application. The current application does not trigger local collection events, while the remote application triggers its own collection events |
| Date field schedule trigger | Not triggered | Triggered | The current application does not trigger based on fields in remote collections. The remote application triggers according to its own date field configuration |

Triggers that do not depend on data sources are triggered in the current application and the remote application according to their own configurations.

To orchestrate workflows that operate on External NocoBase data in the current application, use pre-action events, post-action events, or custom action events. Existing workflows in the remote application run independently in the remote application.

#### Nodes

The following table lists only data-source-related nodes. General nodes such as condition, calculation, loop, and JSON processing do not depend on the data source type and can be used as usual.

| Node | Available | Description |
| --- | --- | --- |
| Query records | Available | Query records in the remote application |
| Create record | Available | Create records in the remote application |
| Update record | Available | Update records in the remote application |
| Delete record | Available | Delete records in the remote application |
| SQL node | Not available | The workflow SQL node supports only database data sources |
| Aggregate node | Not available | The aggregate node supports only database data sources |

## FAQ

### Collections Do Not Appear

Check whether the data source is enabled and whether the API URL and API key are correct. The remote application must also allow the API key to access the corresponding collections.

### Files Upload Successfully but Cannot Be Previewed

If the current application or the remote application uses local file storage, check whether Origin is the public access address of the corresponding application. Origin should not be the API URL.

### The Current Application Has Permission, but the Operation Fails

Check the API key permissions in the remote application. External NocoBase data sources are affected by permissions in both the current application and the remote application.

### Collections Cannot Be Used After a Remote Service Error

If the remote application returns 502, restarts, or is temporarily unavailable, the current application may temporarily fail to read remote collection metadata. After the remote service recovers, the current application automatically reloads metadata the next time this data source's collections are accessed.

### Why Fields Cannot Be Configured in the Current Application

External NocoBase data sources use the collection structure and field configuration from the remote application. Adjust fields in the remote application, then reload the collections in the current application.
