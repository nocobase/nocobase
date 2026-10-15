---
title: 'Data sources'
description: 'Choose an application database and connect existing business databases.'
---

# Data sources

An application can choose its own main database and connect existing databases as external data sources, using their data directly in its pages.

## Application database types

The application uses the corresponding database driver. The default template uses SQLite; other types require their drivers and connection settings.

| Database             | Configuration dialect |
| -------------------- | --------------------- |
| SQLite               | `sqlite`              |
| PostgreSQL           | `postgres`            |
| MySQL and MariaDB    | `mysql`               |
| Microsoft SQL Server | `mssql`               |
| Oracle Database      | `oracle`              |
| Dameng               | `dameng`              |
| KingbaseES           | `kingbase`            |
| OceanBase            | `oceanbase`           |

Confirm supported server versions, deployment platforms, and connectivity when selecting a driver. This table describes configurable types, not drivers already installed. Changing a connection does not automatically migrate existing business data.

## External data sources

When data already exists in another database, connect it as an external data source to read and display its records without entering them again. The main database continues to store the application’s own business data, while the existing system maintains its external data.

### Example: display settlement information from an external data source

This example connects a separate settlement database and displays its billing cycle, credit limit, and settlement status on customer detail pages.

Prepare the database connection information and table structure, then ask the Agent:

```text
Connect Northstar’s existing settlement database as an external data source. Read its data without altering its tables.
Match records by customer identifier and add Settlement details to customer pages, showing billing cycle, credit limit, settlement status, and data source.
Keep reading customer contact information from the main database. Read settlement information directly from the external database without importing it into the main one.
Read connection credentials from server runtime configuration.
```

### View the result

Open Harbor Retail’s customer details. Contact information from the main database appears above Settlement details from the separate database, including a monthly billing cycle and a CNY 80,000 credit limit.

![Customer details displaying settlement information from an external data source](.././assets/northstar-settlement-en.png)

**One page displays main-database customer information and external settlement data together, without duplicate entry.**

:::tip Important notes

- **Define record matching**: this example matches records by customer identifier. Specify the corresponding application and external fields instead of matching by name.
- **Define read and write access**: this example is read-only. For write-back, specify the tables and fields that may be changed.
- **Define who can access the data**: connecting a database does not authorize every user to view its records. Enforce access permissions on the server according to business requirements.
- **A connection does not create synchronization**: this example reads external data when the page opens without copying it into the main database. Synchronization requires an explicit schedule and failure handling.

:::

KingbaseES, Dameng and OceanBase drivers are NocoBase Pro commercial packages requiring the appropriate commercial license and authenticated access to the private package registry. Install the selected package in the application’s production dependencies, then configure its dialect and connection settings. Automatic loading and `config init --dialect` remain supported; explicit registration in `database.drivers` is optional and takes precedence.
