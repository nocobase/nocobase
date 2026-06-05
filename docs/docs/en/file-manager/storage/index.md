# Overview

## Introduction

Storage engines are used to save files to specific services, including local storage (saved to the server's hard drive), cloud storage, etc.

Before uploading any files, you need to configure a storage engine. The system automatically adds a local storage engine during installation, which can be used directly. You can also add new engines or edit the parameters of existing ones.

## Storage Engine Types

Currently, NocoBase has built-in support for the following engine types:

- [Local Storage](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

The system automatically adds a local storage engine during installation, which can be used directly. You can also add new engines or edit the parameters of existing ones.

## Common Parameters

In addition to the specific parameters for different engine types, the following are common parameters (using local storage as an example):


![Example of file storage engine configuration](https://static-docs.nocobase.com/20240529115151.png)


### Title

The name of the storage engine, for human identification.

### System Name

The system name of the storage engine, used for system identification. It must be unique within the system. If left blank, the system will automatically generate a random one.

### Public URL prefix

The prefix part of the publicly accessible URL for the file. It can be the base URL of a CDN, such as: "`https://cdn.nocobase.com/app`" (no trailing "/").

### Path

The relative path used when storing files. This part will also be automatically appended to the final URL during access. For example: "`user/avatar`" (no leading or trailing "/").

### File size limit

The size limit for files uploaded to this storage engine. Files exceeding this size cannot be uploaded. The system default limit is 20MB, and it can be adjusted up to a maximum of 1GB.

### File types

You can restrict the types of files that can be uploaded, using the [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) syntax. For example: `image/*` represents image files. Multiple types can be separated by commas, such as: `image/*, application/pdf` which allows image and PDF files.

### Default storage engine

When checked, this is set as the system's default storage engine. When an attachment field or file collection does not specify a storage engine, uploaded files will be saved to the default storage engine. The default storage engine cannot be deleted.

### Keep file when record is deleted

When checked, the uploaded file in the storage engine will be kept even when the data record in the attachment or file collection is deleted. By default, this is not checked, meaning the file in the storage engine will be deleted along with the record.

:::info{title=Tip}
After a file is uploaded, the final access path is constructed by concatenating several parts:

```
<Public URL prefix>/<Path>/<Filename><Extension>
```

For example: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::