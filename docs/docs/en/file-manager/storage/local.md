# Storage Engine: Local Storage

Uploaded files will be saved in a local directory on the server's hard drive. This is suitable for scenarios with a small total volume of uploaded files managed by the system or for experimental purposes.

## Configuration Parameters


![File storage engine configuration example](https://static-docs.nocobase.com/20240529115151.png)


:::info{title=Note}
This section only introduces parameters specific to the local storage engine. For general parameters, please refer to [General Engine Parameters](./index.md#general-engine-parameters).
:::

### Path

Represents both the relative path for file storage on the server and the URL access path. For example, "`user/avatar`" (without leading or trailing slashes) represents:

1. The relative path on the server where uploaded files are stored: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. The URL prefix for accessing the files: `http://localhost:13000/storage/uploads/user/avatar`.