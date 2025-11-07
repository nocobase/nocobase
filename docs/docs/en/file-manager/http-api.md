# HTTP API

File uploads for both Attachment fields and File collections are supported via the HTTP API. The method of invocation differs depending on the storage engine used by the Attachment field or File collection.

## Server-side Upload

For built-in open-source storage engines in the project, such as S3, OSS, and COS, the HTTP API call is the same as the user interface upload function, and files are uploaded via the server. Calling the API requires passing a user-login-based JWT token through the `Authorization` request header; otherwise, access will be denied.

### Attachment Field

Initiate a `create` action on the attachments resource (`attachments`), send a POST request, and upload the binary content through the `file` field. After the call, the file will be uploaded to the default storage engine.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

To upload a file to a different storage engine, you can use the `attachmentField` parameter to specify the storage engine configured for the collection field (if not configured, it will be uploaded to the default storage engine).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### File Collection

Uploading to a File collection will automatically generate a file record. Initiate a `create` action on the File collection resource, send a POST request, and upload the binary content through the `file` field.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

When uploading to a File collection, there is no need to specify a storage engine; the file will be uploaded to the storage engine configured for that collection.

## Client-side Upload

For S3-compatible storage engines provided through the commercial S3-Pro plugin, the HTTP API upload needs to be called in several steps.

### Attachment Field

1.  Get Storage Engine Information

    Initiate a `getBasicInfo` action on the storages collection (`storages`), carrying the storage name, to request the storage engine's configuration information.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Example of returned storage engine configuration information:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Get Presigned Information from the Service Provider

    Initiate a `createPresignedUrl` action on the `fileStorageS3` resource, send a POST request, and include file-related information in the body to obtain the presigned upload information.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Note:
    > 
    > * name: File name
    > * size: File size (in bytes)
    > * type: The MIME type of the file. You can refer to: [Common MIME types](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: The ID of the storage engine (the `id` field returned in the first step)
    > * storageType: The type of the storage engine (the `type` field returned in the first step)
    > 
    > Example request data:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    The data structure of the obtained presigned information is as follows:

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  File Upload

    Use the returned `putUrl` to initiate a `PUT` request and upload the file as the body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Note:
    > * putUrl: The `putUrl` field returned in the previous step
    > * file_path: The local path of the file to be uploaded
    > 
    > Example request data:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Create File Record

    After a successful upload, initiate a `create` action on the attachments resource (`attachments`) by sending a POST request to create the file record.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Description of dependent data in data-raw:
    > * title: The `fileInfo.title` field returned in the previous step
    > * filename: The `fileInfo.key` field returned in the previous step
    > * extname: The `fileInfo.extname` field returned in the previous step
    > * path: Empty by default
    > * size: The `fileInfo.size` field returned in the previous step
    > * url: Empty by default
    > * mimetype: The `fileInfo.mimetype` field returned in the previous step
    > * meta: The `fileInfo.meta` field returned in the previous step
    > * storageId: The `id` field returned in the first step
    > 
    > Example request data:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### File Collection

The first three steps are the same as for Attachment field uploads, but in the fourth step, you need to create a file record by initiating a create action on the File collection resource, sending a POST request, and uploading the file information via the body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Description of dependent data in data-raw:
> * title: The `fileInfo.title` field returned in the previous step
> * filename: The `fileInfo.key` field returned in the previous step
> * extname: The `fileInfo.extname` field returned in the previous step
> * path: Empty by default
> * size: The `fileInfo.size` field returned in the previous step
> * url: Empty by default
> * mimetype: The `fileInfo.mimetype` field returned in the previous step
> * meta: The `fileInfo.meta` field returned in the previous step
> * storageId: The `id` field returned in the first step
> 
> Example request data:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```