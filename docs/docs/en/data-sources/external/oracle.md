---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "External data source - Oracle"
description: "Learn how to connect Oracle as an external database in NocoBase, including supported versions, plugin installation, Thin and Thick connection modes, Client directory, permissions, and field mapping."
keywords: "external data source,Oracle,external database,Thin,Thick,Client directory,field mapping,NocoBase"
---

# Oracle

## Introduction

Oracle can be connected to NocoBase as an external database. NocoBase reads tables, fields, and views from Oracle and makes them available as collections in the external data source.

Unlike a [main data source](../main/index.md), the actual schema of an external Oracle database continues to be maintained by the original business system, database client, or migration scripts. NocoBase reads the schema, stores field metadata, and lets you configure blocks, permissions, workflows, and APIs.

| Setting | Description |
| --- | --- |
| Supported version | Oracle >= 11g. |
| Commercial editions | Available in the Enterprise edition. |
| Plugin | `@nocobase/plugin-data-source-external-oracle`. |
| Connection mode | Oracle Database 12.1 and later usually use Thin mode. Versions earlier than 12.1 use Thick mode. |

External Oracle is suitable when you need to:

- Connect an Oracle database used by an existing ERP, MES, WMS, CRM, or other business system
- Build management pages in NocoBase without migrating historical data
- Apply permissions, workflow processing, data corrections, or reporting to existing tables
- Keep the database schema maintained by DBAs, migration scripts, or the original system

:::warning Note

An external Oracle database is not a NocoBase system database. NocoBase does not manage its backups, restores, migrations, or schema changes.

:::

## Plugin installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

When you use Thick mode, install Oracle Client libraries in the NocoBase runtime environment and specify **Client directory** in the data-source settings.

## Install the Oracle client

Oracle Database 12.1 and later usually use Thin mode, which does not require an additional Oracle Client installation. Install Oracle Client libraries in the NocoBase runtime environment only when connecting to a version earlier than Oracle Database 12.1 or when Thick mode is required.

After selecting **Thick** mode in the data-source settings, make sure the machine running the NocoBase service can load Oracle Client.

![Oracle connection mode](https://static-docs.nocobase.com/20241204164359.png)

On Linux, you can install Oracle Instant Client as follows:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

When Oracle Client is not installed in a system-default loadable location, enter the client library directory in **Client directory**. For the installation above, the directory is `/opt/instantclient_19_25`.

![Configure Client directory](https://static-docs.nocobase.com/20241204165940.png)

:::tip Tip

Configure `Client directory` only in Thick mode. Thin mode does not use this setting. For more initialization rules, see the [node-oracledb initialization documentation](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html).

:::

## Add a data source

In **Data source management**, click **Add new**, select Oracle, and then enter the connection details.

![Add an external Oracle data source](https://static-docs.nocobase.com/20241204164359.png)

Common connection settings are as follows:

| Setting | Description |
| --- | --- |
| Data source name | The internal identifier used by blocks, permissions, workflows, and APIs. It cannot be changed after the data source is created. |
| Data source display name | The name displayed in the interface. Use a name that business users can recognize, such as `ERP Oracle` or `Finance database`. |
| Host / Port | The Oracle host address and port. The default port is usually `1521`. |
| ServerName | The Oracle service name configured for the database listener. |
| Username / Password | The account credentials used to connect to Oracle. NocoBase reads tables and views under the Owner of this account; it does not grant access to, or read, objects under other Owners. |
| Connection mode | The Oracle connection mode. Oracle Database 12.1 and later usually use Thin mode. Versions earlier than 12.1 use Thick mode. |
| Client directory | The directory containing Oracle Client libraries for Oracle Thick mode. Configure it only when Thick mode is selected. |
| Table prefix | A table-name prefix. When configured, NocoBase reads only tables and views that match the prefix, and removes the prefix from the generated NocoBase collection names. |
| Collections / Add all collections | Controls the connection scope. With **Add all collections** enabled, NocoBase connects all tables and views in the current Owner and prefix scope. When disabled, it connects only the objects selected in **Collections**. |
| Enabled the data source | Whether to enable the data source. When disabled, its configuration is retained, but blocks, permissions, workflows, and APIs can no longer read its data. |

:::tip Tip

In Oracle, the connection scope is primarily determined by the Owner of the connection account, `Table prefix`, and **Collections**. If an instance contains many objects, connect with a dedicated account for the business schema to prevent unrelated objects from being added to NocoBase.

:::

## Select collections

After entering connection details, click **Load Collections** to read available tables and views from Oracle. The results depend on the Owner of the connection account, `Table prefix`, and **Collections** settings.

By default, **Add all collections** is enabled, which connects all tables and views in the current scope. To connect only selected objects, disable **Add all collections** and select the required tables or views from the list.

![Select external Oracle collections](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning Note

An external data source can connect up to 500 tables or views at a time. When Oracle contains many objects, narrow the scope through the Owner of the connection account, `Table prefix`, or **Collections** first.

:::

## Synchronize and configure fields

The external Oracle schema is maintained in the database. NocoBase does not create fields, change field types, or delete actual fields in the external database.

When the Oracle schema changes, run **Sync from database** from the data source to read collection and field metadata again. Synchronization updates the collections, fields, primary keys, unique keys, and field-type mapping metadata stored in NocoBase. It does not delete actual Oracle tables or data.

After fields are synchronized, you can configure their titles, Field type, and Field interface in NocoBase. NocoBase relationship fields are also stored as relationship metadata in NocoBase and do not automatically add actual foreign-key columns to Oracle tables.

## Field type mapping

NocoBase automatically maps Oracle types to appropriate Field types and Field interfaces. You can adjust the display interface in field settings.

| Oracle type | NocoBase Field type | Available Field interfaces |
| --- | --- | --- |
| `NUMBER` | `integer`, `float`, `boolean`, `bigInt`, `unixTimestamp`, `sort` | Integer, Number, Sort, Checkbox, Switch, Select, Radio group. |
| `BINARY_FLOAT`, `BINARY_DOUBLE`, `FLOAT` | `float` | Number, Percent. |
| `INTEGER`, `SMALLINT`, `PLSQL_INTEGER` | `integer`, `boolean`, `sort` | Integer, Sort, Checkbox, Switch, Select, Radio group. |
| `CHAR`, `NCHAR`, `VARCHAR2`, `NVARCHAR2` | `string`, `uuid`, `nanoid`, `datetimeNoTz` | Input, Email, Phone, Password, Color, Icon, Select, Radio group, UUID, Nano ID. |
| `LONG`, `NCLOB` | `string`, `text` | Input, Textarea, Markdown, Vditor, Rich text. |
| `CLOB` | `string` | Input, Textarea, Rich text. |
| `DATE` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP` | `datetimeNoTz` | Date, Time, Created at, Updated at. |
| `TIMESTAMP WITH TIME ZONE`, `TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date, Time, Created at, Updated at. |
| `ROWID`, `UROWID` | `string`, `text`, `integer` | Input, Textarea, Integer. |
| `JSON` | `json` | JSON. |

:::warning Note

Binary object types such as `BLOB` and `BFILE` are not automatically used as regular file fields. To manage attachments in pages, it is usually better to use a file collection or attachment field in NocoBase to store file metadata.

:::

## Primary key and Record unique key

Collections used for block display and editing should have a primary key or unique field. NocoBase uses the primary key as the Record unique key when available.

For views, tables without a primary key, or composite-primary-key tables, configure **Record unique key** manually in the collection settings. Without a usable identifier, blocks might not view, edit, or delete records correctly.

![Primary key and Record unique key](https://static-docs.nocobase.com/20260709210948.png)
![Configure Record unique key](https://static-docs.nocobase.com/20260709211004.png)

## Related links

- [External databases](./index.md) - General external-database configuration and management.
- [Data source management](../data-source-manager/index.md) - Data-source entry points and management.
- [Collection fields](../data-modeling/collection-fields/index.md) - Field types and field mapping.
- [node-oracledb initialization documentation](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) - How Oracle Client libraries are loaded.
