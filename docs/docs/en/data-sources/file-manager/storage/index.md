# Overview

## Built-in Engines

Currently, NocoBase supports the following built-in engine types:

- [Local Storage](./local.md)
- [Amazon S3](./amazon-s3.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Tencent Cloud COS](./tencent-cos.md)

A local storage engine is automatically added during system installation and can be used directly. New engines can also be added or existing engine parameters can be edited.

## Common Engine Parameters

In addition to specific parameters for different engine categories, the following are common parameters:

### Title

The name of the storage engine for human recognition.

### System Name

The system name of the storage engine for system identifying. It must be unique in system-wide. If not provided, it will be generate randomly.

### Access base URL

The prefix part of the URL address accessible to the file externally, which can be the access URL base of a CDN, for example: "`https://cdn.nocobase.com/app`" (without the trailing "`/`").

### Path

The relative path used when storing files. This part will also be automatically concatenated to the final URL when accessed. For example: "`user/avatar`" (without the leading or trailing "`/`").

### File Size Limit

The size limit for uploading files to this storage engine. Files larger than this setting will not be uploaded. The system maximum limit is 1GB.

### Default Storage Engine

When checked, it is set as the default storage engine for the system. Files uploaded in attachment fields or file collections without specifying a storage engine will be saved to the default storage engine. The default storage engine cannot be deleted.

### Keep Files When Destroying Records

When checked, uploaded files in the storage engine will be retained even when the data records in attachment fields or file collections are deleted. By default, files in the storage engine are deleted when records are deleted.

See local storage as an example:

![Example of File Storage Engine Configuration](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Note}
After file upload, the final access path is composed of several parts:

```
<Base URL>/<Path>/<FileName><Extension>
```
For example: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::
