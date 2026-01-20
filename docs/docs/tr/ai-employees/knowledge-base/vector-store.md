:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Vektör Deposu

## Giriş

Bir bilgi tabanında, belgeleri kaydederken veya arama yaparken, hem belgelerin hem de arama terimlerinin vektörleştirilmesi gerekir. Bu işlemlerin her ikisi de orijinal metni vektörleştirmek için bir `Embedding model` kullanılmasını gerektirir.

AI Bilgi Tabanı eklentisinde, vektör deposu bir `Embedding model` ile bir vektör veritabanının birleşimidir.

## Vektör Deposu Yönetimi

AI Çalışanları eklentisi yapılandırma sayfasına gidin, `Vector store` sekmesine tıklayın ve vektör deposu yönetim sayfasına erişmek için `Vector store` seçeneğini belirleyin.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Sağ üst köşedeki `Add new` düğmesine tıklayarak yeni bir vektör deposu ekleyin:

- `Name` giriş kutusuna vektör deposu adını girin;
- `Vector store` alanında önceden yapılandırılmış bir vektör veritabanı seçin. Bakınız: [Vektör Veritabanı](/ai-employees/knowledge-base/vector-database);
- `LLM service` alanında önceden yapılandırılmış bir LLM hizmeti seçin. Bakınız: [LLM Hizmet Yönetimi](/ai-employees/quick-start/llm-service);
- `Embedding model` giriş kutusuna kullanılacak `Embedding` modelinin adını girin;

`Submit` düğmesine tıklayarak vektör deposu bilgilerini kaydedin.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)