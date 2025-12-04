:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Doğrulama Kuralları Ayarlama

## Giriş

Doğrulama kuralları, kullanıcıların girdiği verilerin beklentileri karşıladığından emin olmak için kullanılır.

## Alan Doğrulama Kuralları Nerede Ayarlanır?

### Koleksiyon Alanları İçin Doğrulama Kuralları Yapılandırma

Çoğu alan, doğrulama kurallarının yapılandırılmasını destekler. Bir alan doğrulama kurallarıyla yapılandırıldıktan sonra, veri gönderildiğinde arka uç doğrulaması tetiklenir. Farklı alan türleri, farklı doğrulama kurallarını destekler.

- **Tarih alanı**

  ![20251028225946](https://static-docs.nocobase.com/20251028225946.png)

- **Sayı alanı**

  ![20251028230418](https://static-docs.nocobase.com/20251028230418.png)

- **Metin alanı**

  Metin alanları, metin uzunluğunu sınırlamanın yanı sıra, daha ayrıntılı doğrulama için özel düzenli ifadeleri de destekler.

  ![20251028230554](https://static-docs.nocobase.com/20251028230554.png)

### Alan Yapılandırmasında Ön Uç Doğrulaması

Alan yapılandırmasında belirlenen doğrulama kuralları, kullanıcı girişinin kurallara uygun olduğundan emin olmak için ön uç doğrulamasını tetikler.

![20251028230105](https://static-docs.nocobase.com/20251028230105.png)

![20251028230255](https://static-docs.nocobase.com/20251028230255.png)

**Metin alanları** ayrıca belirli format gereksinimlerini karşılamak için özel regex doğrulamayı da destekler.

![20251028230903](https://static-docs.nocobase.com/20251028230903.png)