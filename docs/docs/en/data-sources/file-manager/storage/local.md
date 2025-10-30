# Local storage

The uploaded files will be saved in a local directory on the server. Suitable for scenarios small scale or experimental usage, which the quantity of files is finite.

## Options

![Example of file storage engine options](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Hint}
This section only covers the specific options for the local storage engine. For common parameters, please refer to the [General Engine Parameters](./index.md#general-engine-parameters).
:::

### Path

The path represents both the relative path of the file stored on the server and the URL access path. For example, "`user/avatar`" (without the leading and trailing "`/`") represents:

1. The relative path of the uploaded file stored on the server: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. The URL prefix for accessing the file: `http://localhost:13000/storage/uploads/user/avatar`.
