# Docker için yükseltme

<Alert>

Bu belgede açıklanan Docker kurulumu, [NocoBase GitHub deposunda](https://github.com/nocobase/nocobase/tree/main/docker) bulunan `docker-compose.yml` yapılandırma dosyasına dayanmaktadır.).

</Alert>

## 1. Daha önce kurduğunuz dizine geçin

Ayrıca duruma göre `docker-compose.yml` dosyasının bulunduğu dizine de geçebilirsiniz.

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

## 2. İmaj sürüm numarasını güncelleyin

`docker-compose.yml` dosyası, uygulama kapsayıcısının görüntüsünü en son sürümle değiştirin.

```yml
services:
  app:
    image: nocobase/nocobase:0.8.0-alpha.1
```

## 3. Eski imajları sil (gerekli değil)

En son imajı kullanıyorsanız, önce ilgili konteyneri(docker imajı) durdurmanız ve silmeniz gerekir.

```bash
# Konteyner ID bul
docker ps
# Konteyneri durdur
docker stop <SİZİN_KONTEYNER_ID_NUMARANIZ>
# Konteyneri sil
docker rm <SİZİN_KONTEYNER_ID_NUMARANIZ>
```

Eski imajı sil

```bash
# İmajı bul
docker images
# İmajı sil
docker rmi <SİZİN_KONTEYNER_ID_NUMARANIZ>
```

## 4. Konteyneri yeniden başlat

```bash
docker-compose up -d app
# Uygulama sürecinin durumunu görüntüleyin
docker-compose logs app
```
