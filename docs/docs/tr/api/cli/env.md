:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Ortam Değişkenleri

## TZ

Uygulamanın saat dilimini ayarlamak için kullanılır, varsayılan olarak işletim sisteminin saat dilimidir.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Zamanla ilgili işlemler bu saat dilimine göre işlenecektir. TZ değerini değiştirmek, veritabanındaki tarih değerlerini etkileyebilir. Ayrıntılar için '[Tarih ve Saat Genel Bakışı](#)' bölümüne bakınız.
:::

## APP_ENV

Uygulama ortamı, varsayılan değeri `development`'tır. Seçenekler şunlardır:

- `production` - Üretim ortamı
- `development` - Geliştirme ortamı

```bash
APP_ENV=production
```

## APP_KEY

Uygulamanın gizli anahtarıdır; kullanıcı token'ları oluşturmak gibi amaçlarla kullanılır. Kendi uygulama anahtarınızla değiştirin ve dışarıya sızdırılmadığından emin olun.

:::warning
APP_KEY değiştirilirse, eski token'lar da geçersiz hale gelecektir.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Uygulama portu, varsayılan değeri `13000`'dir.

```bash
APP_PORT=13000
```

## API_BASE_PATH

NocoBase API adres öneki, varsayılan değeri `/api/`'dir.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Çok çekirdekli (küme) başlatma modudur. Bu değişken yapılandırılırsa, `pm2 start` komutuna `-i <instances>` parametresi olarak iletilir. Seçenekler pm2 `-i` parametresiyle tutarlıdır (bkz. [PM2: Küme Modu](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) ve şunları içerir:

- `max`: CPU'nun maksimum çekirdek sayısını kullanır
- `-1`: CPU'nun maksimum çekirdek sayısının 1 eksiğini kullanır
- `<number>`: Belirli bir çekirdek sayısını belirtir

Varsayılan değeri boştur, bu da etkinleştirilmediği anlamına gelir.

:::warning{title="Dikkat"}
Bu modun küme moduyla ilgili eklentilerle birlikte kullanılması gerekir, aksi takdirde uygulamanın işlevselliğinde anormallikler ortaya çıkabilir.
:::

Daha fazla bilgi için: [Küme Modu](#).

## PLUGIN_PACKAGE_PREFIX

Eklenti paket adı öneki, varsayılan olarak: `@nocobase/plugin-,@nocobase/preset-` şeklindedir.

Örneğin, `hello` eklentisini `my-nocobase-app` projesine eklemek için, eklentinin tam paket adı `@my-nocobase-app/plugin-hello` olacaktır.

PLUGIN_PACKAGE_PREFIX şu şekilde yapılandırılabilir:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Bu durumda eklenti adları ve paket adları arasındaki eşleşme aşağıdaki gibidir:

- `users` eklentisinin paket adı `@nocobase/plugin-users`
- `nocobase` eklentisinin paket adı `@nocobase/preset-nocobase`
- `hello` eklentisinin paket adı `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Veritabanı türü, seçenekler şunlardır:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Veritabanı ana bilgisayarı (MySQL veya PostgreSQL veritabanı kullanırken yapılandırılması gerekir).

Varsayılan değeri `localhost`'tur.

```bash
DB_HOST=localhost
```

## DB_PORT

Veritabanı portu (MySQL veya PostgreSQL veritabanı kullanırken yapılandırılması gerekir).

- MySQL, MariaDB varsayılan portu 3306
- PostgreSQL varsayılan portu 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Veritabanı adı (MySQL veya PostgreSQL veritabanı kullanırken yapılandırılması gerekir).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Veritabanı kullanıcısı (MySQL veya PostgreSQL veritabanı kullanırken yapılandırılması gerekir).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Veritabanı parolası (MySQL veya PostgreSQL veritabanı kullanırken yapılandırılması gerekir).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Tablo öneki.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Veritabanı tablo adlarının ve alan adlarının `snake_case` stiline dönüştürülüp dönüştürülmeyeceği, varsayılan olarak `false`'tur. MySQL (MariaDB) veritabanı kullanıyorsanız ve `lower_case_table_names=1` ise, DB_UNDERSCORED değeri `true` olmalıdır.

:::warning
`DB_UNDERSCORED=true` olduğunda, veritabanındaki gerçek tablo ve alan adları arayüzde görünenlerle tutarlı olmayacaktır. Örneğin, `orderDetails` veritabanında `order_details` olarak yer alacaktır.
:::

## DB_LOGGING

Veritabanı günlükleme anahtarı, varsayılan değeri `off`'tur. Seçenekler şunlardır:

- `on` - Açık
- `off` - Kapalı

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Günlük çıktı taşıyıcısı, birden fazla değer `,` ile ayrılır. Geliştirme ortamında varsayılan değeri `console`, üretim ortamında ise `console,dailyRotateFile`'dır. Seçenekler:

- `console` - `console.log`
- `file` - `Dosya`
- `dailyRotateFile` - `Günlük dönen dosya`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Dosya tabanlı günlük depolama yolu, varsayılan olarak `storage/logs`'tur.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Çıktı günlük seviyesi. Geliştirme ortamında varsayılan değeri `debug`, üretim ortamında ise `info`'dur. Seçenekler:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Veritabanı günlük çıktı seviyesi `debug`'dır ve çıktısı `DB_LOGGING` tarafından kontrol edilir, `LOGGER_LEVEL`'den etkilenmez.

## LOGGER_MAX_FILES

Saklanacak maksimum günlük dosyası sayısı.

- `LOGGER_TRANSPORT` `file` olduğunda, varsayılan değer `10`'dur.
- `LOGGER_TRANSPORT` `dailyRotateFile` olduğunda, gün sayısını belirtmek için `[n]d` kullanılır. Varsayılan değer `14d`'dir.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Günlükleri boyuta göre döndürür.

- `LOGGER_TRANSPORT` `file` olduğunda, birim `bayt`'tır ve varsayılan değer `20971520 (20 * 1024 * 1024)`'dir.
- `LOGGER_TRANSPORT` `dailyRotateFile` olduğunda, `[n]k`, `[n]m`, `[n]g` kullanılabilir. Varsayılan olarak yapılandırılmaz.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Günlük yazdırma formatı. Geliştirme ortamında varsayılan `console`, üretim ortamında ise `json`'dır. Seçenekler:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Bakınız: [Günlük Formatı](#)

## CACHE_DEFAULT_STORE

Kullanılacak önbellek depolama yönteminin benzersiz tanımlayıcısıdır, sunucu tarafı varsayılan önbellek depolama yöntemini belirtir. Varsayılan değeri `memory`'dir. Dahili seçenekler:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Bellek önbelleğindeki maksimum öğe sayısı, varsayılan değeri `2000`'dir.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis bağlantısı, isteğe bağlıdır. Örnek: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Telemetri veri toplamasını etkinleştirir, varsayılan olarak `off`'tur.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Etkinleştirilen izleme metrik okuyucuları, varsayılan olarak `console`'dır. Diğer değerler, ilgili okuyucu eklentilerinin kayıtlı adlarına (örneğin `prometheus`) başvurmalıdır. Birden fazla değer `,` ile ayrılır.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Etkinleştirilen izleme veri işlemcileri, varsayılan olarak `console`'dır. Diğer değerler, ilgili işlemci eklentilerinin kayıtlı adlarına başvurmalıdır. Birden fazla değer `,` ile ayrılır.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```