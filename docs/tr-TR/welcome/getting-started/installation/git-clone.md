# Git kaynak kodlarından derleme

## 0. Önkoşullar

Aşağıdaki gereksinimlere sahip olduğunuza emin olun:

- Node.js 16+, Yarn 1.22.x kurulu olmalı
- SQLite 3.x, MySQL 8.x, PostgreSQL 10.x veritabanlarından birisinin kurulup yapılandırıldığı ve çalışır durumda olduğuna emin olun

## 1. Git ile indirin

```bash
git clone https://github.com/nocobase/nocobase.git my-nocobase-app
```

## 2. Proje klasörüne girin

```bash
cd my-nocobase-app
```

## 3. Bağımlılıkları kurun

```bash
yarn install
```

## 4. Ortam değişkenlerini ayarla

NocoBase tarafından gerekli olan ortam değişkenleri kök `.env` dosyasında saklanır, ortam değişkenlerini gerçek duruma göre değiştirin, eğer onları nasıl değiştireceğinizi bilmiyorsanız, [ortam değişkenleri açıklaması için buraya tıklayın](/api/env) veya varsayılan olarak bırakabilirsiniz.

```bash
# sqlite veritabanını kullan
DB_DIALECT=sqlite
# sqlite dosya yolu
DB_STORAGE=storage/db/nocobase.sqlite
```

## 5. NocoBase Kurun

```bash
yarn nocobase install --lang=tr-TR
```

## 6. NocoBase Başlatın

Geliştirme

```bash
yarn dev
```

Ürün yayınlama

```bash
# Derleme
yarn build
# Başlatma
yarn start # windows platformunda çalışmamaktadır.
```

## 7. NocoBase Giriş yapıp kullanmaya başlayın

Bir web tarayıcısında [http://localhost:13000](http://localhost:13000) adresini açın. İlk hesap ve parola `admin@nocobase.com` ve `admin123` şeklindedir. Giriş yaptıktan sonra bu bilgileri güvenliğiniz için mutlaka değiştirin.
