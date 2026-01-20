:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Ortam Değişkenleri

## Ortam Değişkenleri Nasıl Ayarlanır?

### Git Kaynak Kodu veya `create-nocobase-app` Kurulum Yöntemi

Ortam değişkenlerini projenin kök dizinindeki `.env` dosyasında ayarlayabilirsiniz. Ortam değişkenlerini değiştirdikten sonra, uygulama sürecini sonlandırmanız ve yeniden başlatmanız gerekir.

### Docker Kurulum Yöntemi

`docker-compose.yml` yapılandırmasını düzenleyerek `environment` parametresinde ortam değişkenlerini ayarlayabilirsiniz. Örnek:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Alternatif olarak, `.env` dosyasında ortam değişkenlerini ayarlamak için `env_file` kullanabilirsiniz. Örnek:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Ortam değişkenlerini değiştirdikten sonra, uygulama kapsayıcısını yeniden oluşturmanız gerekir:

```yml
docker compose up -d app
```

## Global Ortam Değişkenleri

### TZ

Uygulamanın saat dilimini ayarlamak için kullanılır, varsayılan olarak sistemin saat dilimi kullanılır.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Zamanla ilgili işlemler bu saat dilimine göre işlenecektir. TZ değerini değiştirmek, veritabanındaki tarih değerlerini etkileyebilir. Daha fazla ayrıntı için "[Tarih ve Saat Genel Bakışı](/data-sources/data-modeling/collection-fields/datetime)" bölümüne bakınız.
:::

### APP_ENV

Uygulama ortamı, varsayılan değer `development`'tır. Seçenekler şunlardır:

- `production` üretim ortamı
- `development` geliştirme ortamı

```bash
APP_ENV=production
```

### APP_KEY

Uygulamanın gizli anahtarıdır, kullanıcı token'ları oluşturmak gibi amaçlarla kullanılır. Kendi uygulama anahtarınızla değiştirin ve dışarıya sızdırılmadığından emin olun.

:::warning
APP_KEY değiştirilirse, eski token'lar da geçersiz hale gelecektir.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Uygulama portu, varsayılan değer `13000`'dir.

```bash
APP_PORT=13000
```

### API_BASE_PATH

NocoBase API adres öneki, varsayılan değer `/api/`'dir.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Uygulamayı çok çekirdekli (küme) modunda başlatmak için kullanılır. Bu değişken yapılandırılırsa, `pm2 start` komutuna `-i <instances>` parametresi olarak iletilir. Seçenekler, pm2 `-i` parametresiyle tutarlıdır (bkz. [PM2: Küme Modu](https://pm2.keymetrics.io/docs/usage/cluster-mode/)) ve şunları içerir:

- `max`: Maksimum CPU çekirdek sayısını kullanır
- `-1`: Maksimum CPU çekirdek sayısının bir eksiğini kullanır
- `<number>`: Belirli bir çekirdek sayısını belirtir

Varsayılan değer boştur, bu da etkinleştirilmediği anlamına gelir.

:::warning{title="Dikkat"}
Bu mod, küme moduyla ilgili eklentilerin kullanımını gerektirir. Aksi takdirde, uygulamanın işlevselliğinde beklenmedik sorunlar ortaya çıkabilir.
:::

Daha fazla bilgi için: [Küme Modu](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Eklenti paket öneki, varsayılan olarak `@nocobase/plugin-,@nocobase/preset-` şeklindedir.

Örneğin, `hello` eklentisini `my-nocobase-app` projesine eklemek için, eklentinin tam paket adı `@my-nocobase-app/plugin-hello` olacaktır.

PLUGIN_PACKAGE_PREFIX şu şekilde yapılandırılabilir:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Eklenti adı ve paket adı arasındaki ilişki aşağıdaki gibidir:

- `users` eklentisinin paket adı `@nocobase/plugin-users`'tır
- `nocobase` eklentisinin paket adı `@nocobase/preset-nocobase`'dir
- `hello` eklentisinin paket adı `@my-nocobase-app/plugin-hello`'dur

### DB_DIALECT

Veritabanı türü, seçenekler şunlardır:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Veritabanı ana bilgisayarı (MySQL veya PostgreSQL veritabanları kullanılırken yapılandırılması gerekir).

Varsayılan değer `localhost`'tur.

```bash
DB_HOST=localhost
```

### DB_PORT

Veritabanı portu (MySQL veya PostgreSQL veritabanları kullanılırken yapılandırılması gerekir).

- MySQL ve MariaDB için varsayılan port 3306'dır
- PostgreSQL için varsayılan port 5432'dir

```bash
DB_PORT=3306
```

### DB_DATABASE

Veritabanı adı (MySQL veya PostgreSQL veritabanları kullanılırken yapılandırılması gerekir).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Veritabanı kullanıcısı (MySQL veya PostgreSQL veritabanları kullanılırken yapılandırılması gerekir).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Veritabanı parolası (MySQL veya PostgreSQL veritabanları kullanılırken yapılandırılması gerekir).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Veri tablosu öneki.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Veritabanı tablo ve alan adlarının snake case stiline dönüştürülüp dönüştürülmeyeceğini belirtir, varsayılan değer `false`'tur. MySQL (MariaDB) veritabanı kullanıyorsanız ve `lower_case_table_names=1` ise, DB_UNDERSCORED mutlaka `true` olarak ayarlanmalıdır.

:::warning
`DB_UNDERSCORED=true` olduğunda, veritabanındaki gerçek tablo ve alan adları arayüzde görünenlerle eşleşmeyecektir. Örneğin, `orderDetails` veritabanında `order_details` olarak saklanacaktır.
:::

### DB_LOGGING

Veritabanı günlük kaydı anahtarı, varsayılan değer `off`'tur. Seçenekler şunlardır:

- `on` açık
- `off` kapalı

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Veritabanı bağlantı havuzundaki maksimum bağlantı sayısı, varsayılan değer `5`'tir.

### DB_POOL_MIN

Veritabanı bağlantı havuzundaki minimum bağlantı sayısı, varsayılan değer `0`'dır.

### DB_POOL_IDLE

Bir bağlantının serbest bırakılmadan önce boşta kalabileceği maksimum süre (milisaniye cinsinden), varsayılan değer `10000` (10 saniye)'dir.

### DB_POOL_ACQUIRE

Havuzun bir hata vermeden önce bağlantı almaya çalışacağı maksimum süre (milisaniye cinsinden), varsayılan değer `60000` (60 saniye)'dir.

### DB_POOL_EVICT

Bağlantı havuzunun boşta kalan bağlantıları kaldıracağı zaman aralığı (milisaniye cinsinden), varsayılan değer `1000` (1 saniye)'dir.

### DB_POOL_MAX_USES

Bir bağlantının atılıp değiştirilmeden önce kullanılabileceği sayı, varsayılan değer `0` (sınırsız)'dır.

### LOGGER_TRANSPORT

Günlük çıktısı yöntemi, birden fazla değer `,` ile ayrılır. Geliştirme ortamında varsayılan değer `console`, üretim ortamında ise `console,dailyRotateFile`'dır.
Seçenekler:

- `console` - `console.log`
- `file` - Bir dosyaya çıktı
- `dailyRotateFile` - Günlük dönen dosyalara çıktı

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Dosya tabanlı günlük depolama yolu, varsayılan olarak `storage/logs`'tur.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Çıktı günlük seviyesi. Geliştirme ortamında varsayılan değer `debug`, üretim ortamında ise `info`'dur. Seçenekler:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Veritabanı günlük çıktısı seviyesi `debug`'dır ve `DB_LOGGING` tarafından kontrol edilir, `LOGGER_LEVEL`'den etkilenmez.

### LOGGER_MAX_FILES

Saklanacak maksimum günlük dosyası sayısı.

- `LOGGER_TRANSPORT` `file` olduğunda: Varsayılan değer `10`'dur.
- `LOGGER_TRANSPORT` `dailyRotateFile` olduğunda: Günleri temsil etmek için `[n]d` kullanılır. Varsayılan değer `14d`'dir.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Boyuta göre günlük döndürme.

- `LOGGER_TRANSPORT` `file` olduğunda: Birim `byte`'tır. Varsayılan değer `20971520 (20 * 1024 * 1024)`'dir.
- `LOGGER_TRANSPORT` `dailyRotateFile` olduğunda: `[n]k`, `[n]m`, `[n]g` kullanılabilir. Varsayılan olarak yapılandırılmaz.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Günlük yazdırma formatı. Geliştirme ortamında varsayılan `console`, üretim ortamında ise `json`'dır. Seçenekler:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referans: [Günlük Formatı](/log-and-monitor/logger/index.md#日志格式)

### CACHE_DEFAULT_STORE

Sunucunun varsayılan önbellek yöntemini belirten önbellekleme yönteminin benzersiz tanımlayıcısıdır. Varsayılan değer `memory`'dir. Dahili seçenekler şunlardır:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Bellek önbelleğindeki maksimum öğe sayısı, varsayılan değer `2000`'dir.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redis bağlantı URL'si, isteğe bağlıdır. Örnek: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Telemetri veri toplamasını etkinleştirir. Varsayılan değer `off`'tur.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Etkin izleme metrik toplayıcıları. Varsayılan değer `console`'dur. Diğer değerler, ilgili toplayıcı eklentilerinin kayıtlı adlarına (örneğin `prometheus`) başvurmalıdır. Birden fazla değer `,` ile ayrılır.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Etkin izleme veri işlemcileri. Varsayılan değer `console`'dur. Diğer değerler, ilgili işlemci eklentilerinin kayıtlı adlarına başvurmalıdır. Birden fazla değer `,` ile ayrılır.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Deneysel Ortam Değişkenleri

### APPEND_PRESET_LOCAL_PLUGINS

Önceden ayarlanmış yerel eklentileri eklemek için kullanılır. Değer, eklenti paket adıdır (`package.json` dosyasındaki `name` parametresi) ve birden fazla eklenti virgülle ayrılır.

:::info
1. Eklentinin yerel olarak indirildiğinden ve `node_modules` dizininde bulunabildiğinden emin olun. Daha fazla ayrıntı için [Eklenti Organizasyonu](/plugin-development/project-structure) bölümüne bakınız.
2. Ortam değişkeni eklendikten sonra, eklenti yöneticisi sayfasında yalnızca ilk kurulum (`nocobase install`) veya yükseltme (`nocobase upgrade`) işleminden sonra görünecektir.
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Varsayılan olarak kurulan yerleşik eklentileri eklemek için kullanılır. Değer, eklenti paket adıdır (`package.json` dosyasındaki `name` parametresi) ve birden fazla eklenti virgülle ayrılır.

:::info
1. Eklentinin yerel olarak indirildiğinden ve `node_modules` dizininde bulunabildiğinden emin olun. Daha fazla ayrıntı için [Eklenti Organizasyonu](/plugin-development/project-structure) bölümüne bakınız.
2. Ortam değişkeni eklendikten sonra, eklenti ilk kurulum (`nocobase install`) veya yükseltme (`nocobase upgrade`) sırasında otomatik olarak kurulacak veya yükseltilecektir.
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Geçici Ortam Değişkenleri

NocoBase kurulumu sırasında, geçici ortam değişkenleri ayarlayarak kuruluma yardımcı olabilirsiniz, örneğin:

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Şuna eşdeğerdir
yarn nocobase install \
  --lang=en-US \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Şuna eşdeğerdir
yarn nocobase install -l en-US -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Kurulum sırasındaki dil. Varsayılan değer `en-US`'dir. Seçenekler şunlardır:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  nocobase install
```

### INIT_ROOT_EMAIL

Root kullanıcısının e-posta adresi.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Root kullanıcısının parolası.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Root kullanıcısının takma adı.

```bash
yarn cross-env \
  INIT_APP_LANG=en-US \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```