:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Genel Bakış

## Giriş

AI Bilgi Tabanı eklentisi, AI çalışanlarına RAG alma yetenekleri sunar.

RAG alma yetenekleri sayesinde, AI çalışanları kullanıcı sorularına yanıt verirken daha doğru, profesyonel ve kurumsal olarak daha alakalı cevaplar sağlayabilir.

Yönetici tarafından sürdürülen bilgi tabanının sağladığı profesyonel alan ve kurumsal iç belgeler kullanılarak, AI çalışanlarının yanıtlarının doğruluğu ve izlenebilirliği artırılır.

### RAG Nedir?

RAG (Retrieval Augmented Generation), "Alma-Artırılmış-Üretim" anlamına gelir.

- **Alma**: Kullanıcının sorusu, bir Embedding modeli (örn. BERT) aracılığıyla vektöre dönüştürülür. Vektör kütüphanesinden, yoğun alma (anlamsal benzerlik) veya seyrek alma (anahtar kelime eşleştirme) yöntemleriyle Top-K ilgili metin parçaları geri çağrılır.
- **Artırma**: Alma sonuçları, orijinal soruyla birleştirilerek artırılmış bir istem (Prompt) oluşturulur ve bu istem, LLM'in bağlam penceresine enjekte edilir.
- **Üretim**: LLM, artırılmış istemi birleştirerek nihai cevabı üretir ve bu sayede olgusallık ile izlenebilirliği sağlar.

## Kurulum

1. Eklenti Yönetimi sayfasına gidin.
2. `AI: Knowledge base` eklentisini bulun ve etkinleştirin.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)