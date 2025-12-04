:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# İş Akışı Bağlama

## Giriş

Bazı işlem butonlarında, ilgili gönderim işlemini bir iş akışıyla ilişkilendirmek ve verilerin otomatik olarak işlenmesini sağlamak için bağlı bir iş akışı yapılandırabilirsiniz.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Desteklenen İşlemler ve İş Akışı Türleri

Şu anda bağlamayı destekleyen işlem butonları ve iş akışı türleri aşağıdaki gibidir:

| İşlem Butonu \ İş Akışı Türü | İşlem öncesi olay | İşlem sonrası olay | Onay olayı | Özel işlem olayı |
| --- | --- | --- | --- | --- |
| Formun "Gönder", "Kaydet" butonları | ✅ | ✅ | ✅ | ❌ |
| Veri satırlarındaki (Tablo, Liste vb.) "Kaydı Güncelle" butonu | ✅ | ✅ | ✅ | ❌ |
| Veri satırlarındaki (Tablo, Liste vb.) "Sil" butonu | ✅ | ❌ | ❌ | ❌ |
| "İş Akışını Tetikle" butonu | ❌ | ❌ | ❌ | ✅ |

## Birden Fazla İş Akışı Bağlama

Bir işlem butonu birden fazla iş akışına bağlanabilir. Birden fazla iş akışı bağlandığında, yürütme sırası aşağıdaki kurallara uyar:

1. Aynı tetikleyici türündeki iş akışlarında, senkron iş akışları önce, asenkron iş akışları sonra yürütülür.
2. Aynı tetikleyici türündeki iş akışları, yapılandırılan sıraya göre yürütülür.
3. Farklı tetikleyici türündeki iş akışları arasında:
    1. İşlem öncesi olaylar, her zaman işlem sonrası ve onay olaylarından önce yürütülür.
    2. İşlem sonrası ve onay olaylarının belirli bir sırası yoktur ve iş mantığı yapılandırma sırasına bağlı olmamalıdır.

## Daha Fazla Bilgi

Farklı iş akışı olay türleri için, ilgili eklentilerin detaylı tanıtımlarına başvurabilirsiniz:

* [İşlem sonrası olay]
* [İşlem öncesi olay]
* [Onay olayı]
* [Özel işlem olayı]