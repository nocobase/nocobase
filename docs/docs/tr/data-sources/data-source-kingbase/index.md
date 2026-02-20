---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Veri Kaynağı - KingbaseES Veritabanı

## Giriş

KingbaseES veritabanını bir veri kaynağı olarak kullanabilirsiniz. Hem birincil veritabanı hem de harici bir veritabanı olarak kullanılabilir.

:::uyarı
Şu anda, yalnızca pg modunda çalışan KingbaseES veritabanları desteklenmektedir.
:::

## Kurulum

### Birincil Veritabanı Olarak Kullanım

Kurulum prosedürleri için Kurulum belgelerine bakabilirsiniz. Temel fark, ortam değişkenlerinde yatmaktadır.

#### Ortam Değişkenleri

Aşağıdaki ilgili ortam değişkeni yapılandırmalarını eklemek veya değiştirmek için .env dosyasını düzenleyin:

```bash
# İhtiyaca göre veritabanı parametrelerini ayarlayın.
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker Kurulumu

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### create-nocobase-app Kullanarak Kurulum

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Harici Veritabanı Olarak Kullanım

Kurulum veya yükseltme komutunu çalıştırın:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Eklentiyi Etkinleştirin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Kullanım Kılavuzu

- Birincil Veritabanı: [Ana veri kaynağı](/data-sources/data-source-main/) bölümüne bakın.
- Harici Veritabanı: [Veri Kaynağı / Harici Veritabanı](/data-sources/data-source-manager/external-database) bölümüne bakın.