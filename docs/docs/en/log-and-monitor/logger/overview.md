# Server Logs, Audit Logs, and Record History

## Server Logs

### System Logs

> See [System Logs](./index.md#system-logs)

- Record runtime information of the application system, track code execution chains, and trace exceptions or runtime errors.
- Logs are categorized by severity levels and functional modules.
- Output via terminal or stored as files.
- Mainly used to diagnose and troubleshoot system errors during operation.

### Request Logs

> See [Request Logs](./index.md#request-logs)

- Record HTTP API request and response details, focusing on request ID, API path, headers, response status code, and duration.
- Output via terminal or stored as files.
- Mainly used to trace API invocations and execution performance.

## Audit Logs

> See [Audit Logs](/security/audit-logger/index.md)

- Record user (or API) actions on system resources, focusing on resource type, target object, operation type, user information, and operation status.
- To better track what users did and what results were produced, request parameters and responses are stored as metadata.
  This overlaps partially with request logs but is not identical—for example, request logs typically do not include full request bodies.
- Request parameters and responses are **not equivalent** to data snapshots.
  They can reveal what kind of operations occurred but not the exact data before modification, thus cannot be used for version control or restoring data after misoperations.
- Stored as both files and database tables.

![](https://static-docs.nocobase.com/202501031627922.png)

## Record History

> See [Record History](/record-history/index.md)

- Records the **change history** of data content.
- Tracks resource type, resource object, operation type, changed fields, and before/after values.
- Useful for **data comparison and auditing**.
- Stored in database tables.

![](https://static-docs.nocobase.com/202511011338499.png)
