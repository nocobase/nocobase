:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Zamanlanmış Görevler

## Giriş

Zamanlanmış görevler, zaman koşuluna göre tetiklenen olaylardır ve iki farklı modda çalışır:

- **Özel zaman**: Sistem zamanına göre, cron benzeri düzenli aralıklarla tetiklenir.
- **Koleksiyon zaman alanı**: Bir koleksiyondaki zaman alanının değerine ulaşıldığında tetiklenir.

Sistem, yapılandırılan tetikleme koşullarını karşılayan zaman noktasına (saniye hassasiyetinde) ulaştığında, ilgili iş akışı tetiklenir.

## Temel Kullanım

### Zamanlanmış Görev Oluşturma

İş akışı listesinde yeni bir iş akışı oluştururken, tür olarak “Zamanlanmış Görev”i seçin:

![Zamanlanmış görev oluşturma](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Özel Zaman Modu

Bu standart mod için öncelikle başlangıç zamanını herhangi bir zaman noktası olarak (saniye hassasiyetinde) yapılandırmanız gerekir. Başlangıç zamanı gelecekte bir zaman olabileceği gibi, geçmişte bir zaman da olabilir. Geçmiş bir zaman olarak ayarlandığında, yapılandırılan tekrar koşuluna göre zamanın gelip gelmediği kontrol edilir. Eğer tekrar koşulu yapılandırılmamışsa ve başlangıç zamanı geçmişteyse, iş akışı bir daha tetiklenmez.

Tekrar kuralını yapılandırmanın iki yolu vardır:

- **Aralık bazında**: Başlangıç zamanından sonra sabit aralıklarla tetiklenir; örneğin, her saat, her 30 dakikada bir vb.
- **Gelişmiş mod**: Cron kurallarına göre, belirli bir tarih ve saate ulaşan bir döngü olarak yapılandırılabilir.

Tekrar kuralını yapılandırdıktan sonra, bir bitiş koşulu da belirleyebilirsiniz. Bu, sabit bir zaman noktasında veya belirli bir çalıştırma sayısıyla sınırlanarak sona erebilir.

### Koleksiyon Zaman Alanı Modu

Bir koleksiyonun zaman alanını kullanarak başlangıç zamanını belirlemek, standart zamanlanmış görevleri koleksiyon zaman alanlarıyla birleştiren bir tetikleme modudur. Bu modu kullanmak, belirli süreçlerdeki düğümleri basitleştirebilir ve yapılandırma açısından daha sezgiseldir. Örneğin, süresi dolmuş ödenmemiş siparişlerin durumunu iptal edildi olarak değiştirmek için, sadece koleksiyon zaman alanı modunda bir zamanlanmış görev yapılandırabilir, başlangıç zamanını sipariş oluşturulduktan 30 dakika sonrası olarak seçebilirsiniz.

## İlgili İpuçları

### Çalışmayan veya Durdurulmuş Durumdaki Zamanlanmış Görevler

Yapılandırılan zaman koşulu karşılandığında, ancak NocoBase uygulama hizmetinin tamamı çalışmıyor veya durdurulmuş durumdaysa, o zaman noktasında tetiklenmesi gereken zamanlanmış görev atlanır. Ayrıca, hizmet yeniden başlatıldıktan sonra, atlanan görevler tekrar tetiklenmez. Bu nedenle, kullanırken bu tür durumlar için bir çözüm veya yedek önlemler düşünmeniz gerekebilir.

### Tekrar Sayısı

Bitiş koşulunda "tekrar sayısına göre" seçeneği yapılandırıldığında, aynı iş akışının tüm versiyonlarının toplam çalıştırma sayısı hesaplanır. Örneğin, bir zamanlanmış görev sürüm 1'de 10 kez çalıştırıldıysa ve tekrar sayısı da 10 olarak ayarlandıysa, bu iş akışı bir daha tetiklenmez. Yeni bir sürüme kopyalansa bile, tekrar sayısı 10'dan büyük bir sayıya değiştirilmedikçe tetiklenmeyecektir. Ancak, yeni bir iş akışı olarak kopyalanırsa, çalıştırma sayısı sıfırdan tekrar başlar. İlgili yapılandırmalar değiştirilmediği sürece, yeni iş akışı 10 kez daha tetiklenebilir.

### Tekrar Kurallarında Aralık Zamanı ile Gelişmiş Mod Arasındaki Fark

Tekrar kuralındaki aralık zamanı, son tetiklemenin (veya başlangıç zamanının) zaman noktasına göre belirlenirken, gelişmiş mod sabit zaman noktalarında tetiklenir. Örneğin, her 30 dakikada bir tetiklenecek şekilde yapılandırıldıysa ve son tetikleme 2021-09-01 12:01:23 ise, bir sonraki tetikleme zamanı 2021-09-01 12:31:23 olacaktır. Gelişmiş mod, yani cron modu ise, yapılandırılan kurallar sabit zaman noktalarında tetiklenir. Örneğin, her saatin 01. ve 31. dakikalarında tetiklenecek şekilde yapılandırılabilir.

## Örnek

Oluşturulduktan sonra 30 dakikadan fazla süredir ödemesi tamamlanmamış siparişlerin her dakika kontrol edildiğini ve otomatik olarak iptal edildi durumuna getirildiğini varsayalım. Bunu iki farklı mod kullanarak uygulayacağız.

### Özel Zaman Modu

Zamanlanmış görev tabanlı bir iş akışı oluşturun. Tetikleyici yapılandırmasında “Özel Zaman” modunu seçin, başlangıç zamanını mevcut zamandan daha geç olmayan herhangi bir zaman noktası olarak belirleyin, tekrar kuralını “Her dakika” olarak seçin ve bitiş koşulunu boş bırakın:

![Zamanlanmış Görev_Tetikleyici Yapılandırması_Özel Zaman Modu](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Ardından, iş akışı mantığına göre diğer düğümleri yapılandırın: 30 dakika önceki zamanı hesaplayın ve bu zamandan önce oluşturulmuş, ödenmemiş siparişlerin durumunu iptal edildi olarak değiştirin:

![Zamanlanmış Görev_Tetikleyici Yapılandırması_Özel Zaman Modu](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

İş akışı etkinleştirildikten sonra, başlangıç zamanından itibaren her dakika bir kez tetiklenir. Bu, 30 dakika önceki zamanı hesaplar ve bu zaman noktasından önce oluşturulmuş siparişlerin durumunu iptal olarak günceller.

### Koleksiyon Zaman Alanı Modu

Zamanlanmış görev tabanlı bir iş akışı oluşturun. Tetikleyici yapılandırmasında “Koleksiyon Zaman Alanı” modunu seçin, koleksiyon olarak “Siparişler” tablosunu belirleyin, başlangıç zamanını siparişin oluşturulma zamanından 30 dakika sonrası olarak ayarlayın ve tekrar kuralını “Tekrarlama” olarak seçin:

![Zamanlanmış Görev_Tetikleyici Yapılandırması_Koleksiyon Zaman Alanı Modu_Tetikleyici](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Ardından, iş akışı mantığına göre diğer düğümleri yapılandırın: Tetikleyici veri kimliğine sahip ve durumu “ödenmemiş” olan siparişleri iptal edildi durumuna güncelleyin:

![Zamanlanmış Görev_Tetikleyici Yapılandırması_Koleksiyon Zaman Alanı Modu_Güncelleme Düğümü](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

Özel zaman modundan farklı olarak, burada 30 dakika önceki zamanı hesaplamaya gerek yoktur. Çünkü iş akışı tetikleyici veri bağlamı, zaman koşulunu karşılayan ilgili veri satırını zaten içerir, bu nedenle doğrudan ilgili siparişin durumunu güncelleyebilirsiniz.