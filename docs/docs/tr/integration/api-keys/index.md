:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# API Anahtarı

## Giriş

## Kurulum

## Kullanım Talimatları

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### API Anahtarı Ekleme

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Önemli Notlar**

- Eklediğiniz API anahtarı mevcut kullanıcıya ait olacak ve mevcut kullanıcının rolünü devralacaktır.
- `APP_KEY` ortam değişkeninin yapılandırıldığından ve gizli tutulduğundan emin olun. Eğer `APP_KEY` değişirse, daha önce eklenmiş tüm API anahtarları geçersiz hale gelecektir.

### APP_KEY Nasıl Yapılandırılır?

Docker sürümü için `docker-compose.yml` dosyasını düzenleyin:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Kaynak koddan veya `create-nocobase-app` ile yapılan kurulumlarda, `.env` dosyasındaki `APP_KEY` değerini doğrudan düzenleyebilirsiniz:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```