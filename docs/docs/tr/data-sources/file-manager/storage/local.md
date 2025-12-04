:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Yerel Depolama

Yüklenen dosyalar sunucunun yerel disk dizinine kaydedilir. Bu yöntem, sistem tarafından yönetilen toplam dosya miktarının az olduğu veya deneysel kullanımlar için uygundur.

## Yapılandırma Parametreleri

![Dosya depolama motoru yapılandırma örneği](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Not}
Bu bölümde yalnızca yerel depolama motoruna özel parametreler açıklanmaktadır. Genel parametreler için lütfen [Motor Genel Parametreleri](./index.md#motor-genel-parametreleri) bölümüne bakın.
:::

### Yol

Yol, hem dosyanın sunucuda depolandığı göreceli yolu hem de URL erişim yolunu ifade eder. Örneğin, başında ve sonunda “`/`” olmayan “`user/avatar`” ifadesi şunları temsil eder:

1. Yüklenen dosyanın sunucuda depolandığı göreceli yol: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Dosyaya erişim için URL öneki: `http://localhost:13000/storage/uploads/user/avatar`.