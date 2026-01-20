---
pkg: "@nocobase/plugin-logger"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Günlük Kaydı

## Giriş

Günlükler, sistem sorunlarını tespit etmemize yardımcı olan önemli bir araçtır. NocoBase'in sunucu günlükleri temel olarak arayüz istek günlüklerini ve sistem çalışma günlüklerini içerir; günlük seviyesi, döndürme stratejisi, boyutu ve yazdırma formatı gibi yapılandırmaları destekler. Bu belge, NocoBase sunucu günlükleriyle ilgili içeriği ve günlük **eklentisi** tarafından sağlanan sunucu günlüklerini paketleme ve indirme özelliğini nasıl kullanacağınızı açıklamaktadır.

## Günlük Yapılandırması

Günlük seviyesi, çıktı yöntemi ve yazdırma formatı gibi günlükle ilgili parametreleri [ortam değişkenleri](/get-started/installation/env.md#logger_transport) aracılığıyla yapılandırabilirsiniz.

## Günlük Formatları

NocoBase, 4 farklı günlük formatını yapılandırmayı destekler.

### `console`

Geliştirme ortamında varsayılan formattır, mesajlar vurgulu renklerle gösterilir.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

Üretim ortamında varsayılan formattır.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

Ayırıcı `|` ile ayrılır.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Günlük Dizini

NocoBase günlük dosyalarının ana dizin yapısı şöyledir:

- `storage/logs` - Günlük çıktı dizini
  - `main` - Ana uygulama adı
    - `request_YYYY-MM-DD.log` - İstek günlüğü
    - `system_YYYY-MM-DD.log` - Sistem günlüğü
    - `system_error_YYYY-MM-DD.log` - Sistem hata günlüğü
    - `sql_YYYY-MM-DD.log` - SQL yürütme günlüğü
    - ...
  - `sub-app` - Alt uygulama adı
    - `request_YYYY-MM-DD.log`
    - ...

## Günlük Dosyaları

### İstek Günlüğü

`request_YYYY-MM-DD.log`, arayüz istek ve yanıt günlükleridir.

| Alan          | Açıklama                               |
| ------------- | -------------------------------------- |
| `level`       | Günlük seviyesi                        |
| `timestamp`   | Günlüğün yazıldığı zaman `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` veya `response`              |
| `userId`      | Yalnızca `response` içinde bulunur     |
| `method`      | İstek metodu                           |
| `path`        | İstek yolu                             |
| `req` / `res` | İstek/Yanıt içeriği                    |
| `action`      | İstenen kaynaklar ve parametreler      |
| `status`      | Yanıt durum kodu                       |
| `cost`        | İstek süresi                           |
| `app`         | Mevcut uygulama adı                    |
| `reqId`       | İstek ID'si                            |

:::info{title=Not}
`reqId`, `X-Request-Id` yanıt başlığı aracılığıyla ön uca iletilir.
:::

### Sistem Günlüğü

`system_YYYY-MM-DD.log`, uygulama, ara yazılım, **eklentiler** ve diğer sistem çalışma günlükleridir. `error` seviyesindeki günlükler `system_error_YYYY-MM-DD.log` dosyasına ayrı olarak yazılır.

| Alan        | Açıklama                               |
| ----------- | -------------------------------------- |
| `level`     | Günlük seviyesi                        |
| `timestamp` | Günlüğün yazıldığı zaman `YYYY-MM-DD hh:mm:ss` |
| `message`   | Günlük mesajı                          |
| `module`    | Modül                                  |
| `submodule` | Alt modül                              |
| `method`    | Çağrılan metod                         |
| `meta`      | Diğer ilgili bilgiler, JSON formatında |
| `app`       | Mevcut uygulama adı                    |
| `reqId`     | İstek ID'si                            |

### SQL Yürütme Günlüğü

`sql_YYYY-MM-DD.log`, veritabanı SQL yürütme günlükleridir. `INSERT INTO` ifadeleri yalnızca ilk 2000 karakterle sınırlıdır.

| Alan        | Açıklama                               |
| ----------- | -------------------------------------- |
| `level`     | Günlük seviyesi                        |
| `timestamp` | Günlüğün yazıldığı zaman `YYYY-MM-DD hh:mm:ss` |
| `sql`       | SQL ifadesi                            |
| `app`       | Mevcut uygulama adı                    |
| `reqId`     | İstek ID'si                            |

## Günlükleri Paketleme ve İndirme

1. Günlük yönetimi sayfasına gidin.
2. İndirmek istediğiniz günlük dosyalarını seçin.
3. İndir (Download) düğmesine tıklayın.

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## İlgili Belgeler

- [**Eklenti** Geliştirme - Sunucu - Günlük Kaydı](/plugin-development/server/logger)
- [API Referansı - @nocobase/logger](/api/logger/logger)