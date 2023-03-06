# `create-nocobase-app`

## 0. Önkoşullar

Aşağıdaki gereksinimlere sahip olduğunuza emin olun:

- Node.js 16+, Yarn 1.22.x kurulu olmalı
- SQLite 3.x, MySQL 8.x, PostgreSQL 10.x veritabanlarından birisinin kurulup yapılandırıldığı ve çalışır durumda olduğuna emin olun

Lütfen Node.js 16.x veya üstünün kurulu olduğundan emin olun. En son LTS sürümünü resmi web sitesinden indirebilir ve yükleyebilirsiniz. Node.js ile uzun süre çalışmayı planlıyorsanız, Node.js sürümlerini yönetmek için nvm (veya Win sistemleri için nvm-windows) kullanmanız önerilir.

```bash
$ node -v

v16.13.2
```

yarn paket yöneticisini kurun

```bash
$ npm install --global yarn
$ yarn -v

1.22.10
```

## 1. NocoBase projesi oluştur

```bash
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql \
   -e DB_HOST=localhost \
   -e DB_PORT=3306 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres \
   -e DB_HOST=localhost \
   -e DB_PORT=5432 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
```

## 2. Proje klasörüne girin

```bash
cd my-nocobase-app
```

## 3. Bağımlılıkları kurun

📢 Bu adım, ağ ortamı, sistem yapılandırması ve diğer faktörler nedeniyle on dakikadan fazla sürebilir. 

```bash
yarn install
```

## 4. NocoBase Kurun

```bash
yarn nocobase install --lang=tr-TR
```

## 5. NocoBase Başlatın

Geliştirme

```bash
yarn dev
```

Ürün yayınlama

```bash
yarn start # windows platformunda çalışmamaktadır.
```

Not: Üretim için, kod değiştirilmişse, "yarn build"i çalıştırmanız ve NocoBase'i yeniden başlatmanız gerekir.

## 6. NocoBase Giriş yapıp kullanmaya başlayın

Bir web tarayıcısında [http://localhost:13000](http://localhost:13000) adresini açın. İlk hesap ve parola `admin@nocobase.com` ve `admin123` şeklindedir. Giriş yaptıktan sonra bu bilgileri güvenliğiniz için mutlaka değiştirin.
