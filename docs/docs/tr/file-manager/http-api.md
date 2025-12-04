:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# HTTP API

Ek alanları ve Dosya koleksiyonları için dosya yüklemeleri HTTP API aracılığıyla desteklenir. Çağrı yöntemi, Ek alanı veya Dosya koleksiyonunun kullandığı depolama motoruna göre değişiklik gösterir.

## Sunucu Tarafı Yükleme

S3, OSS ve COS gibi projede yerleşik açık kaynak depolama motorları için HTTP API çağrısı, kullanıcı arayüzü yükleme işleviyle aynıdır ve dosyalar sunucu aracılığıyla yüklenir. API'yi çağırmak için, kullanıcı girişi tabanlı bir JWT belirtecinin `Authorization` istek başlığı aracılığıyla iletilmesi gerekir; aksi takdirde erişim reddedilecektir.

### Ek Alanı

`attachments` kaynağı üzerinde bir `create` işlemi başlatın, bir POST isteği gönderin ve ikili içeriği `file` alanı aracılığıyla yükleyin. Çağrıdan sonra dosya varsayılan depolama motoruna yüklenecektir.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Bir dosyayı farklı bir depolama motoruna yüklemek isterseniz, `attachmentField` parametresini kullanarak koleksiyon alanında yapılandırılmış depolama motorunu belirtebilirsiniz (yapılandırılmamışsa, varsayılan depolama motoruna yüklenecektir).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Dosya koleksiyonu

Bir Dosya koleksiyonuna yükleme, otomatik olarak bir dosya kaydı oluşturacaktır. Dosya koleksiyonu kaynağı üzerinde bir `create` işlemi başlatın, bir POST isteği gönderin ve ikili içeriği `file` alanı aracılığıyla yükleyin.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Bir Dosya koleksiyonuna yükleme yaparken, bir depolama motoru belirtmenize gerek yoktur; dosya, o koleksiyon için yapılandırılmış depolama motoruna yüklenecektir.

## İstemci Tarafı Yükleme

Ticari S3-Pro eklentisi aracılığıyla sağlanan S3 uyumlu depolama motorları için HTTP API yüklemesinin birkaç adımda çağrılması gerekir.

### Ek Alanı

1.  Depolama Motoru Bilgilerini Alın

    `storages` koleksiyonu (`storages`) üzerinde bir `getBasicInfo` işlemi başlatın, depolama adını (storage name) da ekleyerek depolama motorunun yapılandırma bilgilerini isteyin.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Dönen depolama motoru yapılandırma bilgisi örneği:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Servis Sağlayıcıdan Ön İmzalı Bilgileri Alın

    `fileStorageS3` kaynağı üzerinde bir `createPresignedUrl` işlemi başlatın, bir POST isteği gönderin ve ön imzalı yükleme bilgilerini almak için gövdeye dosya ile ilgili bilgileri ekleyin.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Not:
    >
    > * name: Dosya adı
    > * size: Dosya boyutu (bayt cinsinden)
    > * type: Dosyanın MIME türü. Şuraya başvurabilirsiniz: [Yaygın MIME türleri](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: Depolama motorunun kimliği (ilk adımda dönen `id` alanı)
    > * storageType: Depolama motorunun türü (ilk adımda dönen `type` alanı)
    >
    > Örnek istek verisi:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    Alınan ön imzalı bilgilerin veri yapısı aşağıdaki gibidir:

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

3.  Dosya Yükleme

    Dönen `putUrl` değerini kullanarak bir `PUT` isteği başlatın ve dosyayı gövde olarak yükleyin.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Not:
    > * putUrl: Önceki adımda dönen `putUrl` alanı
    > * file_path: Yüklenecek yerel dosya yolu
    >
    > Örnek istek verisi:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Dosya Kaydı Oluşturun

    Başarılı bir yüklemeden sonra, `attachments` kaynağı üzerinde bir `create` işlemi başlatarak, bir POST isteği göndererek dosya kaydını oluşturun.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > data-raw içindeki bağımlı verilerin açıklaması:
    > * title: Önceki adımda dönen `fileInfo.title` alanı
    > * filename: Önceki adımda dönen `fileInfo.key` alanı
    > * extname: Önceki adımda dönen `fileInfo.extname` alanı
    > * path: Varsayılan olarak boş
    > * size: Önceki adımda dönen `fileInfo.size` alanı
    > * url: Varsayılan olarak boş
    > * mimetype: Önceki adımda dönen `fileInfo.mimetype` alanı
    > * meta: Önceki adımda dönen `fileInfo.meta` alanı
    > * storageId: İlk adımda dönen `id` alanı
    >
    > Örnek istek verisi:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Dosya koleksiyonu

İlk üç adım, Ek alanı yüklemeleriyle aynıdır, ancak dördüncü adımda, Dosya koleksiyonu kaynağı üzerinde bir `create` işlemi başlatarak, bir POST isteği göndererek ve dosya bilgilerini gövde aracılığıyla yükleyerek bir dosya kaydı oluşturmanız gerekir.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> data-raw içindeki bağımlı verilerin açıklaması:
> * title: Önceki adımda dönen `fileInfo.title` alanı
> * filename: Önceki adımda dönen `fileInfo.key` alanı
> * extname: Önceki adımda dönen `fileInfo.extname` alanı
> * path: Varsayılan olarak boş
> * size: Önceki adımda dönen `fileInfo.size` alanı
> * url: Varsayılan olarak boş
> * mimetype: Önceki adımda dönen `fileInfo.mimetype` alanı
> * meta: Önceki adımda dönen `fileInfo.meta` alanı
> * storageId: İlk adımda dönen `id` alanı
>
> Örnek istek verisi:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```