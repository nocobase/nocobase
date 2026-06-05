# HTTP API

File uploads for both attachment fields and file collections can be handled via the HTTP API. The method of invocation differs depending on the storage engine used by the attachment or file collection.

## Server-side Upload

For built-in open-source storage engines like S3, OSS, and COS, the HTTP API call is the same as the one used by the user interface upload feature, where files are uploaded through the server. API calls require a user-based JWT token to be passed in the `Authorization` request header; otherwise, access will be denied.

### Attachment Field

Initiate a `create` action on the attachments resource (`attachments`) by sending a POST request and upload the binary content through the `file` field. After the call, the file will be uploaded to the default storage engine.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

To upload files to a different storage engine, you can use the `attachmentField` parameter to specify the storage engine configured for the collection field. If not configured, the file will be uploaded to the default storage engine.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### File Collection

Uploading to a file collection will automatically generate a file record. Initiate a `create` action on the file collection resource by sending a POST request and upload the binary content through the `file` field.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

When uploading to a file collection, there is no need to specify a storage engine; the file will be uploaded to the storage engine configured for that collection.

## Client-side Upload

For S3-compatible storage engines provided through the commercial S3-Pro plugin, the HTTP API upload requires several steps.

### Attachment Field

1.  Get storage engine information

    Initiate a `getBasicInfo` action on the storages collection (`storages`), including the storage name, to request the storage engine's configuration information.

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

2.  Get the presigned URL from the service provider

    Initiate a `createPresignedUrl` action on the `fileStorageS3` resource by sending a POST request with file-related information in the body to obtain the presigned upload information.

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
    > *   `name`: File name
    > *   `size`: File size (in bytes)
    > *   `type`: The MIME type of the file. You can refer to [Common MIME types](https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: The ID of the storage engine (the `id` field returned in step 1).
    > *   `storageType`: The type of the storage engine (the `type` field returned in step 1).
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

3.  Upload the file

    Use the returned `putUrl` to make a `PUT` request, uploading the file as the body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > Note:
    >
    > *   `putUrl`: The `putUrl` field returned in the previous step.
    > *   `file_path`: The local path of the file to be uploaded.
    >
    > Example request data:
    >
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Create the file record

    After a successful upload, create the file record by initiating a `create` action on the attachments resource (`attachments`) with a POST request.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Explanation of dependent data in `data-raw`:
    >
    > *   `title`: The `fileInfo.title` field returned in the previous step.
    > *   `filename`: The `fileInfo.key` field returned in the previous step.
    > *   `extname`: The `fileInfo.extname` field returned in the previous step.
    > *   `path`: Empty by default.
    > *   `size`: The `fileInfo.size` field returned in the previous step.
    > *   `url`: Empty by default.
    > *   `mimetype`: The `fileInfo.mimetype` field returned in the previous step.
    > *   `meta`: The `fileInfo.meta` field returned in the previous step.
    > *   `storageId`: The `id` field returned in step 1.
    >
    > Example request data:
    >
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### File Collection

The first three steps are the same as for uploading to an attachment field. However, in the fourth step, you need to create the file record by initiating a `create` action on the file collection resource with a POST request, uploading the file information in the body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Explanation of dependent data in `data-raw`:
>
> *   `title`: The `fileInfo.title` field returned in the previous step.
> *   `filename`: The `fileInfo.key` field returned in the previous step.
> *   `extname`: The `fileInfo.extname` field returned in the previous step.
> *   `path`: Empty by default.
> *   `size`: The `fileInfo.size` field returned in the previous step.
> *   `url`: Empty by default.
> *   `mimetype`: The `fileInfo.mimetype` field returned in the previous step.
> *   `meta`: The `fileInfo.meta` field returned in the previous step.
> *   `storageId`: The `id` field returned in step 1.
>
> Example request data:
>
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```