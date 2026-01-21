---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Dışa Aktarma Pro

## Giriş

Dışa Aktarma Pro eklentisi, standart dışa aktarma işlevselliğine ek olarak gelişmiş özellikler sunar.

## Kurulum

Bu eklenti, Asenkron Görev Yönetimi eklentisine bağımlıdır. Kullanmadan önce Asenkron Görev Yönetimi eklentisini etkinleştirmeniz gerekmektedir.

## Özellik Geliştirmeleri

- Asenkron dışa aktarma işlemlerini destekler, bağımsız bir iş parçacığında yürütülür ve büyük miktarda verinin dışa aktarılmasına olanak tanır.
- Eklerin dışa aktarılmasını destekler.

## Kullanım Kılavuzu

### Dışa Aktarma Modu Yapılandırması

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Dışa aktarma düğmesinde, dışa aktarma modunu yapılandırabilirsiniz. Üç farklı mod seçeneği bulunmaktadır:

- **Otomatik:** Dışa aktarma modu, veri hacmine göre belirlenir. Eğer kayıt sayısı 1000'den azsa (ek dışa aktarmalarda 100), senkron dışa aktarma kullanılır. Eğer 1000'den fazlaysa (ek dışa aktarmalarda 100), asenkron dışa aktarma kullanılır.
- **Senkron:** Senkron dışa aktarma kullanır. Bu modda dışa aktarma işlemi ana iş parçacığında çalışır ve küçük ölçekli veriler için uygundur. Senkron modda büyük miktarda veri dışa aktarımı, sistemin tıkanmasına, donmasına ve diğer kullanıcı isteklerini işleyememesine neden olabilir.
- **Asenkron:** Asenkron dışa aktarma kullanır. Bu modda dışa aktarma işlemi bağımsız bir arka plan iş parçacığında yürütülür ve mevcut sistemin kullanımını engellemez.

### Asenkron Dışa Aktarma

Bir dışa aktarma işlemi başlattıktan sonra, süreç bağımsız bir arka plan iş parçacığında çalışır ve manuel kullanıcı yapılandırması gerektirmez. Kullanıcı arayüzünde, bir dışa aktarma işlemi başlattıktan sonra, sağ üst köşede o anda çalışan dışa aktarma görevi ve gerçek zamanlı ilerlemesi gösterilir.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Dışa aktarma tamamlandıktan sonra, dışa aktarma görevlerinden dışa aktarılan dosyayı indirebilirsiniz.

#### Eş Zamanlı Dışa Aktarmalar

Çok sayıda eş zamanlı dışa aktarma görevi, sunucu yapılandırmasından etkilenebilir ve bu da sistem yanıtının yavaşlamasına neden olabilir. Bu nedenle, sistem geliştiricilerinin maksimum eş zamanlı dışa aktarma görevi sayısını (varsayılan 3'tür) yapılandırmaları önerilir. Eş zamanlı görev sayısı yapılandırılan sınırı aştığında, yeni görevler sıraya alınır.

![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Eş zamanlılık yapılandırma yöntemi: Ortam değişkeni `ASYNC_TASK_MAX_CONCURRENCY=eş_zamanlılık_sayısı`

Farklı yapılandırmalar ve veri karmaşıklıklarıyla yapılan kapsamlı testlere dayanarak önerilen eş zamanlılık sayıları şunlardır:
- 2 çekirdekli CPU için 3 eş zamanlı görev.
- 4 çekirdekli CPU için 5 eş zamanlı görev.

#### Performans Hakkında

Dışa aktarma sürecinin anormal derecede yavaş olduğunu fark ettiğinizde (aşağıdaki tabloya bakınız), bu durum koleksiyon yapısından kaynaklanan bir performans sorunu olabilir.

| Veri Özellikleri | İndeks Tipi | Veri Hacmi | Dışa Aktarma Süresi |
|-----------------|-----------------------------|------------|---------------------|
| İlişkisel Alan Yok | Birincil Anahtar / Benzersiz Kısıtlama | 1 milyon | 3-6 dakika |
| İlişkisel Alan Yok | Normal İndeks | 1 milyon | 6-10 dakika |
| İlişkisel Alan Yok | Bileşik İndeks (benzersiz olmayan) | 1 milyon | 30 dakika |
| İlişkisel Alanlar<br>(Bire Bir, Bire Çok,<br>Çoka Bir, Çoka Çok) | Birincil Anahtar / Benzersiz Kısıtlama | 500 bin | 15-30 dakika | İlişkisel alanlar performansı düşürür |

Verimli dışa aktarmalar sağlamak için şunları yapmanızı öneririz:
1. Koleksiyon aşağıdaki koşulları karşılamalıdır:

| Koşul Tipi | Gerekli Koşul | Diğer Notlar |