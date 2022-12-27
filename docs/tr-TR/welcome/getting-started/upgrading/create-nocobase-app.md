# `create-nocobase-app` için güncelleme

## Küçük sürüm yükseltmesi

Sadece `nocobase upgrade` güncelleme komutunu çalıştırın

```bash
# Uygulamanızın olduğu dizine geçin
cd my-nocobase-app
# Güncelleme komutunu çalıştırın
yarn nocobase upgrade
# Başlat
yarn dev
```

## Büyük yükseltme

Küçük yükseltme işleminiz başarısız olursa da bu yükseltme yöntemini kullanabilirsiniz.

### 1. Yeni bir NocoBase projesi oluşturun

```bash
## SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres
```

### 2. Proje klasörüne girin

```bash
cd my-nocobase-app
```

### 3. Bağımlılıkları kurun

📢 Bu adım ağ ortamı, sistem yapılandırması ve diğer faktörler nedeniyle on dakikadan fazla sürebilir. 

```bash
yarn install
```

### 4. .env yapılandırmasını değiştirin

Değiştirmek için eski .env sürümüne bakın, veritabanı bilgilerinin doğru şekilde yapılandırılması gerekir. SQLite veritabanının da `. /storage/db/` dizini.

### 5. Eski kod geçişi (gerekli değil)

İş kodu, eklenti geliştirme öğreticisinin yeni sürümüne ve değişiklik için API referansına başvurur.

### 6. Yükseltme komutunu çalıştırın

Kod zaten en son sürüm olduğundan, yükseltme yaparken `--skip-code-update' kod güncellemesini atlamanız gerekir.

```bash
yarn nocobase upgrade --skip-code-update
```

### 7. NocoBase Başlatın

geliştirme ortamı

```bash
yarn dev
```

Ürün yayınlama ortamı

```bash
yarn start # windows platformunda çalışmamaktadır.
```

Not: Üretim ortamı için kod değiştirilmişse, ``yarn build`` komutunu çalıştırmanız ve NocoBase'i yeniden başlatmanız gerekir.