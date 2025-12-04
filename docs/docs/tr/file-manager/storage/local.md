:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Depolama Motoru: Yerel Depolama

Yüklenen dosyalar, sunucunun yerel sabit disk dizinine kaydedilir. Bu, sistem tarafından yönetilen toplam yüklenen dosya hacminin az olduğu veya deneysel amaçlar için uygun bir senaryodur.

## Yapılandırma Parametreleri

![Dosya depolama motoru yapılandırma örneği](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Not}
Bu bölüm sadece yerel depolama motoruna özel parametreleri tanıtır. Genel parametreler için lütfen [Motor Genel Parametreleri](./index.md#引擎通用参数) bölümüne bakın.
:::

### Yol

Hem sunucuda dosya depolama için kullanılan göreceli yolu hem de URL erişim yolunu ifade eder. Örneğin, "`user/avatar`" (başında veya sonunda eğik çizgi olmadan) şunları temsil eder:

1. Yüklenen dosyaların sunucuda depolandığı göreceli yol: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Dosyalara erişim için URL ön eki: `http://localhost:13000/storage/uploads/user/avatar`.