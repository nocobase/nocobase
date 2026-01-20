:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Git Kaynak Kurulumunun Yükseltilmesi

:::warning Yükseltme Öncesi Hazırlıklar

- Veritabanınızı mutlaka yedekleyin.
- Çalışan NocoBase örneğini durdurun (`Ctrl + C`).

:::

## 1. NocoBase Proje Dizinine Geçin

```bash
cd my-nocobase-app
```

## 2. En Son Kodu Çekin

```bash
git pull
```

## 3. Önbelleği ve Eski Bağımlılıkları Silin (İsteğe Bağlı)

Normal yükseltme işlemi başarısız olursa, önbelleği ve bağımlılıkları temizleyip ardından yeniden indirmeyi deneyebilirsiniz.

```bash
# NocoBase önbelleğini temizleyin
yarn nocobase clean
# Bağımlılıkları silin
yarn rimraf -rf node_modules # rm -rf node_modules ile aynıdır
```

## 4. Bağımlılıkları Güncelleyin

📢 Ağ ortamı, sistem yapılandırması gibi faktörler nedeniyle bu adım on dakikadan fazla sürebilir.

```bash
yarn install
```

## 5. Yükseltme Komutunu Çalıştırın

```bash
yarn nocobase upgrade
```

## 6. NocoBase'i Başlatın

```bash
yarn dev
```

:::tip Üretim Ortamı İpucu

Kaynak koddan kurulan NocoBase'i doğrudan bir üretim ortamında dağıtmanız önerilmez (üretim ortamları için lütfen [Üretim Ortamında Dağıtım](../deployment/production.md) bölümüne bakın).

:::

## 7. Üçüncü Taraf Eklentilerin Yükseltilmesi

[Eklentileri Kurma ve Yükseltme](../install-upgrade-plugins.mdx) bölümüne bakın.