:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# RAG Sorgulama

## Giriş

Bilgi tabanını yapılandırdıktan sonra, RAG özelliğini AI çalışan ayarlarında etkinleştirebilirsiniz.

RAG etkinleştirildiğinde, bir kullanıcı AI çalışanıyla sohbet ettiğinde, AI çalışanı kullanıcının mesajına göre bilgi tabanından belgeleri almak için RAG sorgulamasını kullanır ve alınan belgelere dayanarak yanıt verir.

## RAG'ı Etkinleştirme

AI çalışan eklenti yapılandırma sayfasına gidin, `AI employees` sekmesine tıklayarak AI çalışan yönetim sayfasına ulaşın.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

RAG'ı etkinleştirmek istediğiniz AI çalışanını seçin, `Edit` (Düzenle) düğmesine tıklayarak AI çalışan düzenleme sayfasına gidin.

`Knowledge base` (Bilgi tabanı) sekmesinde, `Enable` (Etkinleştir) anahtarını açın.

- `Knowledge Base Prompt` (Bilgi Tabanı İstemcisi) alanına, bilgi tabanını referans almak için istemi girin. `{knowledgeBaseData}` sabit bir yer tutucudur ve değiştirilmemelidir;
- `Knowledge Base` (Bilgi Tabanı) alanında, yapılandırılmış bilgi tabanını seçin. Bakınız: [Bilgi Tabanı](/ai-employees/knowledge-base/knowledge-base);
- `Top K` giriş kutusuna, alınacak belge sayısını girin. Varsayılan değer 3'tür;
- `Score` (Puan) giriş kutusuna, sorgulama sırasında belge alaka düzeyi eşiğini girin;

AI çalışan ayarlarını kaydetmek için `Submit` (Gönder) düğmesine tıklayın.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)