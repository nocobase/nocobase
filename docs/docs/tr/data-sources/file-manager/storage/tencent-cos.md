:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Tencent COS

Tencent Cloud COS tabanlı bir depolama motorudur. Kullanmadan önce ilgili hesap ve izinleri hazırlamanız gerekmektedir.

## Yapılandırma Seçenekleri

![Tencent COS Yapılandırma Seçenekleri Örneği](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=İpucu}
Bu bölüm sadece Tencent Cloud COS depolama motoruna özel seçenekleri kapsar. Genel parametreler için lütfen [Motor Genel Parametreleri](./index.md#common-engine-parameters) bölümüne bakın.
:::

### Bölge

COS depolamasının bölgesini girin, örneğin: `ap-chengdu`.

:::info{title=İpucu}
Depolama kovasının bölge bilgilerini [Tencent Cloud COS Konsolu](https://console.cloud.tencent.com/cos) üzerinden görüntüleyebilirsiniz ve sadece bölge ön ekini almanız yeterlidir (tam alan adına gerek yoktur).
:::

### SecretId

Tencent Cloud yetkilendirilmiş erişim anahtarının ID'sini girin.

### SecretKey

Tencent Cloud yetkilendirilmiş erişim anahtarının Secret'ını girin.

### Kova

COS kovasının adını girin, örneğin: `qing-cdn-1234189398`.