# File Manager

<PluginInfo name="file-manager"></PluginInfo>

## Introduction

The File Manager plugin provides a file collection, attachment field, and file storage services for effectively managing files. Files are structured data table records known as file collection, which store file metadata and can be managed through the File Manager. Attachment fields are specific relational fields associated with the file collection. The plugin supports multiple storage methods, including local storage, Alibaba Cloud OSS, Amazon S3, and Tencent Cloud COS.

## User Manual

### File Collection

An attachments collection is built-in to store all files associated with attachment fields. Additionally, new file collections can be created to store specific files.

[More usage information can be found in the file table introduction document](/data-sources/file-manager/file-collection)

### Attachment Field

Attachment fields are specific relational fields related to the file collection, which can be created through "Attachment field" or configured through "Association field".

[More usage information can be found in the attachment field introduction document](/data-sources/file-manager/field-attachment)

### File Storage

The file storage engine is used to save files to specific services, including local storage (saving to the server's hard drive), cloud storage, etc.

[More usage information can be found in the file storage introduction document](./storage/index.md)

### HTTP API

Files can be uploaded through the HTTP API, refer to [HTTP API](./http-api.md).

## Development

* 
