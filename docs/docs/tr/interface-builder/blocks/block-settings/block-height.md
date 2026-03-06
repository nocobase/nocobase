:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/blocks/block-settings/block-height) bakın.
:::

# Blok Yüksekliği

## Giriş

Blok yüksekliği üç modu destekler: **Varsayılan yükseklik**, **Belirlenmiş yükseklik** ve **Tam yükseklik**. Çoğu blok yükseklik ayarlarını destekler.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Yükseklik Modları

### Varsayılan Yükseklik

Farklı blok türleri için varsayılan yükseklik stratejisi değişiklik gösterir. Örneğin, Tablo ve Form blokları içeriğe göre yüksekliği otomatik olarak ayarlar ve blok içinde kaydırma çubuğu görünmez.

### Belirlenmiş Yükseklik

Bloğun dış çerçevesinin toplam yüksekliğini manuel olarak belirleyebilirsiniz. Blok, kullanılabilir yüksekliği dahili olarak otomatik olarak hesaplar ve atar.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Tam Yükseklik

Tam yükseklik modu, belirlenmiş yüksekliğe benzer; ancak blok yüksekliği, tam ekran maksimum yüksekliğe ulaşmak için mevcut tarayıcı **görüntü alanı (viewport)** temel alınarak hesaplanır. Tarayıcı sayfasında kaydırma çubuğu görünmez; kaydırma çubukları yalnızca bloğun içinde görünür.

Tam yükseklik modunda dahili kaydırma işlemi bloklar arasında biraz farklılık gösterir:

- **Tablo**: `tbody` içinde dahili kaydırma;
- **Form / Detaylar**: Izgara (Grid) içinde kaydırma (işlem alanı dışındaki içerik kaydırması);
- **Liste / Izgara Kartı**: Izgara (Grid) içinde kaydırma (işlem alanı ve sayfalama çubuğu dışındaki içerik kaydırması);
- **Harita / Takvim**: Genel uyarlanabilir yükseklik, kaydırma çubuğu yok;
- **Iframe / Markdown**: Blok çerçevesinin toplam yüksekliğini sınırlar, kaydırma çubukları bloğun içinde görünür.

#### Tam Yükseklik Tablo

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Tam Yükseklik Form

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)