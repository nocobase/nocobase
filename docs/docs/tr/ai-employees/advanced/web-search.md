:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Gelişmiş

## Giriş

Genellikle, büyük dil modellerinin (LLM'ler) verileri güncel olmayabilir ve en yeni bilgilere sahip olmayabilir. Bu nedenle, çevrimiçi LLM hizmet platformları genellikle bir web arama özelliği sunar. Bu özellik sayesinde yapay zeka, yanıt vermeden önce araçları kullanarak bilgi arayabilir ve ardından arama sonuçlarına dayanarak cevap verebilir.

AI çalışanları, çeşitli çevrimiçi LLM hizmet platformlarının web arama özelliğine uyarlanmıştır. Web arama özelliğini AI çalışanı model yapılandırmasında ve sohbetlerde etkinleştirebilirsiniz.

## Web Arama Özelliğini Etkinleştirme

AI çalışanı eklenti yapılandırma sayfasına gidin, `AI employees` sekmesine tıklayarak AI çalışanı yönetim sayfasına ulaşın.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Web arama özelliğini etkinleştirmek istediğiniz AI çalışanını seçin, `Edit` (Düzenle) düğmesine tıklayarak AI çalışanı düzenleme sayfasına gidin.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

`Model settings` (Model Ayarları) sekmesinde, `Web Search` (Web Araması) anahtarını açın ve değişiklikleri kaydetmek için `Submit` (Gönder) düğmesine tıklayın.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Sohbetlerde Web Arama Özelliğini Kullanma

Bir AI çalışanı web arama özelliğini etkinleştirdikten sonra, sohbet giriş kutusunda "Web" simgesi belirecektir. Web araması varsayılan olarak etkindir, kapatmak için simgeye tıklayabilirsiniz.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Web araması etkinleştirildiğinde, AI çalışanının yanıtında web arama sonuçları gösterilecektir.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Platformlar Arası Web Arama Araçları Farklılıkları

Şu anda, AI çalışanının web arama özelliği çevrimiçi LLM hizmet platformuna bağlıdır, bu nedenle kullanıcı deneyiminde farklılıklar olabilir. Belirgin farklılıklar aşağıdadır:

| Platform  | Web Araması | araçlar | Arama terimleriyle gerçek zamanlı yanıt | Yanıtta referans olarak harici bağlantılar döndürür |
| --------- | ----------- | ------- | --------------------------------------- | --------------------------------------------------- |
| OpenAI    | ✅           | ✅       | ✅                                       | ✅                                                   |
| Gemini    | ✅           | ❌       | ❌                                       | ✅                                                   |
| Dashscope | ✅           | ✅       | ❌                                       | ❌                                                   |
| Deepseek  | ❌           | ❌       | ❌                                       | ❌                                                   |