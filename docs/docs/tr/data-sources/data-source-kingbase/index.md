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
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # Uygulama anahtarı, kullanıcı token'ları vb. oluşturmak için kullanılır.
      # APP_KEY değiştirilirse, eski token'lar da geçersiz olur.
      # Herhangi bir rastgele dize olabilir ve dışarı sızdırılmadığından emin olun.
      - APP_KEY=your-secret-key
      # Veritabanı türü
      - DB_DIALECT=kingbase
      # Veritabanı ana bilgisayarı, gerekirse mevcut veritabanı sunucusu IP'si ile değiştirilebilir.
      - DB_HOST=kingbase
      # Veritabanı adı
      - DB_DATABASE=kingbase
      # Veritabanı kullanıcısı
      - DB_USER=nocobase
      # Veritabanı parolası
      - DB_PASSWORD=nocobase
      # Saat dilimi
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Yalnızca test amaçlı Kingbase hizmeti
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
      ENABLE_CI: no # "no" olarak ayarlanmalıdır
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Yalnızca pg
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