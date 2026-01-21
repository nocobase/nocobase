:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# `create-nocobase-app` Kurulumunu Yükseltme

:::warning Yükseltme Öncesi Hazırlık

- Lütfen öncelikle veritabanını yedeklediğinizden emin olun.
- Çalışan NocoBase örneğini durdurun.

:::

## 1. Çalışan NocoBase Örneğini Durdurun

Eğer arka planda çalışmayan bir süreçse, `Ctrl + C` ile durdurabilirsiniz. Üretim ortamında ise durdurmak için `pm2-stop` komutunu çalıştırın.

```bash
yarn nocobase pm2-stop
```

## 2. Yükseltme Komutunu Çalıştırın

Sadece `yarn nocobase upgrade` komutunu çalıştırmanız yeterlidir.

```bash
# İlgili dizine geçin
cd my-nocobase-app
# Yükseltme komutunu çalıştırın
yarn nocobase upgrade
# Başlatın
yarn dev
```

### Belirli Bir Sürüme Yükseltme

Projenizin kök dizinindeki `package.json` dosyasını düzenleyerek `@nocobase/cli` ve `@nocobase/devtools` paketlerinin sürüm numaralarını değiştirebilirsiniz (yalnızca yükseltme yapabilirsiniz, düşürme yapamazsınız). Örneğin:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Ardından yükseltme komutunu çalıştırın:

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```