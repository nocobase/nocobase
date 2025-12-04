---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# API Anahtarları

## Giriş

## Kullanım Talimatları

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API Anahtarı Ekleme

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Notlar**

- Eklediğiniz API anahtarı, mevcut kullanıcıya özeldir ve kullanıcının rolünü devralır.
- Lütfen `APP_KEY` ortam değişkeninin yapılandırıldığından ve gizli tutulduğundan emin olun. Eğer `APP_KEY` değişirse, eklenen tüm API anahtarları geçersiz hale gelecektir.

### APP_KEY Nasıl Yapılandırılır

Docker sürümü kullanıyorsanız, `docker-compose.yml` dosyasını aşağıdaki gibi düzenleyebilirsiniz:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Kaynak koddan veya `create-nocobase-app` ile kurulum yaptıysanız, `.env` dosyasındaki `APP_KEY` değerini doğrudan değiştirebilirsiniz:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```