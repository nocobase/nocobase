:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# HTTP API

첨부 파일 필드와 파일 컬렉션 모두 HTTP API를 통한 파일 업로드를 지원합니다. 첨부 파일 필드 또는 파일 컬렉션에서 사용하는 스토리지 엔진에 따라 호출 방식이 달라집니다.

## 서버 측 업로드

S3, OSS, COS 등 프로젝트에 내장된 오픈 소스 스토리지 엔진의 경우, HTTP API 호출은 사용자 인터페이스의 업로드 기능과 동일하게 작동하며 파일은 모두 서버를 통해 업로드됩니다. API를 호출하려면 사용자 로그인 기반의 JWT 토큰을 `Authorization` 요청 헤더에 전달해야 합니다. 그렇지 않으면 접근이 거부됩니다.

### 첨부 파일 필드

`attachments` 리소스에 `create` 작업을 요청하여 POST 요청을 보내고, `file` 필드를 통해 바이너리 콘텐츠를 업로드합니다. 호출 후 파일은 기본 스토리지 엔진에 업로드됩니다.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

파일을 다른 스토리지 엔진에 업로드하려면 `attachmentField` 파라미터를 사용하여 해당 컬렉션 필드에 구성된 스토리지 엔진을 지정할 수 있습니다(구성되지 않은 경우 기본 스토리지 엔진에 업로드됩니다).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### 파일 컬렉션

파일 컬렉션에 업로드하면 파일 레코드가 자동으로 생성됩니다. 파일 컬렉션 리소스에 `create` 작업을 요청하여 POST 요청을 보내고, `file` 필드를 통해 바이너리 콘텐츠를 업로드합니다.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

파일 컬렉션에 업로드할 때는 스토리지 엔진을 지정할 필요가 없습니다. 파일은 해당 컬렉션에 구성된 스토리지 엔진에 업로드됩니다.

## 클라이언트 측 업로드

상용 플러그인 S3-Pro를 통해 제공되는 S3 호환 스토리지 엔진의 경우, HTTP API 업로드는 여러 단계로 나누어 호출해야 합니다.

### 첨부 파일 필드

1.  스토리지 엔진 정보 가져오기

    `storages` 컬렉션에 `getBasicInfo` 작업을 요청하고, 스토리지 이름(storage name)을 함께 전달하여 스토리지 엔진의 구성 정보를 요청합니다.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    반환되는 스토리지 엔진 구성 정보 예시:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  서비스 제공자의 사전 서명 정보 가져오기

    `fileStorageS3` 리소스에 `createPresignedUrl` 작업을 요청하고, POST 요청을 보내며 body에 파일 관련 정보를 포함하여 사전 서명된 업로드 정보를 가져옵니다.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > 참고:
    > 
    > * name: 파일 이름
    > * size: 파일 크기(바이트 단위)
    > * type: 파일의 MIME 타입입니다. 다음을 참조하세요: [일반적인 MIME 타입](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: 스토리지 엔진의 ID (첫 번째 단계에서 반환된 `id` 필드)
    > * storageType: 스토리지 엔진 타입 (첫 번째 단계에서 반환된 `type` 필드)
    > 
    > 요청 데이터 예시:
    > 
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    가져온 사전 서명 정보의 데이터 구조는 다음과 같습니다.

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

3.  파일 업로드

    반환된 `putUrl`을 사용하여 `PUT` 요청을 보내고, 파일을 body로 업로드합니다.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > 참고:
    > * putUrl: 이전 단계에서 반환된 `putUrl` 필드
    > * file_path: 업로드할 로컬 파일 경로
    > 
    > 요청 데이터 예시:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  파일 레코드 생성

    업로드가 성공하면 `attachments` 리소스에 `create` 작업을 요청하여 POST 요청을 보내 파일 레코드를 생성합니다.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > data-raw의 의존성 데이터 설명:
    > * title: 이전 단계에서 반환된 `fileInfo.title` 필드
    > * filename: 이전 단계에서 반환된 `fileInfo.key` 필드
    > * extname: 이전 단계에서 반환된 `fileInfo.extname` 필드
    > * path: 기본적으로 비어 있습니다.
    > * size: 이전 단계에서 반환된 `fileInfo.size` 필드
    > * url: 기본적으로 비어 있습니다.
    > * mimetype: 이전 단계에서 반환된 `fileInfo.mimetype` 필드
    > * meta: 이전 단계에서 반환된 `fileInfo.meta` 필드
    > * storageId: 첫 번째 단계에서 반환된 `id` 필드
    > 
    > 요청 데이터 예시:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### 파일 컬렉션

첫 세 단계는 첨부 파일 필드 업로드와 동일합니다. 하지만 네 번째 단계에서는 파일 컬렉션 리소스에 `create` 작업을 요청하여 POST 요청을 보내고, body를 통해 파일 정보를 업로드하여 파일 레코드를 생성해야 합니다.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> data-raw의 의존성 데이터 설명:
> * title: 이전 단계에서 반환된 `fileInfo.title` 필드
> * filename: 이전 단계에서 반환된 `fileInfo.key` 필드
> * extname: 이전 단계에서 반환된 `fileInfo.extname` 필드
> * path: 기본적으로 비어 있습니다.
> * size: 이전 단계에서 반환된 `fileInfo.size` 필드
> * url: 기본적으로 비어 있습니다.
> * mimetype: 이전 단계에서 반환된 `fileInfo.mimetype` 필드
> * meta: 이전 단계에서 반환된 `fileInfo.meta` 필드
> * storageId: 첫 번째 단계에서 반환된 `id` 필드
> 
> 요청 데이터 예시:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```