---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Çok Modlu Sohbet

## Görseller

Modelin desteklemesi durumunda, LLM düğümü modele görseller gönderebilir. Bunu kullanırken, bir değişken aracılığıyla bir ek alanı veya ilişkili bir dosya koleksiyonu kaydı seçmeniz gerekir. Dosya koleksiyonu kaydı seçerken, kaydı nesne düzeyinde seçebilir veya doğrudan URL alanını belirtebilirsiniz.

![](https://static-docs.nocobase.com/202503041034858.png)

Görsel gönderme formatı için iki seçeneğiniz bulunmaktadır:

- URL aracılığıyla gönderin - Yerel olarak depolananlar dışındaki tüm görseller URL şeklinde gönderilir. Yerel olarak depolanan görseller ise gönderilmeden önce base64 formatına dönüştürülür.
- base64 aracılığıyla gönderin - Yerel veya bulut depolamada bulunan tüm görseller base64 formatında gönderilir. Bu seçenek, görsel URL'sinin çevrimiçi LLM hizmeti tarafından doğrudan erişilemediği durumlar için uygundur.

![](https://static-docs.nocobase.com/202503041200638.png)