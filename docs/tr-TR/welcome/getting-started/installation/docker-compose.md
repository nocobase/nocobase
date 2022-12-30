# Docker (👍 Tavsiye edilen)

## 0. Önkoşullar

⚡⚡ [Docker](https://docs.docker.com/get-docker/) sisteminin kurulu olduğuna emin olun.

## 1. NocoBase İndirin

Git ile indirin (veya Zip'i İndirin ve onu nocobase dizinine çıkarın)

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

## 2. Veritabanı seçin (Bir tane seçin)

Terminalde bulunduğunuz dizini indirdiğiniz klasöre göre değiştirip içerisine girin.

```bash
# MacOS, Linux...
cd /your/path/nocobase
# Windows
cd C:\your\path\nocobase
```

Farklı veritabanlarının docker konfigürasyonu birbirinden farklıdır, lütfen kullanmak istediğiniz veritabanın olduğu dizine geçin.

### SQLite

```bash
cd docker/app-sqlite
```

### MySQL

```bash
cd docker/app-mysql
```

### PostgreSQL

```bash
cd docker/app-postgres
```

## 3. docker-compose.yml dosyasını yapılandırın (opsiyonel)

<Alert>

Geliştirici olmayanlar bu adımı atlayabilir. Standart gelen ayarlar ile sisteminiz çalışacaktır. Geliştirmeyi biliyorsanız, `docker-compose.yml`yi nasıl yapılandıracağınız hakkında daha fazla bilgi edinebilirsiniz.

</Alert>

Dizin yapısı (docker ile ilgili)

```bash
├── nocobase
  ├── docker
    ├── app-sqlite
      ├── storage
      ├── docker-compose.yml
    ├── app-mysql
      ├── storage
      ├── docker-compose.yml
    ├── app-postgres
      ├── storage
      ├── docker-compose.yml
```

`docker-compose.yml` için yapılandırma notları:

SQLite sadece uygulama servisine sahiptir, PostgreSQL ve MySQL'in ilgili postgres veya mysql servisi olacaktır, örnek veritabanı servisini kullanabilir veya kendiniz yapılandırabilirsiniz.

```yml
services:
  app:
  postgres:
  mysql:
```

Uygulama portu adresi `http://your-ip:13000/`

```yml
services:
  app:
    ports:
      - "13000:80"
```

NocoBase sürümü ([en son sürüm için burayı tıklayın](https://hub.docker.com/r/nocobase/nocobase/tags)). Yükseltme yaparken, en son sürüme geçmeniz gerekir.

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.78
```

Ortam Değişkenleri

```yml
services:
  app:
    image: nocobase/nocobase:0.7.0-alpha.78
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - LOCAL_STORAGE_BASE_URL=http://localhost:13000/storage/uploads
```

- `DB_*` ilgili veritabanıdır, örneğin varsayılan veritabanı hizmeti değilse, lütfen fiili duruma göre değiştirin.
- 'LOCAL_STORAGE_BASE_URL', yerel depolama için temel URL'dir, yerel bir kurulum değilse, onu ilgili ip veya etki alanı adıyla değiştirmeniz gerekir.

## 4. NocoBase Kurulum ve Başlatma

Birkaç dakika sürebilir

```bash
# arka planda çalıştır
$ docker-compose up -d
# uygulama günlüklerini görüntüle
$ docker-compose logs app

app-sqlite-app-1  | nginx started
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ cross-env DOTENV_CONFIG_PATH=.env node -r dotenv/config packages/app/server/lib/index.js install -s
app-sqlite-app-1  | Done in 2.72s.
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ pm2-runtime start --node-args="-r dotenv/config" packages/app/server/lib/index.js -- start
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: Launching in no daemon mode
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] starting in -fork mode-
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] online
app-sqlite-app-1  | 🚀 NocoBase server running at: http://localhost:13000/
```

## 4. NocoBase Giriş yapıp kullanmaya başlayın

Bir web tarayıcısında [http://localhost:13000](http://localhost:13000) adresini açın. İlk hesap ve parola `admin@nocobase.com` ve `admin123` şeklindedir. Giriş yaptıktan sonra bu bilgileri güvenliğiniz için mutlaka değiştirin.
