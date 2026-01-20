---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Paralel Dallanma

Paralel dallanma düğümü, bir iş akışını birden fazla dala ayırabilir. Her dal farklı düğümlerle yapılandırılabilir ve dal moduna göre yürütme şekli değişir. Birden fazla işlemin aynı anda yürütülmesi gereken senaryolarda paralel dallanma düğümünü kullanabilirsiniz.

## Kurulum

Yerleşik bir eklentidir, kurulum gerektirmez.

## Düğüm Oluşturma

İş akışı yapılandırma arayüzünde, akıştaki artı (“+”) düğmesine tıklayarak bir “Paralel Dallanma” düğümü ekleyin:

![Paralel Dallanma Ekle](https://static-docs.nocobase.com/9e0f3faa0b9335270647a3047759eac.png)

İş akışına bir paralel dallanma düğümü ekledikten sonra, varsayılan olarak iki alt dal eklenir. Ayrıca, dal ekle düğmesine tıklayarak istediğiniz sayıda dal ekleyebilirsiniz. Her dala istediğiniz sayıda düğüm ekleyebilirsiniz. Gereksiz dalları, dalın başlangıcındaki sil düğmesine tıklayarak kaldırabilirsiniz.

![Paralel Dallanmaları Yönet](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Düğüm Yapılandırması

### Dal Modu

Paralel dallanma düğümünün aşağıdaki üç modu bulunur:

-   **Tümü Başarılı**: İş akışı, ancak tüm dallar başarıyla yürütüldüğünde dalların bitiminden sonraki düğümleri yürütmeye devam eder. Aksi takdirde, herhangi bir dal başarısızlık, hata veya başka bir başarılı olmayan durum nedeniyle erken sonlanırsa, tüm paralel dallanma düğümü bu durumla erken sonlanır. Bu aynı zamanda “Tümü modu” olarak da bilinir.
-   **Herhangi Biri Başarılı**: Herhangi bir dal başarıyla yürütüldüğünde iş akışı, dalların bitiminden sonraki düğümleri yürütmeye devam eder. Tüm dallar başarısızlık, hata veya başka bir başarılı olmayan durum nedeniyle erken sonlanmadıkça, tüm paralel dallanma düğümü bu durumla erken sonlanmaz. Bu aynı zamanda “Herhangi Biri modu” olarak da bilinir.
-   **Herhangi Biri Başarılı veya Başarısız**: Herhangi bir dal başarıyla yürütüldüğünde iş akışı, dalların bitiminden sonraki düğümleri yürütmeye devam eder. Ancak, herhangi bir düğüm başarısız olursa, tüm paralel dallanma bu durumla erken sonlanır. Bu aynı zamanda “Yarış modu” olarak da bilinir.

Moddan bağımsız olarak, her dal soldan sağa doğru sırayla yürütülmeye çalışılır. Önceden belirlenmiş dal modunun koşulları karşılandığında, sonraki düğümlere devam edilir veya erken çıkış yapılır.

## Örnek

[Gecikme Düğümü](./delay.md) örneğine bakın.