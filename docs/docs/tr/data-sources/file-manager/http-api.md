:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# HTTP API

Ek alanları ve dosya koleksiyonları için dosya yüklemeleri HTTP API aracılığıyla yapılabilir. Çağrı yöntemleri, ek veya dosya koleksiyonunun kullandığı depolama motoruna göre farklılık gösterir.

## Sunucu Tarafından Yükleme

S3, OSS ve COS gibi projelerde yerleşik olarak bulunan açık kaynaklı depolama motorları için HTTP API çağrısı, kullanıcı arayüzü yükleme özelliğiyle aynıdır; dosyalar sunucu üzerinden yüklenir. API çağrıları için `Authorization` istek başlığında kullanıcıya özel bir JWT belirteci göndermeniz gerekir, aksi takdirde erişim reddedilecektir.

### Ek Alanı

Ekler kaynağı (`attachments`) üzerinde bir `create` işlemi başlatarak POST isteği gönderin ve ikili içeriği `file` alanı aracılığıyla yükleyin. Çağrıdan sonra dosya, varsayılan depolama motoruna yüklenecektir.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Dosyaları farklı bir depolama motoruna yüklemek isterseniz, `attachmentField` parametresini kullanarak koleksiyon alanında yapılandırılmış depolama motorunu belirtebilirsiniz. Eğer yapılandırılmamışsa, dosya varsayılan depolama motoruna yüklenecektir.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Dosya Koleksiyonu

Bir dosya koleksiyonuna yükleme yapmak otomatik olarak bir dosya kaydı oluşturur. Dosya koleksiyonu kaynağı üzerinde bir `create` işlemi başlatarak POST isteği gönderin ve ikili içeriği `file` alanı aracılığıyla yükleyin.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Bir dosya koleksiyonuna yükleme yaparken depolama motoru belirtmenize gerek yoktur; dosya, o koleksiyon için yapılandırılmış depolama motoruna yüklenecektir.

## İstemci Tarafından Yükleme

Ticari S3-Pro eklentisi aracılığıyla sağlanan S3 uyumlu depolama motorları için HTTP API yüklemesi birkaç adımda gerçekleştirilmelidir.

### Ek Alanı

1.  Depolama motoru bilgilerini alın

    Depolamalar koleksiyonu (`storages`) üzerinde bir `getBasicInfo` işlemi başlatın ve depolama motorunun yapılandırma bilgilerini istemek için depolama adını da ekleyin.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Dönen depolama motoru yapılandırma bilgilerine örnek:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Servis sağlayıcıdan ön imzalı URL'yi alın

    `fileStorageS3` kaynağı üzerinde bir `createPresignedUrl` işlemi başlatarak POST isteği gönderin ve gövdede dosya ile ilgili bilgileri taşıyarak ön imzalı yükleme bilgilerini alın.

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
    > *   `name`: Dosya adı
    > *   `size`: Dosya boyutu (bayt cinsinden)
    > *   `type`: Dosyanın MIME türü. [Yaygın MIME türleri](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types) sayfasına bakabilirsiniz.
    > *   `storageId`: Depolama motorunun kimliği (1. adımda dönen `id` alanı).
    > *   `storageType`: Depolama motorunun türü (1. adımda dönen `type` alanı).
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

3.  Dosyayı yükleyin

    Dönen `putUrl` değerini kullanarak bir `PUT` isteği yapın ve dosyayı gövde olarak yükleyin.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > Not:
    > *   `putUrl`: Önceki adımda dönen `putUrl` alanı.
    > *   `file_path`: Yüklenecek yerel dosyanın yolu.
    >
    > Örnek istek verisi:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Dosya kaydını oluşturun

    Başarılı bir yüklemeden sonra, ekler kaynağı (`attachments`) üzerinde bir `create` işlemi başlatarak POST isteğiyle dosya kaydını oluşturun.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > `data-raw` içindeki bağımlı verilerin açıklaması:
    > *   `title`: Önceki adımda dönen `fileInfo.title` alanı.
    > *   `filename`: Önceki adımda dönen `fileInfo.key` alanı.
    > *   `extname`: Önceki adımda dönen `fileInfo.extname` alanı.
    > *   `path`: Varsayılan olarak boş.
    > *   `size`: Önceki adımda dönen `fileInfo.size` alanı.
    > *   `url`: Varsayılan olarak boş.
    > *   `mimetype`: Önceki adımda dönen `fileInfo.mimetype` alanı.
    > *   `meta`: Önceki adımda dönen `fileInfo.meta` alanı.
    > *   `storageId`: 1. adımda dönen `id` alanı.
    >
    > Örnek istek verisi:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Dosya Koleksiyonu

İlk üç adım, ek alanına yükleme ile aynıdır. Ancak dördüncü adımda, dosya koleksiyonu kaynağı üzerinde bir `create` işlemi başlatarak POST isteğiyle ve gövdede dosya bilgilerini yükleyerek dosya kaydını oluşturmanız gerekir.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> `data-raw` içindeki bağımlı verilerin açıklaması:
> *   `title`: Önceki adımda dönen `fileInfo.title` alanı.
> *   `filename`: Önceki adımda dönen `fileInfo.key` alanı.
> *   `extname`: Önceki adımda dönen `fileInfo.extname` alanı.
> *   `path`: Varsayılan olarak boş.
> *   `size`: Önceki adımda dönen `fileInfo.size` alanı.
> *   `url`: Varsayılan olarak boş.
> *   `mimetype`: Önceki adımda dönen `fileInfo.mimetype` alanı.
> *   `meta`: Önceki adımda dönen `fileInfo.meta` alanı.
> *   `storageId`: 1. adımda dönen `id` alanı.
>
> Örnek istek verisi:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```