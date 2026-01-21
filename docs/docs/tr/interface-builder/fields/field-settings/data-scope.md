:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veri Kapsamını Ayarlama

## Giriş

İlişki alanları için veri kapsamını ayarlamak, bir bloğun veri kapsamını ayarlamaya benzer. Bu ayar, ilişkili veriler için varsayılan filtreleme koşullarını belirler.

## Kullanım Talimatları

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Statik Değer

Örnek: Yalnızca silinmemiş ürünler ilişkilendirme için seçilebilir.

> Alan listesi, ilişki alanının hedef koleksiyonundaki alanları içerir.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Değişken Değer

Örnek: Yalnızca hizmet tarihi sipariş tarihinden sonra olan ürünler ilişkilendirme için seçilebilir.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Değişkenler hakkında daha fazla bilgi için [Değişkenler](/interface-builder/variables) bölümüne bakabilirsiniz.

### İlişki Alanı Bağlantısı

İlişki alanları arasındaki bağlantı, veri kapsamı ayarlanarak sağlanır.

Örnek: Siparişler koleksiyonunda "Fırsat Ürünü" adında Bire Çok ilişki alanı ve "Fırsat" adında Çoka Bir ilişki alanı bulunmaktadır. Fırsat Ürünü koleksiyonunda ise "Fırsat" adında Çoka Bir ilişki alanı mevcuttur. Sipariş formu bloğunda, "Fırsat Ürünü" için seçilebilir veriler, formda o an seçili olan "Fırsat" ile ilişkili fırsat ürünlerini gösterecek şekilde filtrelenir.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)