:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Koleksiyon Alanları

## Alanların Arayüz (Interface) Tipleri

NocoBase, alanları Arayüz (Interface) perspektifinden aşağıdaki kategorilere ayırır:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Alan Veri Tipleri

Her Alan Arayüzünün (Interface) varsayılan bir veri tipi bulunur. Örneğin, Arayüzü (Interface) Sayı olan alanlar için varsayılan veri tipi double'dır, ancak float, decimal vb. de olabilir. Şu anda desteklenen veri tipleri şunlardır:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Alan Tipi Eşleştirme

Ana veritabanına yeni alan ekleme süreci şu şekildedir:

1. Arayüz (Interface) tipini seçin.
2. Mevcut Arayüz (Interface) için isteğe bağlı veri tipini yapılandırın.

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Harici veri kaynaklarından alan eşleştirme süreci ise şöyledir:

1. Harici veritabanının alan tipine göre ilgili veri tipini (Alan tipi) ve UI tipini (Alan Arayüzü) otomatik olarak eşleştirir.
2. İhtiyaca göre daha uygun bir veri tipine ve Arayüz (Interface) tipine değiştirin.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)