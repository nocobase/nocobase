:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Tencent Cloud COS

Tencent Cloud COS tabanlı bir depolama motorudur. Kullanmadan önce ilgili hesap ve izinleri hazırlamanız gerekmektedir.

## Yapılandırma Parametreleri

![Tencent COS Depolama Motoru Yapılandırma Örneği](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Not}
Bu bölüm sadece Tencent Cloud COS depolama motoruna özel parametreleri tanıtmaktadır. Genel parametreler için lütfen [Motor Genel Parametreleri](./index.md#general-engine-parameters) bölümüne bakınız.
:::

### Bölge

COS depolaması için bölgeyi girin, örneğin: `ap-chengdu`.

:::info{title=Not}
Depolama alanınızın bölge bilgilerini [Tencent Cloud COS Konsolu](https://console.cloud.tencent.com/cos) üzerinden görüntüleyebilirsiniz. Sadece bölge ön ekini kullanmanız yeterlidir (tam alan adına gerek yoktur).
:::

### SecretId

Tencent Cloud yetkilendirilmiş erişim anahtarınızın ID'sini girin.

### SecretKey

Tencent Cloud yetkilendirilmiş erişim anahtarınızın Secret'ını girin.

### Bucket

COS Bucket'ının adını girin, örneğin: `qing-cdn-1234189398`.