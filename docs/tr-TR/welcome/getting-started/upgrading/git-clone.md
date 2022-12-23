# Git kaynak kodundan güncelleme

## 1. NocoBase Proje klasörüne girin

```bash
cd my-nocobase-app
```

## 2. En son kodu çekin

```bash
git pull
```

## 3. Bağımlılıkları güncelle

```bash
yarn install
```

## 4. Güncelleme komutunu çalıştırın

```bash
yarn nocobase upgrade
```

## 5. NocoBase Başlatın

geliştirme ortamı

```bash
yarn dev
```

Ürün yayınlama ortamı

```bash
# Derle
yarn build

# Başlat
yarn start # windows platformunda çalışmamaktadır.
```

