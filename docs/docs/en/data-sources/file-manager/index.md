---
pkg: "@nocobase/plugin-file-manager"
---

# File Manager

## Introduction

The File Manager plugin provides a file collection, attachment field, and file storage engines for effectively managing files. Files are records in a special type of collection, known as a file collection, which stores file metadata and can be managed through the File Manager. Attachment fields are specific association fields associated with the file collection. The plugin supports multiple storage methods, including local storage, Alibaba Cloud OSS, Amazon S3, and Tencent Cloud COS.

## User Manual

### File Collection

An attachments collection is built-in to store all files associated with attachment fields. Additionally, new file collections can be created to store specific files.

[Learn more in the File Collection documentation](/data-sources/file-manager/file-collection)

### Attachment Field

Attachment fields are specific association fields related to the file collection, which can be created through the "Attachment" field type or configured through an "Association" field.

[Learn more in the Attachment Field documentation](/data-sources/file-manager/field-attachment)

### File Storage Engine

The file storage engine is used to save files to specific services, including local storage (saving to the server's hard drive), cloud storage, etc.

[Learn more in the File Storage Engine documentation](./storage/index.md)

### HTTP API

File uploads can be handled via the HTTP API, see [HTTP API](./http-api.md).

## Development

*