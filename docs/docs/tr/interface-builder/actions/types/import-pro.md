---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Pro İçe Aktarma

## Giriş

Pro İçe Aktarma eklentisi, standart içe aktarma işlevselliğine ek olarak gelişmiş özellikler sunar.

## Kurulum

Bu eklenti, Asenkron Görev Yönetimi eklentisine bağımlıdır. Kullanmadan önce Asenkron Görev Yönetimi eklentisini etkinleştirmeniz gerekir.

## Geliştirilmiş Özellikler

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Asenkron içe aktarma işlemlerini destekler, ayrı bir iş parçacığında yürütülür ve büyük miktarda veri içe aktarımını mümkün kılar.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Gelişmiş içe aktarma seçeneklerini destekler.

## Kullanım Kılavuzu

### Asenkron İçe Aktarma

Bir içe aktarma işlemi başlattıktan sonra, bu süreç ayrı bir arka plan iş parçacığında yürütülür ve manuel kullanıcı yapılandırması gerektirmez. Kullanıcı arayüzünde, içe aktarma işlemi başlatıldıktan sonra sağ üst köşede o anki içe aktarma görevi ve gerçek zamanlı ilerlemesi gösterilir.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

İçe aktarma tamamlandıktan sonra, sonuçları içe aktarma görevleri bölümünde görüntüleyebilirsiniz.

#### Performans Hakkında

Büyük ölçekli veri içe aktarımlarının performansını değerlendirmek amacıyla, farklı senaryolar, alan türleri ve tetikleyici yapılandırmaları altında karşılaştırmalı testler gerçekleştirdik (sonuçlar sunucu ve veritabanı yapılandırmalarına göre değişiklik gösterebilir ve yalnızca referans amaçlıdır):

| Veri Hacmi | Alan Türleri | İçe Aktarma Yapılandırması | İşlem Süresi |
|------|---------|---------|---------|
| 1 milyon kayıt | Metin, Sayı, Tarih, E-posta, Uzun Metin | • İş akışı Tetikle: Hayır<br>• Tekrar Eden Tanımlayıcı: Yok | Yaklaşık 1 dakika |
| 500.000 kayıt | Metin, Sayı, Tarih, E-posta, Uzun Metin, Çoktan Çoka | • İş akışı Tetikle: Hayır<br>• Tekrar Eden Tanımlayıcı: Yok | Yaklaşık 16 dakika|
| 500.000 kayıt | Metin, Sayı, Tarih, E-posta, Uzun Metin, Çoktan Çoka, Çoktan Bire | • İş akışı Tetikle: Hayır<br>• Tekrar Eden Tanımlayıcı: Yok | Yaklaşık 22 dakika |
| 500.000 kayıt | Metin, Sayı, Tarih, E-posta, Uzun Metin, Çoktan Çoka, Çoktan Bire | • İş akışı Tetikle: Asenkron tetikleme bildirimi<br>• Tekrar Eden Tanımlayıcı: Yok | Yaklaşık 22 dakika |
| 500.000 kayıt | Metin, Sayı, Tarih, E-posta, Uzun Metin, Çoktan Çoka, Çoktan Bire | • İş akışı Tetikle: Asenkron tetikleme bildirimi<br>• Tekrar Eden Tanımlayıcı: Tekrar edenleri güncelle, 50.000 tekrar eden kayıt var | Yaklaşık 3 saat |

Yukarıdaki performans test sonuçlarına ve mevcut bazı tasarımlara dayanarak, etkileyen faktörlere ilişkin aşağıdaki açıklamalar ve öneriler sunulmuştur:

1.  **Tekrar Eden Kayıt İşleme Mekanizması**: **Tekrar eden kayıtları güncelle** veya **Yalnızca tekrar eden kayıtları güncelle** seçenekleri belirlendiğinde, sistem her bir satır için sorgulama ve güncelleme işlemleri yapar, bu da içe aktarma verimliliğini önemli ölçüde düşürür. Excel dosyanızda gereksiz tekrar eden veriler varsa, bu durum içe aktarma hızını daha da olumsuz etkileyecektir. Gereksiz zaman kaybını önlemek için, içe aktarmadan önce Excel dosyanızdaki gereksiz tekrar eden verileri temizlemeniz (örneğin, profesyonel tekilleştirme araçları kullanarak) ve ardından sisteme aktarmanız önerilir.

2.  **İlişki Alanı İşleme Verimliliği**: Sistem, ilişki alanlarını her bir satır için ilişkilendirmeleri sorgulayarak işler; bu da büyük veri hacimli senaryolarda performans darboğazı oluşturabilir. Basit ilişki yapıları (örneğin, iki **koleksiyon** arasında bire çok ilişki) için, çok adımlı bir içe aktarma stratejisi önerilir: önce ana **koleksiyonun** temel verilerini içe aktarın ve bu işlem tamamlandıktan sonra **koleksiyonlar** arasındaki ilişkiyi kurun. İş gereksinimleri ilişki verilerinin eş zamanlı olarak içe aktarılmasını zorunlu kılıyorsa, içe aktarma sürenizi makul bir şekilde planlamak için yukarıdaki tablodaki performans test sonuçlarına başvurunuz.

3.  **İş Akışı Tetikleme Mekanizması**: Büyük ölçekli veri içe aktarma senaryolarında **iş akışı** tetikleyicilerini etkinleştirmeniz önerilmez. Bunun başlıca iki nedeni şunlardır:
    -   İçe aktarma görevinin durumu %100 gösterse bile, işlem hemen bitmez. Sistem, **iş akışı** yürütme planlarının oluşturulması için ek zamana ihtiyaç duyar. Bu aşamada, sistem her içe aktarılan kayıt için ilgili bir **iş akışı** yürütme planı oluşturur, bu da içe aktarma iş parçacığını meşgul eder ancak zaten içe aktarılmış verilerin kullanımını etkilemez.
    -   İçe aktarma görevi tamamen tamamlandıktan sonra, çok sayıda **iş akışının** eş zamanlı yürütülmesi sistem kaynaklarını zorlayabilir, bu da genel sistem yanıt hızını ve kullanıcı deneyimini olumsuz etkileyebilir.

Yukarıdaki 3 etkileyici faktör, gelecekte daha fazla optimizasyon için değerlendirilecektir.

### İçe Aktarma Yapılandırması

#### İçe Aktarma Seçenekleri - İş Akışı Tetikle

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

İçe aktarma sırasında **iş akışlarını** tetikleyip tetiklemeyeceğinizi seçebilirsiniz. Bu seçenek işaretlenirse ve ilgili **koleksiyon** bir **iş akışına** (koleksiyon olayı) bağlıysa, içe aktarma her satır için **iş akışı** yürütmesini tetikleyecektir.

#### İçe Aktarma Seçenekleri - Tekrar Eden Kayıtları Tanımla

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Bu seçeneği işaretleyip ilgili modu belirlediğinizde, içe aktarma sırasında tekrar eden kayıtlar tanımlanacak ve işlenecektir.

İçe aktarma yapılandırmasındaki seçenekler varsayılan değerler olarak uygulanacaktır. Yöneticiler, yükleyicinin bu seçenekleri (iş akışı tetikleme seçeneği hariç) değiştirmesine izin verilip verilmeyeceğini kontrol edebilir.

**Yükleyici İzin Ayarları**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Yükleyicinin içe aktarma seçeneklerini değiştirmesine izin ver

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Yükleyicinin içe aktarma seçeneklerini değiştirmesini engelle

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Mod Açıklaması

- Tekrar eden kayıtları atla: 'Tanımlayıcı alan' içeriğine göre mevcut kayıtları sorgular. Kayıt zaten varsa, bu satır doğrudan atlanır; yoksa, yeni bir kayıt olarak içe aktarılır.
- Tekrar eden kayıtları güncelle: 'Tanımlayıcı alan' içeriğine göre mevcut kayıtları sorgular. Kayıt zaten varsa, bu kayıt güncellenir; yoksa, yeni bir kayıt olarak içe aktarılır.
- Yalnızca tekrar eden kayıtları güncelle: 'Tanımlayıcı alan' içeriğine göre mevcut kayıtları sorgular. Kayıt zaten varsa, bu kayıt güncellenir; yoksa, atlanır.

##### Tanımlayıcı Alan

Sistem, bir satırın tekrar eden bir kayıt olup olmadığını bu alanın değerine göre belirler.

- [Bağlantı Kuralı](/interface-builder/actions/action-settings/linkage-rule): Düğmeleri dinamik olarak göster/gizle;
- [Düğmeyi Düzenle](/interface-builder/actions/action-settings/edit-button): Düğmenin başlığını, türünü ve simgesini düzenleyin;