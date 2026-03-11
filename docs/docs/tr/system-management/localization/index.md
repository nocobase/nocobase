:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/system-management/localization/index) bakın.
:::

# Yerelleştirme Yönetimi

## Giriş

Yerelleştirme yönetimi eklentisi, NocoBase'in yerelleştirme kaynaklarını yönetmek ve uygulamak için kullanılır; sistem menülerini, koleksiyonları, alanları ve tüm eklentileri belirli bölgelerin dil ve kültürüne uyarlamak için çevirebilirsiniz.

## Kurulum

Bu eklenti yerleşik bir eklentidir ve ek kurulum gerektirmez.

## Kullanım Talimatları

### Eklentiyi Etkinleştirme

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Yerelleştirme Yönetimi Sayfasına Giriş

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Çeviri Girdilerini Senkronize Etme

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Şu anda aşağıdaki içeriklerin senkronize edilmesi desteklenmektedir:

- Sistem ve eklentilerin yerel dil paketleri
- Koleksiyon başlıkları, alan başlıkları ve alan seçeneği etiketleri
- Menü başlıkları

Senkronizasyon tamamlandıktan sonra sistem, mevcut dil için tüm çevrilebilir girdileri listeleyecektir.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=İpucu}
Farklı modüllerde aynı orijinal metin girdileri bulunabilir, bunların ayrı ayrı çevrilmesi gerekir.
:::

### Otomatik Olarak Girdi Oluşturma

Sayfa düzenleme sırasında, her bloktaki özel metinler otomatik olarak ilgili girdileri oluşturacak ve mevcut dil için çeviri içeriğini eş zamanlı olarak üretecektir.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=İpucu}
Kod içinde metin tanımlarken ns (namespace) manuel olarak belirtilmelidir, örneğin: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Çeviri İçeriğini Düzenleme

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Çeviriyi Yayınlama

Çeviri tamamlandıktan sonra, değişikliklerin geçerli olması için "Yayınla" düğmesine tıklamanız gerekir.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Diğer Dilleri Çevirme

"Sistem Ayarları" kısmında Basitleştirilmiş Çince gibi diğer dilleri etkinleştirin.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Bu dil ortamına geçiş yapın.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Girdileri senkronize edin.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Çevirin ve yayınlayın.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>