:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/interface-builder/blocks/block-settings/drag-sort) bakın.
:::

# Sürükle ve Bırak Sıralama

## Giriş

Sürükle ve bırak sıralama, bir blok içindeki kayıtları manuel olarak yeniden sıralamak için bir sıralama alanına (sort field) dayanır.


:::info{title=İpucu}
* Aynı sıralama alanı birden fazla blokta sürükle ve bırak sıralama için kullanıldığında, mevcut sıralama düzenini bozabilir.
* Tablolarda sürükle ve bırak sıralama kullanılırken, sıralama alanı için gruplandırma kuralları yapılandırılamaz.
* Ağaç tabloları yalnızca aynı seviyedeki düğümlerin sıralanmasını destekler.

:::


## Yapılandırma

"Sıralama" (Sort) türünde bir alan ekleyin. Bir koleksiyon oluşturulurken sıralama alanları artık otomatik olarak oluşturulmaz; manuel olarak oluşturulmaları gerekir.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Bir tablo için sürükle ve bırak sıralamayı etkinleştirirken, bir sıralama alanı seçmeniz gerekir.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Tablo Satırları için Sürükle ve Bırak Sıralama


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Sıralama Kuralları Açıklaması

Mevcut sıralamanın şu şekilde olduğunu varsayalım:

```
[1,2,3,4,5,6,7,8,9]
```

Bir öğe (örneğin 5) 3'ün konumuna ileri taşındığında, yalnızca 3, 4 ve 5'in sıralama değerleri değişir: 5, 3'ün konumunu alır ve 3 ile 4'ün her biri birer konum geri çekilir.

```
[1,2,5,3,4,6,7,8,9]
```

Ardından 6'yı 8'in konumuna geri taşırsanız, 6, 8'in konumunu alır ve 7 ile 8'in her biri birer konum ileri taşınır.

```
[1,2,5,3,4,7,8,6,9]
```