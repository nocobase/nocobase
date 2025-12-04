:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Depolama Motoru: Aliyun OSS

Aliyun OSS tabanlı bir depolama motorudur. Kullanmaya başlamadan önce ilgili hesap ve izinleri hazırlamanız gerekir.

## Yapılandırma Parametreleri

![Aliyun OSS Depolama Motoru Yapılandırma Örneği](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Not}
Bu bölüm sadece Aliyun OSS depolama motoruna özel parametreleri tanıtır. Genel parametreler için lütfen [Genel Motor Parametreleri](./index#引擎通用参数) bölümüne bakın.
:::

### Bölge

OSS depolamasının bölgesini girin, örneğin: `oss-cn-hangzhou`.

:::info{title=Not}
[Aliyun OSS Konsolu](https://oss.console.aliyun.com/) üzerinden depolama alanınızın bölge bilgilerini görüntüleyebilirsiniz. Sadece bölge ön ekini kullanmanız yeterlidir (tam alan adına gerek yoktur).
:::

### AccessKey ID

Aliyun yetkilendirme erişim anahtarının ID'sini girin.

### AccessKey Secret

Aliyun yetkilendirme erişim anahtarının Secret'ını girin.

### Depolama Kovası

OSS depolamasının depolama kovası adını girin.

### Zaman Aşımı

Aliyun OSS'e yükleme için zaman aşımı süresini milisaniye cinsinden girin. Varsayılan değer `60000` milisaniyedir (yani 60 saniye).