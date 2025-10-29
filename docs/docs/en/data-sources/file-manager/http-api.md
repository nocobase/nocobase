# HTTP API

附件字段和文件表的文件上传均支持通过 HTTP API 进行处理。根据附件或文件表使用的存储引擎不同，分别有不同的调用方式。

## 服务端上传

针对 S3、OSS、COS 等项目中内置的开源存储引擎，HTTP API 与用户界面上传功能调用的相同，文件均通过服务端上传。调用接口需要通过 `Authorization` 请求头传递基于用户登录的 JWT 令牌，否则将被拒绝访问。

### 附件字段

通过对附件表（`attachments`）资源发起 `create` 操作，以 POST 形式发送请求，并通过 `file` 字段上传二进制内容。调用后文件会被上传至默认的存储引擎中。

```shell
curl -X POST\
    -H "Authorization: Bearer <JWT>"\
    -F "file=@<path/to/file>"\
    "http://localhost:3000/api/attachments:create"
```

如需将文件上传至不同的存储引擎，可以通过 `attachmentField` 参数指定所属数据表字段已配置的存储引擎（如未配置，则上传至默认存储引擎）。

```shell
curl -X POST\
    -H "Authorization: Bearer <JWT>"\
    -F "file=@<path/to/file>"\
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### 文件表

对文件表上传将自动生成文件记录，通过对文件表资源发起 `create` 操作，以 POST 形式发送请求，并通过 `file` 字段上传二进制内容。

```shell
curl -X POST\
    -H "Authorization: Bearer <JWT>"\
    -F "file=@<path/to/file>"\
    "http://localhost:3000/api/<file_collection_name>:create"
```

对文件表上传无需指定存储引擎，文件会被上传至该表配置的存储引擎中。

## 客户端上传

针对通过商业插件 S3-Pro 提供的 S3 兼容性的存储引擎，HTTP API 上传需要分为几个步骤进行调用。

### 附件字段

1.  获取存储引擎信息

    对存储表（`storages`）发起 `getBasicInfo` 操作，同时携带存储空间标识（storage name），请求存储引擎的配置信息

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    返回的存储引擎配置信息示例：

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  获取服务商的预签名信息

    对 `fileStorageS3` 资源发起 `createPresignedUrl` 操作，以 POST 形式发送请求，并在 body 中携带文件相关信息，获取到预签名上传信息

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > 说明：
    > 
    > * name: 文件名
    > * size: 文件大小（以 bytes 为单位）
    > * type: 文件的 MIME 类型，可以参考：[常见 MIME 类型](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: 存储引擎的id（第一步中返回的 `id` 字段）
    > * storageType: 存储引擎类型（第一步中返回的 `type` 字段）
    > 
    > 示例请求数据：
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    获取到的预签名信息数据结构如下

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

3.  文件上传

    使用返回的 `putUrl` 发起 `PUT` 请求，将文件作为 body 上传。

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > 说明：
    > * putUrl：上一步返回的 `putUrl` 字段
    > * file_path：需上传的本地文件路径
    > 
    > 示例请求数据：
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  创建文件行记录

    上传成功后，通过对附件表（`attachments`）资源发起 `create` 操作，以 POST 形式发送请求，创建文件记录。

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > data-raw 中依赖数据说明：
    > * title: 上一步返回的 `fileInfo.title` 字段
    > * filename: 上一步返回的 `fileInfo.key` 字段
    > * extname: 上一步返回的 `fileInfo.extname` 字段
    > * path: 默认为空
    > * size: 上一步返回的 `fileInfo.size` 字段
    > * url: 默认为空
    > * mimetype: 上一步返回的 `fileInfo.mimetype` 字段
    > * meta: 上一步返回的 `fileInfo.meta` 字段
    > * storageId: 第一步返回的 `id` 字段
    > 
    > 示例请求数据：
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### 文件表

前三步操作与附件字段上传相同，但在第四步需要创建文件记录，通过对文件表资源发起 create 操作，以 POST 形式发送请求，并通过 body 上传文件信息。

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> data-raw 中依赖数据说明：
> * title: 上一步返回的 `fileInfo.title` 字段
> * filename: 上一步返回的 `fileInfo.key` 字段
> * extname: 上一步返回的 `fileInfo.extname` 字段
> * path: 默认为空
> * size: 上一步返回的 `fileInfo.size` 字段
> * url: 默认为空
> * mimetype: 上一步返回的 `fileInfo.mimetype` 字段
> * meta: 上一步返回的 `fileInfo.meta` 字段
> * storageId: 第一步返回的 `id` 字段
> 
> 示例请求数据：
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```